// app/(dashboard)/notification-bell.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';

interface NotificationItem {
  notification_id: string;
  user_id: string;
  title: string;
  message?: string | null;
  created_at: string;
  is_read: boolean;
}

export default function NotificationBell() {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!user) {
        setProfileUserId(null);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (!mounted) return;
      setProfileUserId(profile?.user_id ?? null);
    }

    void init();
    return () => { mounted = false; };
  }, [supabase]);

  useEffect(() => {
    if (!profileUserId) return;

    let mounted = true;

    async function loadNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!mounted) return;
      const rows = (data || []) as NotificationItem[];
      setNotifications(rows);
      setUnreadCount(rows.filter((n) => !n.is_read).length);
    }

    void loadNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const incoming = payload.new as NotificationItem;
        if (!incoming || incoming.user_id !== profileUserId) return;
        setNotifications((prev) => [incoming, ...prev].slice(0, 10));
        setUnreadCount((prev) => prev + (!incoming.is_read ? 1 : 0));
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, profileUserId]);

  async function markAllRead() {
    if (!profileUserId) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profileUserId)
      .eq('is_read', false);

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown((prev) => {
            const next = !prev;
            if (next) void markAllRead();
            return next;
          });
        }}
        className="relative p-2 text-slate-600 hover:text-purple-600 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
            </div>

            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.notification_id}
                    className={`p-3 text-sm ${n.is_read ? 'bg-white' : 'bg-purple-50'}`}>
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {n.message && <p className="text-slate-500 text-xs mt-1">{n.message}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}