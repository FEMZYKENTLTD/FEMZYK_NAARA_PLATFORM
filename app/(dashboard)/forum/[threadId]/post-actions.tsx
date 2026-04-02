// app/(dashboard)/forum/[threadId]/post-actions.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, X, Check, Loader2 } from 'lucide-react';

export default function PostActions({ postId, content }: { postId: string; content: string; threadId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    setLoading(true);
    await supabase.from('posts').update({ is_deleted: true }).eq('post_id', postId);
    setShowMenu(false);
    router.refresh();
    setLoading(false);
  }

  async function handleSaveEdit() {
    if (!editContent.trim()) return;
    setLoading(true);
    await supabase.from('posts').update({ content: editContent.trim(), is_edited: true, updated_at: new Date().toISOString() }).eq('post_id', postId);
    setEditing(false); setShowMenu(false);
    router.refresh();
    setLoading(false);
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-2 w-full">
        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancel</Button>
          <Button size="sm" className="bg-purple-600 text-white" onClick={handleSaveEdit} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Save</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 hover:text-slate-600 p-1">
        <MoreVertical className="h-4 w-4" />
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-6 z-50 bg-white rounded-lg shadow-lg border py-1 w-32">
            <button onClick={() => { setEditing(true); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2">
              <Edit className="h-3 w-3" /> Edit
            </button>
            <button onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}