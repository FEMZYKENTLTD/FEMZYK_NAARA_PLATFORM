// app/(dashboard)/forum/new/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function NewThreadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f =>
      f.size <= 10 * 1024 * 1024 &&
      (f.type.startsWith('image/') || f.type.startsWith('video/'))
    );
    if (valid.length !== selected.length) {
      setError('Some files skipped (max 10MB, images/videos only)');
    }
    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError('Please enter a thread title.');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in.'); setLoading(false); return; }

      const { data: profile } = await supabase
        .from('users').select('user_id').eq('auth_id', user.id).single();
      if (!profile) { setError('User profile not found.'); setLoading(false); return; }

      // Upload media files
      const mediaUrls: { url: string; type: string }[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const fileName = `${profile.user_id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('forum-media').upload(fileName, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('forum-media').getPublicUrl(fileName);
          mediaUrls.push({ url: urlData.publicUrl, type: file.type });
        }
      }

      // Create thread
      const { data: thread, error: insertError } = await supabase
        .from('threads')
        .insert({
          created_by: profile.user_id,
          title: title.trim(),
          description: description.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        setError('Failed to create thread.');
        console.error(insertError);
        setLoading(false);
        return;
      }

      // If media was uploaded, create a first post with the media
      if (mediaUrls.length > 0) {
        await supabase.from('posts').insert({
          thread_id: thread.thread_id,
          user_id: profile.user_id,
          content: description.trim() || 'Attached media',
          media: mediaUrls,
        });
      }

      router.push(`/forum/${thread.thread_id}`);
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/forum" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to forum
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Create New Thread</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Thread Title</Label>
            <Input id="title" type="text" placeholder="What do you want to discuss?"
              value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea id="description" placeholder="Add more context to your discussion..."
              value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
          </div>

          {/* Media Upload */}
          <div>
            <Label>Attach Photos or Videos (optional)</Label>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple
              onChange={handleFileSelect} className="hidden" />

            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2 mb-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                    {files[i]?.type.startsWith('video/') ? (
                      <video src={p} className="w-full h-full object-cover" />
                    ) : (
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    )}
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-200 rounded-lg px-4 py-2 hover:bg-purple-50 transition-colors">
              <ImageIcon className="h-4 w-4" /> Add Photos / Videos
            </button>
          </div>

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5" disabled={loading}>
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating thread...</>) : 'Create Thread'}
          </Button>
        </form>
      </Card>
    </div>
  );
}