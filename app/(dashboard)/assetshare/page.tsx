// app/(dashboard)/assetshare/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Plus, Loader2 } from 'lucide-react';

interface AssetItem {
  asset_id: string;
  name: string;
  description: string | null;
  status: 'available' | 'in_use' | 'maintenance' | string;
}

export default function AssetSharePage() {
  const supabase = useMemo(() => createClient(), []);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
        if (profile) setUserId(profile.user_id);
      }
      const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (data) setAssets(data as AssetItem[]);
    }
    load();
  }, [supabase, success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !userId) return;
    setLoading(true);
    try {
      await supabase.from('assets').insert({
        name: name.trim(), description: description.trim() || null,
        owner_id: userId, status: 'available',
      });
      setName(''); setDescription(''); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const STATUS_COLORS = { available: 'bg-green-100 text-green-700', in_use: 'bg-yellow-100 text-yellow-700', maintenance: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AssetShare</h1>
        <p className="text-slate-500 mt-1">Share and book community tools and equipment</p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-3">List an Asset</h2>
        {success && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm mb-3">Asset listed!</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label htmlFor="assetName">Asset Name</Label>
            <Input id="assetName" placeholder="e.g. Generator, Welding Machine" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" /></div>
          <div><Label htmlFor="assetDesc">Description (optional)</Label>
            <Input id="assetDesc" placeholder="Condition, location, etc." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /></div>
          <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" />List Asset</>}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Available Assets</h2>
        {assets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assets.map((asset) => (
              <Card key={asset.asset_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{asset.name}</h3>
                    {asset.description && <p className="text-sm text-slate-500 mt-1">{asset.description}</p>}
                  </div>
                  <Badge className={`border-0 text-[10px] capitalize ${STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS] || ''}`}>{asset.status?.replace('_', ' ')}</Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Share2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No assets listed yet. Add one above!</p>
          </Card>
        )}
      </div>
    </div>
  );
}