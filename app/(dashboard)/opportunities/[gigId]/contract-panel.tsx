'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Loader2, Shield, AlertTriangle } from 'lucide-react';

interface ContractPanelProps {
  gigId: string; userId: string; isEmployer: boolean;
  employerConfirmed: boolean; workerConfirmed: boolean;
  escrowAmount: number; escrowFunded: boolean;
  gigStatus: string; postedBy: string; assignedTo: string | null;
}

export default function ContractPanel(props: ContractPanelProps) {
  const { gigId, isEmployer, employerConfirmed, workerConfirmed, escrowAmount, escrowFunded, gigStatus } = props;
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(isEmployer ? employerConfirmed : workerConfirmed);

  const bothConfirmed = employerConfirmed && workerConfirmed;

  async function handleConfirmCompletion() {
    if (!confirm('Confirm this gig is complete? This cannot be undone.')) return;
    setLoading(true);

    const updateField = isEmployer ? { employer_confirmed: true } : { worker_confirmed: true };
    await supabase.from('gigs').update(updateField).eq('gig_id', gigId);

    // Check if both parties have now confirmed
    const { data: gig } = await supabase.from('gigs').select('employer_confirmed, worker_confirmed, escrow_amount, escrow_funded, posted_by, assigned_to').eq('gig_id', gigId).single();

    const nowBothConfirmed = (isEmployer ? true : gig?.worker_confirmed) && (!isEmployer ? true : gig?.employer_confirmed);

    if (nowBothConfirmed && gig) {
      // RELEASE ESCROW FUNDS
      if (gig.escrow_funded && gig.escrow_amount > 0 && gig.assigned_to) {
        // Get employer wallet
        const { data: empWallet } = await supabase.from('wallets').select('*').eq('user_id', gig.posted_by).single();
        if (empWallet) {
          await supabase.from('wallets').update({
            escrow_held: Math.max((empWallet.escrow_held || 0) - gig.escrow_amount, 0),
          }).eq('wallet_id', empWallet.wallet_id);

          // Record employer escrow release
          await supabase.from('wallet_transactions').insert({
            wallet_id: empWallet.wallet_id, type: 'escrow_release', amount: gig.escrow_amount,
            description: 'Escrow released — gig completed', related_gig_id: gigId,
          });
        }

        // Credit worker wallet
        let { data: workerWallet } = await supabase.from('wallets').select('*').eq('user_id', gig.assigned_to).single();
        if (!workerWallet) {
          const { data: nw } = await supabase.from('wallets').insert({ user_id: gig.assigned_to }).select().single();
          workerWallet = nw;
        }
        if (workerWallet) {
          await supabase.from('wallets').update({
            balance: (workerWallet.balance || 0) + gig.escrow_amount,
            total_earned: (workerWallet.total_earned || 0) + gig.escrow_amount,
            updated_at: new Date().toISOString(),
          }).eq('wallet_id', workerWallet.wallet_id);

          // Record worker deposit
          await supabase.from('wallet_transactions').insert({
            wallet_id: workerWallet.wallet_id, type: 'deposit', amount: gig.escrow_amount,
            description: 'Payment received for completed gig', related_gig_id: gigId,
          });
        }

        // Record earning
        await supabase.from('earnings').insert({
          user_id: gig.assigned_to, gig_id: gigId, amount: gig.escrow_amount,
          currency: 'NGN', source: 'gig_completion', description: 'Gig completed — escrow released',
        });

        // Notify worker
        await supabase.from('notifications').insert({
          user_id: gig.assigned_to, type: 'payment_received',
          title: 'Payment Received!', message: `₦${gig.escrow_amount.toLocaleString()} has been added to your wallet.`,
          link: '/wallet',
        });

        // Notify employer
        await supabase.from('notifications').insert({
          user_id: gig.posted_by, type: 'gig_completed',
          title: 'Gig Completed!', message: 'Both parties confirmed. Escrow funds have been released.',
          link: `/opportunities/${gigId}`,
        });
      }

      // Mark gig as completed
      await supabase.from('gigs').update({
        status: 'completed', completed_at: new Date().toISOString(),
      }).eq('gig_id', gigId);
    }

    setConfirmed(true);
    router.refresh();
    setLoading(false);
  }

  if (gigStatus === 'completed') {
    return (
      <Card className="p-5 bg-green-50 border-green-200 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
        <p className="font-semibold text-green-800">Contract Completed Successfully</p>
        {escrowFunded && <p className="text-sm text-green-600 mt-1">₦{escrowAmount.toLocaleString()} released to worker</p>}
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-amber-600" /> Contract Status
      </h2>

      {escrowFunded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800 font-medium">₦{escrowAmount.toLocaleString()} held in escrow</p>
          <p className="text-xs text-amber-600 mt-1">Funds release when BOTH employer and worker confirm completion</p>
        </div>
      )}

      {/* Confirmation Status */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-medium">Employer Confirmation</span>
          {employerConfirmed || (isEmployer && confirmed) ? (
            <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-500 border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
          )}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-sm font-medium">Worker Confirmation</span>
          {workerConfirmed || (!isEmployer && confirmed) ? (
            <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-500 border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      {!confirmed && (
        <Button onClick={handleConfirmCompletion} disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-5">
          {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Processing...</>
            : <><CheckCircle2 className="h-5 w-5 mr-2" />Confirm Gig Complete</>}
        </Button>
      )}

      {confirmed && !bothConfirmed && (
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-md text-sm text-center">
          You confirmed. Waiting for the other party...
        </div>
      )}

      <div className="mt-3 flex items-start gap-1 text-[10px] text-slate-400">
        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>Both parties must confirm for escrow release. If there&apos;s a dispute, contact support.</span>
      </div>
    </Card>
  );
}