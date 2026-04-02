'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function WithdrawPage() {
  const supabase = useMemo(() => createClient(), []);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
      if (!p) return;
      const { data: w } = await supabase.from('wallets').select('balance').eq('user_id', p.user_id).single();
      if (w) setBalance(w.balance || 0);
    }
    load();
  }, [supabase]);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount < 500) { setError('Minimum withdrawal is ₦500'); return; }
    if (withdrawAmount > balance) { setError('Insufficient balance'); return; }
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) { setError('Fill in all bank details'); return; }
    setLoading(true); setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
      if (!profile) return;
      const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', profile.user_id).single();
      if (!wallet) return;

      // Deduct from wallet
      await supabase.from('wallets').update({
        balance: wallet.balance - withdrawAmount,
        total_withdrawn: (wallet.total_withdrawn || 0) + withdrawAmount,
        updated_at: new Date().toISOString(),
      }).eq('wallet_id', wallet.wallet_id);

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.wallet_id, type: 'withdrawal', amount: withdrawAmount,
        description: `Withdrawal to ${bankName} - ${accountNumber}`,
      });

      // Create withdrawal request
      await supabase.from('withdrawal_requests').insert({
        user_id: profile.user_id, wallet_id: wallet.wallet_id, amount: withdrawAmount,
        bank_name: bankName.trim(), account_number: accountNumber.trim(), account_name: accountName.trim(),
      });

      setSuccess(true);
    } catch (err) { setError('An error occurred'); console.error(err); } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Withdrawal Requested!</h1>
          <p className="text-slate-600 mb-6">₦{parseFloat(amount).toLocaleString()} will be sent to your bank account.</p>
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
      <h1 className="text-2xl font-bold text-slate-900">Withdraw Funds</h1>

      <Card className="p-4 bg-purple-50 border-purple-200">
        <p className="text-sm text-purple-700">Available balance: <strong>₦{balance.toLocaleString()}</strong></p>
      </Card>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}

      <Card className="p-6">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div><Label htmlFor="amount">Amount (₦)</Label>
            <Input id="amount" type="number" min="500" max={balance} placeholder="Enter amount" value={amount}
              onChange={(e) => setAmount(e.target.value)} required className="mt-1" /></div>
          <div><Label htmlFor="bank">Bank Name</Label>
            <Input id="bank" placeholder="e.g. GTBank, Access Bank" value={bankName}
              onChange={(e) => setBankName(e.target.value)} required className="mt-1" /></div>
          <div><Label htmlFor="accNum">Account Number</Label>
            <Input id="accNum" placeholder="10-digit account number" value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)} required maxLength={10} className="mt-1" /></div>
          <div><Label htmlFor="accName">Account Name</Label>
            <Input id="accName" placeholder="Name on the account" value={accountName}
              onChange={(e) => setAccountName(e.target.value)} required className="mt-1" /></div>

          <Card className="p-3 bg-amber-50 border-amber-200">
            <p className="text-xs text-amber-700 flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> In production, bank verification via Paystack API confirms account details before processing.
            </p>
          </Card>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-5" disabled={loading || balance < 500}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : `Withdraw ₦${amount ? parseFloat(amount).toLocaleString() : '0'}`}
          </Button>
        </form>
      </Card>
    </div>
  );
}