'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Shield, Wallet } from 'lucide-react';

export default function NewGigPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState('');
  const [useEscrow, setUseEscrow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    if (!title.trim()) { setError('Enter a title.'); setLoading(false); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not logged in.'); setLoading(false); return; }
      const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
      if (!profile) { setError('Profile not found.'); setLoading(false); return; }

      const paymentAmount = payment ? parseFloat(payment) : 0;

      // If escrow is enabled, check wallet balance
      if (useEscrow && paymentAmount > 0) {
        const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', profile.user_id).single();
        if (!wallet || wallet.balance < paymentAmount) {
          setError(`Insufficient wallet balance. You need ₦${paymentAmount.toLocaleString()} but have ₦${(wallet?.balance || 0).toLocaleString()}. Add funds first.`);
          setLoading(false);
          return;
        }

        // Hold funds in escrow
        await supabase.from('wallets').update({
          balance: wallet.balance - paymentAmount,
          escrow_held: (wallet.escrow_held || 0) + paymentAmount,
          updated_at: new Date().toISOString(),
        }).eq('wallet_id', wallet.wallet_id);

        // Record escrow transaction
        await supabase.from('wallet_transactions').insert({
          wallet_id: wallet.wallet_id, type: 'escrow_hold', amount: paymentAmount,
          description: `Escrow hold for gig: ${title.trim()}`,
        });
      }

      // Create the gig
      await supabase.from('gigs').insert({
        title: title.trim(), description: description.trim(),
        posted_by: profile.user_id, payment: paymentAmount || null,
        currency: 'NGN', status: 'open',
        escrow_funded: useEscrow && paymentAmount > 0,
        escrow_amount: useEscrow ? paymentAmount : 0,
      });

      router.push('/opportunities');
    } catch (err) { setError('An error occurred.'); console.error(err); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/opportunities" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Post a Gig</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label htmlFor="title">Gig Title</Label>
            <Input id="title" placeholder="What work needs to be done?" value={title}
              onChange={(e) => setTitle(e.target.value)} required className="mt-1" /></div>
          <div><Label htmlFor="desc">Description</Label>
            <textarea id="desc" placeholder="Details, requirements, location..." value={description}
              onChange={(e) => setDescription(e.target.value)} rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
          <div><Label htmlFor="payment">Payment (₦)</Label>
            <Input id="payment" type="number" placeholder="e.g. 25000" value={payment}
              onChange={(e) => setPayment(e.target.value)} className="mt-1" /></div>

          {/* Escrow Toggle */}
          {payment && parseFloat(payment) > 0 && (
            <div>
              <Label>Payment Protection</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button type="button" onClick={() => setUseEscrow(true)}
                  className={`p-4 rounded-xl border text-left transition-all ${useEscrow
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-slate-200'}`}>
                  <Shield className="h-5 w-5 text-green-600 mb-2" />
                  <div className="font-semibold text-sm">Escrow Protected</div>
                  <div className="text-[10px] text-slate-500">Funds locked until both parties confirm completion. Safest option.</div>
                </button>
                <button type="button" onClick={() => setUseEscrow(false)}
                  className={`p-4 rounded-xl border text-left transition-all ${!useEscrow
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200'}`}>
                  <Wallet className="h-5 w-5 text-blue-600 mb-2" />
                  <div className="font-semibold text-sm">Direct Payment</div>
                  <div className="text-[10px] text-slate-500">Pay the worker directly. No platform protection.</div>
                </button>
              </div>
              {useEscrow && (
                <Card className="p-3 mt-2 bg-green-50 border-green-200">
                  <p className="text-xs text-green-700">₦{parseFloat(payment).toLocaleString()} will be deducted from your wallet and held in escrow. Released only when both you and the worker confirm completion.</p>
                </Card>
              )}
            </div>
          )}

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-5" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Posting...</> : 'Post Gig'}
          </Button>
        </form>
      </Card>
    </div>
  );
}