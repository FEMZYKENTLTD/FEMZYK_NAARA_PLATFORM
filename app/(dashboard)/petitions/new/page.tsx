// app/(dashboard)/petitions/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewPetitionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Please fill in the title and description.');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in.'); setLoading(false); return; }

      const { data: profile } = await supabase
        .from('users').select('user_id').eq('auth_id', user.id).single();
      if (!profile) { setError('Profile not found.'); setLoading(false); return; }

      const { data: petition, error: insertError } = await supabase
        .from('petitions')
        .insert({
          title: title.trim(),
          description: description.trim(),
          created_by: profile.user_id,
          target_authority: target.trim() || null,
          signatures: [profile.user_id],
          signature_count: 1,
          status: 'open',
        })
        .select()
        .single();

      if (insertError) {
        setError('Failed to create petition.');
        console.error(insertError);
        setLoading(false);
        return;
      }

      router.push(`/petitions/${petition.petition_id}`);
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/petitions" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to petitions
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Create a Petition</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Petition Title</Label>
            <Input id="title" placeholder="What change do you want?" value={title}
              onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea id="description" placeholder="Explain why this matters..."
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={5} required
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none" />
          </div>
          <div>
            <Label htmlFor="target">Target Authority (optional)</Label>
            <Input id="target" placeholder="e.g. Lagos State Government"
              value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1" />
          </div>
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-5" disabled={loading}>
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>) : 'Create Petition'}
          </Button>
        </form>
      </Card>
    </div>
  );
}