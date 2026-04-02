// app/(dashboard)/analytics/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { PieChart, Users, Wrench, Briefcase, FileSignature, MessageSquare, Recycle, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics — FEMZYK NÀÁRA',
  description: 'Ecosystem metrics and platform analytics.',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch counts from all tables
  const [users, trades, skills, gigs, threads, posts, petitions, freecycle, scams, prices] = await Promise.all([
    supabase.from('users').select('user_id', { count: 'exact', head: true }),
    supabase.from('trades').select('trade_id', { count: 'exact', head: true }),
    supabase.from('apprentice_skills').select('apprentice_skill_id', { count: 'exact', head: true }),
    supabase.from('gigs').select('gig_id', { count: 'exact', head: true }),
    supabase.from('threads').select('thread_id', { count: 'exact', head: true }),
    supabase.from('posts').select('post_id', { count: 'exact', head: true }),
    supabase.from('petitions').select('petition_id', { count: 'exact', head: true }),
    supabase.from('freecycle_items').select('item_id', { count: 'exact', head: true }),
    supabase.from('scam_reports').select('report_id', { count: 'exact', head: true }),
    supabase.from('price_entries').select('price_entry_id', { count: 'exact', head: true }),
  ]);

  const metrics = [
    { label: 'Total Users', value: users.count || 0, icon: Users, color: 'text-purple-600 bg-purple-100' },
    { label: 'Trades Available', value: trades.count || 0, icon: Wrench, color: 'text-blue-600 bg-blue-100' },
    { label: 'Skill Check-ins', value: skills.count || 0, icon: Wrench, color: 'text-green-600 bg-green-100' },
    { label: 'Gigs Posted', value: gigs.count || 0, icon: Briefcase, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Forum Threads', value: threads.count || 0, icon: MessageSquare, color: 'text-orange-600 bg-orange-100' },
    { label: 'Forum Posts', value: posts.count || 0, icon: MessageSquare, color: 'text-amber-600 bg-amber-100' },
    { label: 'Petitions', value: petitions.count || 0, icon: FileSignature, color: 'text-red-600 bg-red-100' },
    { label: 'FreeCycle Items', value: freecycle.count || 0, icon: Recycle, color: 'text-teal-600 bg-teal-100' },
    { label: 'Scam Reports', value: scams.count || 0, icon: Shield, color: 'text-rose-600 bg-rose-100' },
    { label: 'Price Entries', value: prices.count || 0, icon: PieChart, color: 'text-indigo-600 bg-indigo-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="text-slate-500 mt-1">Ecosystem metrics across all modules</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{m.value}</div>
            <div className="text-xs text-slate-500 mt-1">{m.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}