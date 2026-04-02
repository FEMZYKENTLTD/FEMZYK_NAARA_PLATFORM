'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { autoFlagMessageIfUnsafe } from '@/lib/safety/digitalSafetyEngine';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';

export default function MessageButton({ senderId, receiverId, receiverName }: { senderId: string; receiverId: string; receiverName: string }) {
  const supabase = createClient();
  const [showBox, setShowBox] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // Stable id per send attempt for idempotency on network retries.
  const [pendingClientMessageId, setPendingClientMessageId] = useState<string | null>(null);
  const [pendingClientMessageText, setPendingClientMessageText] = useState<string>('');

  async function handleSend() {
    if (!message.trim()) return;
    if (loading) return;
    setLoading(true);

    const messageText = message.trim();

    // Generate once per unique send attempt; don't regenerate on retry.
    let clientMessageId = pendingClientMessageId;
    if (!clientMessageId || pendingClientMessageText !== messageText) {
      clientMessageId = crypto.randomUUID();
      setPendingClientMessageId(clientMessageId);
      setPendingClientMessageText(messageText);
    }

    try {
      const { error } = await supabase.rpc('send_message', {
        p_receiver_id: receiverId,
        p_content: messageText,
        p_client_message_id: clientMessageId,
        p_conversation_id: null,
      });

      if (error) {
        console.error('send_message rpc failed:', error);
        return;
      }

      // Best-effort: persist safety signal + adjust sender trust.
      void autoFlagMessageIfUnsafe({
        supabase,
        senderUserId: senderId,
        receiverUserId: receiverId,
        content: messageText,
      });

      await supabase.from('notifications').insert({
        user_id: receiverId, from_user_id: senderId, type: 'message',
        title: 'New Message', message: 'You have a new message.',
        link: '/messages',
      });

      setMessage('');
      setPendingClientMessageId(null);
      setPendingClientMessageText('');
      setSent(true);
      setTimeout(() => { setSent(false); setShowBox(false); }, 2000);
    } catch (err) {
      console.error('send_message rpc exception:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setShowBox(!showBox)}>
        <MessageSquare className="h-4 w-4 mr-1" /> Message
      </Button>

      {showBox && (
        <Card className="mt-2 p-3 absolute right-0 z-50 w-72 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Message {receiverName}</span>
            <button onClick={() => setShowBox(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          {sent ? (
            <p className="text-green-600 text-sm text-center py-2">Message sent!</p>
          ) : (
            <div className="space-y-2">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..." rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              <Button onClick={handleSend} disabled={loading || !message.trim()} className="w-full bg-purple-600 text-white" size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Send</>}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}