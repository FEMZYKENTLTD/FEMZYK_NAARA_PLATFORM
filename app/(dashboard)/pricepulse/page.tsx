// app/(dashboard)/pricepulse/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';
import PriceSubmitForm from './price-form';

export const metadata: Metadata = {
  title: 'PricePulse — FEMZYK NÀÁRA',
  description: 'Community-driven price tracking for everyday goods.',
};

export default async function PricePulsePage() {
  const supabase = await createClient();

  const { data: prices } = await supabase
    .from('price_entries')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(20);

  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
    userProfile = data;
  }

  // Group by product and get latest median
  const productMap: Record<string, { price: number; median: number; count: number }> = {};
  prices?.forEach((p) => {
    if (!productMap[p.product_name]) {
      productMap[p.product_name] = { price: p.price, median: p.median_price || p.price, count: 1 };
    } else {
      productMap[p.product_name].count++;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">PricePulse</h1>
        <p className="text-slate-500 mt-1">Community-driven price tracking for everyday goods</p>
      </div>

      {/* Price Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(productMap).map(([product, data]) => (
          <Card key={product} className="p-4 text-center">
            <div className="text-lg font-bold text-slate-900">₦{data.price.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">{product}</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-green-600">
              <TrendingUp className="h-3 w-3" /> {data.count} report(s)
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(productMap).length === 0 && (
        <Card className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No price data yet</h3>
          <p className="text-slate-500 mt-1">Be the first to submit a price below!</p>
        </Card>
      )}

      {/* Submit Form */}
      {userProfile && <PriceSubmitForm userId={userProfile.user_id} />}

      {/* Recent Entries */}
      {prices && prices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Submissions</h2>
          <div className="space-y-2">
            {prices.map((p) => (
              <Card key={p.price_entry_id} className="p-3 flex items-center justify-between">
                <span className="font-medium text-slate-900">{p.product_name}</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900">₦{p.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 ml-2">{new Date(p.timestamp).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}