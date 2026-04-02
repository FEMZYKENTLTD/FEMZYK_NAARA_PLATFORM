import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield } from 'lucide-react';

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Not logged in</div>;

  const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
  if (!profile) return <div>Profile not found</div>;

  const { data: wallet } = await supabase.from('wallets').select('wallet_id').eq('user_id', profile.user_id).single();
  const { data: transactions } = await supabase.from('wallet_transactions').select('*')
    .eq('wallet_id', wallet?.wallet_id).order('created_at', { ascending: false });

  const getIcon = (type: string) => {
    if (type === 'deposit' || type === 'escrow_release') return { icon: ArrowDownLeft, color: 'bg-green-100 text-green-600', sign: '+' };
    if (type === 'escrow_hold') return { icon: Shield, color: 'bg-amber-100 text-amber-600', sign: '-' };
    return { icon: ArrowUpRight, color: 'bg-red-100 text-red-600', sign: '-' };
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/wallet" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Wallet
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>

      {transactions && transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((t) => {
            const cfg = getIcon(t.type);
            const Icon = cfg.icon;
            return (
              <Card key={t.transaction_id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{t.description || t.type.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className={`font-bold ${cfg.sign === '+' ? 'text-green-600' : 'text-red-600'}`}>
                  {cfg.sign}₦{Math.abs(t.amount).toLocaleString()}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center"><p className="text-slate-500">No transactions yet</p></Card>
      )}
    </div>
  );
}