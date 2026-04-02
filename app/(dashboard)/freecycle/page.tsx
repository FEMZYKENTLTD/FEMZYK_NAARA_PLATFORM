// app/(dashboard)/freecycle/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Recycle, Plus, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FreeCycle — FEMZYK NÀÁRA',
  description: 'Give away items you do not need. Claim free items nearby.',
};

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  claimed: 'bg-yellow-100 text-yellow-700',
  collected: 'bg-slate-100 text-slate-700',
};

export default async function FreeCyclePage() {
  const supabase = await createClient();

  const { data: items } = await supabase.from('freecycle_items')
    .select(`*, poster:users!freecycle_items_posted_by_fkey(full_name)`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FreeCycle</h1>
          <p className="text-slate-500 mt-1">Give away items or claim free ones nearby</p>
        </div>
        <Link href="/freecycle/new">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />Post Free Item
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items && items.length > 0 ? items.map((item) => {
          const poster = item.poster as { full_name: string } | null;
          return (
            <Link key={item.item_id} href={`/freecycle/${item.item_id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                {item.photo_url ? (
                  <div className="h-40 bg-slate-100"><img src={item.photo_url} alt={item.title} className="w-full h-full object-cover" /></div>
                ) : (
                  <div className="h-40 bg-slate-100 flex items-center justify-center"><Recycle className="h-12 w-12 text-slate-300" /></div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <Badge className={`border-0 text-[10px] capitalize ${STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.available}`}>{item.status}</Badge>
                  </div>
                  {item.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] mb-2">DEMO</Badge>}
                  {item.description && <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{poster?.full_name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          );
        }) : (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Recycle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No items yet</h3>
              <p className="text-slate-500 mt-1 mb-4">Share something with your community!</p>
              <Link href="/freecycle/new"><Button className="bg-teal-600 hover:bg-teal-700 text-white"><Plus className="h-4 w-4 mr-2" />Post First Item</Button></Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}