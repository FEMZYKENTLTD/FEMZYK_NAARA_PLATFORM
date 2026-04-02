import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import ScamReportForm from './report-form';
import ScamSearch from './scam-search';

export const metadata: Metadata = {
  title: 'ScamShield — FEMZYK NÀÁRA',
  description: 'Report scams and check accounts before transacting.',
};

const TYPE_COLORS = {
  phone: 'bg-red-100 text-red-700', bank: 'bg-orange-100 text-orange-700',
  messaging: 'bg-yellow-100 text-yellow-700', other: 'bg-slate-100 text-slate-700',
};

export default async function ScamShieldPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase.from('scam_reports').select('*')
    .eq('is_deleted', false).order('timestamp', { ascending: false }).limit(20);

  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
    userProfile = data;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ScamShield</h1>
        <p className="text-slate-500 mt-1">Report scams and protect your community</p>
      </div>

      <ScamSearch />
      {userProfile && <ScamReportForm userId={userProfile.user_id} />}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Reports</h2>
        <div className="space-y-3">
          {reports && reports.length > 0 ? reports.map((r) => {
            const evidence = (r.evidence_urls as string[]) || [];
            return (
              <Card key={r.report_id} className="p-4 border-l-4 border-red-400">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-slate-900">{r.reported_account}</span>
                      <Badge className={`border-0 text-[10px] capitalize ${TYPE_COLORS[r.scam_type as keyof typeof TYPE_COLORS] || TYPE_COLORS.other}`}>{r.scam_type}</Badge>
                      {r.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO</Badge>}
                    </div>
                    <p className="text-sm text-slate-600">{r.scam_detail}</p>
                    {evidence.length > 0 && (
                      <div className="flex gap-2 mt-2">{evidence.map((url, i) => (
                        <img key={i} src={url} alt="Evidence" className="w-16 h-16 rounded border object-cover" />
                      ))}</div>
                    )}
                    <span className="text-xs text-slate-400 mt-2 block">{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className="text-lg font-bold text-red-600">{Math.round(r.risk_score * 100)}%</div>
                    <div className="text-[10px] text-slate-400">Risk</div>
                  </div>
                </div>
              </Card>
            );
          }) : (
            <Card className="p-8 text-center">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No reports yet</h3>
              <p className="text-slate-500 mt-1">Community is safe!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}