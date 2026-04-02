// app/(dashboard)/opportunities/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Clock, Globe, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Opportunities — FEMZYK NÀÁRA',
  description: 'Find local and international gigs matched to your skills.',
};

export default async function OpportunitiesPage() {
  const supabase = await createClient();

  const { data: localGigs } = await supabase.from('gigs')
    .select(`*, employer:users!gigs_posted_by_fkey(full_name)`)
    .eq('status', 'open').eq('is_deleted', false)
    .order('created_at', { ascending: false });

  const { data: globalGigs } = await supabase.from('global_gigs')
    .select('*').eq('platform_status', 'open')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
          <p className="text-slate-500 mt-1">Local and international gigs for your skills</p>
        </div>
        <Link href="/opportunities/new">
          <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />Post a Gig
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" /> Local Gigs
        </h2>
        <div className="space-y-3">
          {localGigs && localGigs.length > 0 ? localGigs.map((gig) => {
            const employer = gig.employer as { full_name: string } | null;
            return (
              <Link key={gig.gig_id} href={`/opportunities/${gig.gig_id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{gig.title}</h3>
                        {gig.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO</Badge>}
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{gig.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>{employer?.full_name || 'Unknown'}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(gig.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {gig.payment && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-green-600">{gig.currency} {gig.payment.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          }) : (
            <Card className="p-6 text-center"><p className="text-slate-500">No local gigs available.</p></Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" /> International Gigs
        </h2>
        <div className="space-y-3">
          {globalGigs && globalGigs.length > 0 ? globalGigs.map((gig) => (
            <Card key={gig.global_gig_id} className="p-4 border-l-4 border-blue-500">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{gig.title}</h3>
                    {gig.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO</Badge>}
                    <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">International</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{gig.description}</p>
                  <Badge variant="outline" className="text-[10px] mt-2">{gig.country}</Badge>
                </div>
                {gig.payment && (
                  <div className="text-lg font-bold text-blue-600">${gig.payment.toLocaleString()}</div>
                )}
              </div>
            </Card>
          )) : (
            <Card className="p-6 text-center"><p className="text-slate-500">No international gigs available.</p></Card>
          )}
        </div>
      </div>
    </div>
  );
}