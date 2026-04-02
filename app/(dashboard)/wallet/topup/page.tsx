'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, CreditCard, CheckCircle2 } from 'lucide-react';

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

export default function TopUpPage() {
  const supabase = createClient();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    const topUpAmount = parseFloat(amount);
    if (!topUpAmount || topUpAmount < 100) { setError('Minimum top-up is ₦100'); return; }
    setLoading(true); setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not logged in'); setLoading(false); return; }

      const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
      if (!profile) { setError('Profile not found'); setLoading(false); return; }

      const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', profile.user_id).single();
      if (!wallet) { setError('Wallet not found'); setLoading(false); return; }

      // Update wallet balance
      await supabase.from('wallets').update({
        balance: (wallet.balance || 0) + topUpAmount,
        updated_at: new Date().toISOString(),
      }).eq('wallet_id', wallet.wallet_id);

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.wallet_id, type: 'deposit', amount: topUpAmount,
        description: `Wallet top-up of ₦${topUpAmount.toLocaleString()}`,
      });

      setSuccess(true);
    } catch (err) { setError('An error occurred'); console.error(err); } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Top-Up Successful!</h1>
          <p className="text-slate-600 mb-2">₦{parseFloat(amount).toLocaleString()} added to your wallet.</p>
          <p className="text-xs text-slate-400 mb-6">In production, this would connect to Paystack/Flutterwave for real payments.</p>
          <Link href="/wallet"><Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">Back to Wallet</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/wallet" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Wallet
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Add Funds</h1>
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700"><CreditCard className="h-4 w-4 inline mr-1" />In production, this connects to Paystack or Flutterwave. For now, funds are simulated.</p>
      </Card>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}

      <Card className="p-6">
        <form onSubmit={handleTopUp} className="space-y-4">
          <div><Label>Quick Select</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} type="button" onClick={() => setAmount(a.toString())}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${amount === a.toString()
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-slate-200 hover:border-slate-300'}`}>
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div><Label htmlFor="amount">Or enter custom amount (₦)</Label>
            <Input id="amount" type="number" min="100" placeholder="Enter amount" value={amount}
              onChange={(e) => setAmount(e.target.value)} required className="mt-1 text-lg" /></div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-5 text-lg" disabled={loading}>
            {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Processing...</> : `Add ₦${amount ? parseFloat(amount).toLocaleString() : '0'} to Wallet`}
          </Button>
        </form>
      </Card>
    </div>
  );
}