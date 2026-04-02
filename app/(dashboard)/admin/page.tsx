import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Lightbulb, AlertTriangle, Shield } from 'lucide-react';
import TrustSafetyActionButtons from './trust-safety-action-buttons';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('*').eq('auth_id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 mt-2">You need admin privileges to access this page.</p>
        <Link href="/home" className="text-purple-600 hover:underline mt-4 inline-block">Back to Home</Link>
      </div>
    );
  }

  // Get counts
  const [users, suggestions, reports, highRiskReports] = await Promise.all([
    supabase.from('users').select('user_id', { count: 'exact', head: true }),
    supabase.from('skill_suggestions').select('suggestion_id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('scam_reports').select('report_id', { count: 'exact', head: true }),
    supabase.from('scam_reports').select('report_id', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .gte('risk_score', 0.7),
  ]);

  const { data: recentReports } = await supabase.from('scam_reports')
    .select('report_id, scam_type, reported_account, risk_score, scam_detail, user_id, timestamp')
    .eq('is_deleted', false)
    .order('timestamp', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage users, skills, and platform settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5"><Users className="h-6 w-6 text-purple-600 mb-2" />
          <div className="text-2xl font-bold">{users.count || 0}</div><div className="text-sm text-slate-500">Total Users</div></Card>
        <Card className="p-5"><Lightbulb className="h-6 w-6 text-amber-600 mb-2" />
          <div className="text-2xl font-bold">{suggestions.count || 0}</div><div className="text-sm text-slate-500">Pending Skill Suggestions</div></Card>
        <Card className="p-5"><Shield className="h-6 w-6 text-red-600 mb-2" />
          <div className="text-2xl font-bold">{reports.count || 0}</div><div className="text-sm text-slate-500">Scam Reports</div></Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/users">
          <Card className="p-5 hover:shadow-md cursor-pointer"><h3 className="font-semibold text-slate-900">Manage Users</h3>
            <p className="text-sm text-slate-500 mt-1">Change roles, verify users, manage accounts</p></Card>
        </Link>
        <Link href="/admin/skills">
          <Card className="p-5 hover:shadow-md cursor-pointer"><h3 className="font-semibold text-slate-900">Skill Suggestions</h3>
            <p className="text-sm text-slate-500 mt-1">Review and approve community skill suggestions</p></Card>
        </Link>
      </div>

      <Card className="p-5 border-l-4 border-amber-300">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Trust & Safety Intelligence Layer
            </h2>
            <p className="text-sm text-slate-500">
              Auto-detected risky messaging + community reporting (Module 16 UI slice).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
              High risk: {highRiskReports.count || 0}
            </Badge>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {recentReports && recentReports.length > 0 ? recentReports.map((r) => (
            <div key={r.report_id} className="p-3 rounded-lg border border-amber-100 bg-amber-50/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-slate-900 truncate">{r.reported_account}</span>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] capitalize">{r.scam_type}</Badge>
                    <Badge variant="outline" className="text-[10px]">{Math.round(r.risk_score * 100)}% risk</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{r.scam_detail}</p>
                </div>

                <div className="w-full sm:w-auto">
                  <TrustSafetyActionButtons reportId={r.report_id} targetUserId={r.reported_account} />
                </div>
              </div>
            </div>
          )) : (
            <p className="text-sm text-slate-500">No trust & safety events yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}