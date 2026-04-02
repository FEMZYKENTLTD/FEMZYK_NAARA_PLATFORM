import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Shield,
  TrendingUp, History
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wallet — FEMZYK NÀÁRA',
  description: 'Manage your funds, escrow, and earnings.',
};

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Not logged in</div>;

  const { data: profile } = await supabase.from('users').select('user_id, full_name').eq('auth_id', user.id).single();
  if (!profile) return <div>Profile not found</div>;

  // Get or create wallet
  let { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', profile.user_id).single();
  if (!wallet) {
    const { data: newWallet } = await supabase.from('wallets').insert({ user_id: profile.user_id }).select().single();
    wallet = newWallet;
  }

  // Get recent transactions
  const { data: transactions } = await supabase.from('wallet_transactions')
    .select('*').eq('wallet_id', wallet?.wallet_id)
    .order('created_at', { ascending: false }).limit(10);

  // Get active contracts (gigs where user is assigned and in progress)
  const { data: activeContracts } = await supabase.from('gigs')
    .select('*, employer:users!gigs_posted_by_fkey(full_name)')
    .or(`assigned_to.eq.${profile.user_id},posted_by.eq.${profile.user_id}`)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false });

  const balance = wallet?.balance || 0;
  const escrowHeld = wallet?.escrow_held || 0;
  const totalEarned = wallet?.total_earned || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <div className="flex items-center justify-between mb-3">
            <Wallet className="h-6 w-6 opacity-80" />
            <Badge className="bg-white/20 text-white border-0 text-[10px]">Available</Badge>
          </div>
          <div className="text-3xl font-bold">₦{balance.toLocaleString()}</div>
          <div className="text-purple-200 text-sm mt-1">Available Balance</div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-500 to-amber-700 text-white">
          <div className="flex items-center justify-between mb-3">
            <Shield className="h-6 w-6 opacity-80" />
            <Badge className="bg-white/20 text-white border-0 text-[10px]">Locked</Badge>
          </div>
          <div className="text-3xl font-bold">₦{escrowHeld.toLocaleString()}</div>
          <div className="text-amber-100 text-sm mt-1">In Escrow</div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-green-500 to-green-700 text-white">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="h-6 w-6 opacity-80" />
            <Badge className="bg-white/20 text-white border-0 text-[10px]">Lifetime</Badge>
          </div>
          <div className="text-3xl font-bold">₦{totalEarned.toLocaleString()}</div>
          <div className="text-green-100 text-sm mt-1">Total Earned</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/wallet/topup">
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <ArrowDownLeft className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-900">Add Funds</div>
          </Card>
        </Link>
        <Link href="/wallet/withdraw">
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <ArrowUpRight className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-900">Withdraw</div>
          </Card>
        </Link>
        <Link href="/wallet/earnings">
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-900">Earnings</div>
          </Card>
        </Link>
        <Link href="/wallet/transactions">
          <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
            <History className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-900">History</div>
          </Card>
        </Link>
      </div>

      {/* Active Contracts */}
      {activeContracts && activeContracts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Active Contracts</h2>
          {activeContracts.map((gig) => {
            const employer = gig.employer as { full_name: string } | null;
            const isEmployer = gig.posted_by === profile.user_id;
            return (
              <Link key={gig.gig_id} href={`/opportunities/${gig.gig_id}`}>
                <Card className="p-4 mb-2 hover:shadow-md cursor-pointer border-l-4 border-amber-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">{gig.title}</h3>
                      <p className="text-xs text-slate-500">{isEmployer ? 'You hired' : `Posted by ${employer?.full_name}`}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600">₦{gig.escrow_amount?.toLocaleString()}</div>
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">In Escrow</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {gig.employer_confirmed && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Employer ✓</Badge>}
                    {gig.worker_confirmed && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Worker ✓</Badge>}
                    {!gig.employer_confirmed && <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px]">Employer pending</Badge>}
                    {!gig.worker_confirmed && <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px]">Worker pending</Badge>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
          <Link href="/wallet/transactions" className="text-sm text-purple-600 hover:underline">View all</Link>
        </div>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((t) => (
              <Card key={t.transaction_id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    t.type === 'deposit' || t.type === 'escrow_release' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {t.type === 'deposit' || t.type === 'escrow_release'
                      ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      : <ArrowUpRight className="h-4 w-4 text-red-600" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{t.description || t.type.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`font-bold ${t.type === 'deposit' || t.type === 'escrow_release' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'deposit' || t.type === 'escrow_release' ? '+' : '-'}₦{Math.abs(t.amount).toLocaleString()}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center"><p className="text-slate-500">No transactions yet</p></Card>
        )}
      </div>
    </div>
  );
}