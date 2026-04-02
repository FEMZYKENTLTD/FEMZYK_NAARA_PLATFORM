import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Briefcase } from 'lucide-react';

export default async function EarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Not logged in</div>;

  const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
  if (!profile) return <div>Profile not found</div>;

  const { data: earnings } = await supabase.from('earnings').select('*')
    .eq('user_id', profile.user_id).order('created_at', { ascending: false });

  const totalEarned = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const thisMonth = earnings?.filter(e => {
    const d = new Date(e.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/wallet" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Wallet
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 text-center bg-green-50">
          <div className="text-2xl font-bold text-green-700">₦{totalEarned.toLocaleString()}</div>
          <div className="text-sm text-green-600">Total Earned</div>
        </Card>
        <Card className="p-5 text-center bg-purple-50">
          <div className="text-2xl font-bold text-purple-700">₦{thisMonth.toLocaleString()}</div>
          <div className="text-sm text-purple-600">This Month</div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Earning History</h2>
        {earnings && earnings.length > 0 ? earnings.map((e) => (
          <Card key={e.earning_id} className="p-4 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{e.description || e.source}</div>
                <div className="text-xs text-slate-400">{new Date(e.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="font-bold text-green-600">+₦{e.amount.toLocaleString()}</div>
          </Card>
        )) : (
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No earnings yet. Complete gigs to start earning!</p>
          </Card>
        )}
      </div>
    </div>
  );
}