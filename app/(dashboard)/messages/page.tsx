'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { analyzeMessage } from '@/lib/safety/analyzeMessage';
import { autoFlagMessageIfUnsafe, MESSAGE_RISK_THRESHOLD } from '@/lib/safety/digitalSafetyEngine';
import Link from 'next/link';
import { MessageSquare, Send, User, Loader2 } from 'lucide-react';

interface ChatUser {
  user_id: string;
  full_name: string;
  username: string;
}

interface MessageItem {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: string;
  created_at: string;
  sender?: ChatUser | null;
  receiver?: ChatUser | null;
}

interface ConversationItem {
  user: ChatUser;
  lastMessage: MessageItem;
  unread: number;
}

export default function MessagesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pendingClientMessageId, setPendingClientMessageId] = useState<string | null>(null);
  const [pendingClientMessageText, setPendingClientMessageText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const [partnerSafetyMaxRisk, setPartnerSafetyMaxRisk] = useState<Record<string, number>>({});

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    async function refreshConversations(uid: string) {
      const { data: msgs } = await supabase.from('messages').select(`
        *, sender:users!messages_sender_id_fkey(user_id, full_name, username),
        receiver:users!messages_receiver_id_fkey(user_id, full_name, username)
      `).or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .eq('is_deleted', false).order('created_at', { ascending: false });

      const convMap: Record<string, ConversationItem> = {};
      (msgs as MessageItem[] | null)?.forEach((m) => {
        const partner = m.sender_id === uid ? m.receiver : m.sender;
        if (!partner) return;
        if (!convMap[partner.user_id]) {
          convMap[partner.user_id] = { user: partner, lastMessage: m, unread: 0 };
        }
        if (m.receiver_id === uid && m.status !== 'read') convMap[partner.user_id].unread++;
      });

      if (!mounted) return;
      setConversations(Object.values(convMap));
    }

    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: p } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();
      if (!mounted) return;
      if (!p) {
        setLoading(false);
        return;
      }

      setUserId(p.user_id);
      userIdRef.current = p.user_id;

      await refreshConversations(p.user_id);
      setLoading(false);
    }

    void init();

    const channel = supabase.channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        const uid = userIdRef.current;
        if (!uid) return;
        void refreshConversations(uid);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function loadConversation(partnerId: string, partner: ChatUser) {
    if (!userId) return;
    setSelectedUser(partner);

    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .eq('is_deleted', false).order('created_at', { ascending: true });
    setMessages((data as MessageItem[] | null) || []);

    await supabase.from('messages').update({ status: 'read' })
      .eq('sender_id', partnerId).eq('receiver_id', userId).neq('status', 'read');

    // Safety signals for this partner (best-effort; doesn't block chat).
    try {
      const { data: safetyReports } = await supabase.from('scam_reports')
        .select('risk_score')
        .eq('user_id', userId)
        .eq('scam_type', 'messaging')
        .eq('reported_account', partnerId)
        .order('timestamp', { ascending: false })
        .limit(10);

      const maxRisk = (safetyReports || []).reduce((acc, r) => {
        const risk = (r && typeof (r as { risk_score?: unknown }).risk_score === 'number')
          ? (r as { risk_score: number }).risk_score
          : 0;
        return Math.max(acc, risk);
      }, 0);

      setPartnerSafetyMaxRisk((prev) => ({ ...prev, [partnerId]: maxRisk }));
    } catch {
      // If the backend schema differs, keep chat UI working.
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedUser || !userId) return;
    if (sending) return;
    setSending(true);
    const messageText = newMessage.trim();

    let clientMessageId = pendingClientMessageId;
    if (!clientMessageId || pendingClientMessageText !== messageText) {
      clientMessageId = crypto.randomUUID();
      setPendingClientMessageId(clientMessageId);
      setPendingClientMessageText(messageText);
    }

    try {
      const { error } = await supabase.rpc('send_message', {
        p_receiver_id: selectedUser.user_id,
        p_content: messageText,
        p_client_message_id: clientMessageId,
        p_conversation_id: null,
      });

      if (error) {
        console.error('send_message rpc failed:', error);
        return;
      }

      void autoFlagMessageIfUnsafe({
        supabase,
        senderUserId: userId,
        receiverUserId: selectedUser.user_id,
        content: messageText,
      });

      setNewMessage('');
      setPendingClientMessageId(null);
      setPendingClientMessageText('');
      await loadConversation(selectedUser.user_id, selectedUser);
    } catch (err) {
      console.error('send_message rpc exception:', err);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[60vh]">
        <Card className="p-3 md:col-span-1 overflow-y-auto max-h-[70vh]">
          <h2 className="font-semibold text-sm text-slate-900 mb-3">Conversations</h2>
          {conversations.length > 0 ? conversations.map((c) => (
            <button key={c.user.user_id} onClick={() => loadConversation(c.user.user_id, c.user)}
              className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                selectedUser?.user_id === c.user.user_id ? 'bg-purple-50' : 'hover:bg-slate-50'}`}>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{c.user.full_name}</div>
                <div className="text-xs text-slate-400 truncate">{c.lastMessage.content}</div>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center">{c.unread}</span>
              )}
            </button>
          )) : (
            <p className="text-sm text-slate-500 text-center py-8">No conversations yet</p>
          )}
        </Card>

        <Card className="p-3 md:col-span-2 flex flex-col max-h-[70vh]">
          {selectedUser ? (
            <>
              <div className="flex items-center gap-3 p-2 border-b mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <Link href={`/user/${selectedUser.user_id}`} className="font-medium text-sm text-purple-600 hover:underline">{selectedUser.full_name}</Link>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-3 px-1">
                {messages.map((m) => (
                  <div key={m.message_id} className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      m.sender_id === userId ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm'}`}>
                      {m.sender_id !== userId && (() => {
                        const analysis = analyzeMessage(m.content);
                        const maxRisk = partnerSafetyMaxRisk[m.sender_id] ?? 0;
                        const showWarning = analysis.riskScore >= MESSAGE_RISK_THRESHOLD || maxRisk >= MESSAGE_RISK_THRESHOLD;
                        return showWarning ? (
                          <div className="mb-1 text-[11px] font-medium text-amber-700 bg-amber-200/70 border border-amber-300/70 rounded-md px-2 py-1">
                            ⚠️ This message may be unsafe
                          </div>
                        ) : null;
                      })()}
                      {m.content}
                      <div className={`text-[9px] mt-1 ${m.sender_id === userId ? 'text-purple-200' : 'text-slate-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="bg-purple-600 text-white">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
