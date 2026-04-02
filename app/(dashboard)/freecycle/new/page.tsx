// app/(dashboard)/freecycle/new/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Camera, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' },
];

export default function NewFreeCycleItemPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return; }
    if (!selected.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!title.trim()) { setError('Please enter an item name.'); setLoading(false); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in.'); setLoading(false); return; }
      const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
      if (!profile) { setError('Profile not found.'); setLoading(false); return; }

      let photoUrl = null;
      if (file) {
        const ext = file.name.split('.').pop();
        const fileName = `${profile.user_id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('forum-media').upload(fileName, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('forum-media').getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      const { data: item, error: insertError } = await supabase.from('freecycle_items').insert({
        title: title.trim(), description: description.trim() || null,
        category, posted_by: profile.user_id, status: 'available', photo_url: photoUrl,
      }).select().single();

      if (insertError) { setError('Failed to post item.'); setLoading(false); return; }
      router.push(`/freecycle/${item.item_id}`);
    } catch (err) { setError('An error occurred.'); console.error(err); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/freecycle" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to FreeCycle
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Post a Free Item</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div>
            <Label>Item Photo</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            {preview ? (
              <div className="mt-2 relative rounded-lg overflow-hidden border w-full h-48">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="mt-2 w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer">
                <Camera className="h-10 w-10 text-teal-500 mb-2" />
                <p className="font-medium text-slate-700">Tap to add photo</p>
                <p className="text-xs text-slate-400">JPG, PNG — Max 10MB</p>
              </button>
            )}
          </div>

          <div><Label htmlFor="title">Item Name</Label>
            <Input id="title" placeholder="What are you giving away?" value={title}
              onChange={(e) => setTitle(e.target.value)} required className="mt-1" /></div>
          <div><Label htmlFor="description">Description (optional)</Label>
            <textarea id="description" placeholder="Condition, pickup details, etc." value={description}
              onChange={(e) => setDescription(e.target.value)} rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" /></div>
          <div>
            <Label>Category</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
              {CATEGORIES.map((cat) => (
                <button type="button" key={cat.value} onClick={() => setCategory(cat.value)}
                  className={`p-2 rounded-lg border text-center text-sm transition-all ${category === cat.value
                    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200 font-medium' : 'border-slate-200 hover:border-slate-300'}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Posting...</> : 'Post Item for Free'}
          </Button>
        </form>
      </Card>
    </div>
  );
}