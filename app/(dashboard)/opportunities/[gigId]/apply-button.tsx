// app/(dashboard)/opportunities/[gigId]/apply-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Send, Loader2 } from 'lucide-react';

export default function ApplyButton({ gigId, userId, hasApplied, currentApplicants }: {
  gigId: string; userId: string; hasApplied: boolean; currentApplicants: string[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(hasApplied);

  async function handleApply() {
    if (applied) return;
    setLoading(true);
    try {
      await supabase.from('gigs').update({
        applied_users: [...currentApplicants, userId],
      }).eq('gig_id', gigId);
      setApplied(true);
      router.refresh();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  if (applied) {
    return (
      <Card className="p-5 text-center bg-green-50 border-green-200">
        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <p className="font-semibold text-green-800">Application Submitted!</p>
        <p className="text-sm text-green-600 mt-1">The employer will review your profile.</p>
      </Card>
    );
  }

  return (
    <Button onClick={handleApply} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
      {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Applying...</> : <><Send className="h-5 w-5 mr-2" />Apply for This Gig</>}
    </Button>
  );
}