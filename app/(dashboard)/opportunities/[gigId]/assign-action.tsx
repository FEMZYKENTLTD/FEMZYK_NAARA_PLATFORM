'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck } from 'lucide-react';

export default function AssignAction({ gigId, workerId, workerName }: { gigId: string; workerId: string; workerName: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleAssign() {
    if (!confirm(`Assign this gig to ${workerName}? The contract will begin.`)) return;
    setLoading(true);

    await supabase.from('gigs').update({
      assigned_to: workerId, status: 'in_progress',
    }).eq('gig_id', gigId);

    // Notify the worker
    await supabase.from('notifications').insert({
      user_id: workerId, type: 'gig_assigned',
      title: 'You got the gig!', message: `You have been assigned a new gig. Check your opportunities.`,
      link: `/opportunities/${gigId}`,
    });

    router.refresh();
    setLoading(false);
  }

  return (
    <Button size="sm" onClick={handleAssign} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserCheck className="h-4 w-4 mr-1" />Assign</>}
    </Button>
  );
}