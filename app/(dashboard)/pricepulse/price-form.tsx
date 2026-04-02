// app/(dashboard)/pricepulse/price-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';

export default function PriceSubmitForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim() || !price) return;
    setLoading(true);
    try {
      await supabase.from('price_entries').insert({
        user_id: userId, product_name: product.trim(),
        price: parseFloat(price), median_price: parseFloat(price),
      });
      setProduct(''); setPrice(''); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-slate-900 mb-3">Submit a Price</h2>
      {success && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm mb-3">Price submitted!</div>}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label htmlFor="product" className="sr-only">Product</Label>
          <Input id="product" placeholder="Product name (e.g. Rice 50kg)" value={product} onChange={(e) => setProduct(e.target.value)} required />
        </div>
        <div className="w-full sm:w-32">
          <Label htmlFor="price" className="sr-only">Price</Label>
          <Input id="price" type="number" placeholder="Price (₦)" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Add</>}
        </Button>
      </form>
    </Card>
  );
}