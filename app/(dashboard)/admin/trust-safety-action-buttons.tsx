'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserX, Ban } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { warnUser, suspendUser, banUser } from '@/lib/safety/adminModerationService';

export default function TrustSafetyActionButtons({
  reportId,
  targetUserId,
}: {
  reportId: string;
  targetUserId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(action: 'warn' | 'suspend' | 'ban') {
    if (loading) return;
    setLoading(action);
    try {
      if (action === 'warn') await warnUser(supabase, { targetUserId });
      if (action === 'suspend') await suspendUser(supabase, { targetUserId });
      if (action === 'ban') await banUser(supabase, { targetUserId });
    } catch (err) {
      console.error(err);
      alert(`Moderation action not wired yet. (reportId=${reportId})`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        title="Backend action not wired yet"
        className="border-amber-200 text-amber-700 hover:bg-amber-50"
        onClick={() => void handle('warn')}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {loading === 'warn' ? 'Processing...' : 'Warn'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        title="Backend action not wired yet"
        className="border-orange-200 text-orange-700 hover:bg-orange-50"
        onClick={() => void handle('suspend')}
      >
        <UserX className="h-3 w-3 mr-1" />
        {loading === 'suspend' ? 'Processing...' : 'Suspend'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        title="Backend action not wired yet"
        className="border-red-200 text-red-700 hover:bg-red-50"
        onClick={() => void handle('ban')}
      >
        <Ban className="h-3 w-3 mr-1" />
        {loading === 'ban' ? 'Processing...' : 'Ban'}
      </Button>
    </div>
  );
}

