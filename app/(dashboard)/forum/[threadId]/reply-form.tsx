// app/(dashboard)/forum/[threadId]/reply-form.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Image as ImageIcon, X } from 'lucide-react';

interface ReplyFormProps { threadId: string; userId: string; }

export default function ReplyForm({ threadId, userId }: ReplyFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => f.size <= 10 * 1024 * 1024 &&
      (f.type.startsWith('image/') || f.type.startsWith('video/')));
    if (valid.length !== selected.length) setError('Some files were skipped (max 10MB, images/videos only)');
    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && files.length === 0) { setError('Write something or add media.'); return; }
    setLoading(true); setError(null);

    try {
      // Upload media files
      const mediaUrls: { url: string; type: string }[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('forum-media').upload(fileName, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('forum-media').getPublicUrl(fileName);
          mediaUrls.push({ url: urlData.publicUrl, type: file.type });
        }
      }

      await supabase.from('posts').insert({
        thread_id: threadId, user_id: userId, content: content.trim(),
        media: mediaUrls.length > 0 ? mediaUrls : null,
      });
      await supabase.from('threads').update({ updated_at: new Date().toISOString() }).eq('thread_id', threadId);

      setContent(''); setFiles([]); setPreviews([]);
      router.refresh();
    } catch (err) { setError('Failed to post.'); console.error(err); } finally { setLoading(false); }
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-slate-900 mb-3">Post a Reply</h3>
      {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm mb-3">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea placeholder="Write your reply..." value={content} onChange={(e) => setContent(e.target.value)}
          rows={4} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />

        {/* Media Previews */}
        {previews.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {previews.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                {files[i]?.type.startsWith('video/') ? (
                  <video src={p} className="w-full h-full object-cover" />
                ) : (
                  <img src={p} alt="" className="w-full h-full object-cover" />
                )}
                <button type="button" onClick={() => removeFile(i)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800">
            <ImageIcon className="h-4 w-4" /> Add Photo/Video
          </button>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={loading || (!content.trim() && files.length === 0)}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Posting...</> : <><Send className="h-4 w-4 mr-2" />Post Reply</>}
          </Button>
        </div>
      </form>
    </Card>
  );
}