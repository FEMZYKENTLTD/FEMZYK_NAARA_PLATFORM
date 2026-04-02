'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreVertical, Edit, Trash2, X, Check, Loader2 } from 'lucide-react';

export default function ThreadActions({ threadId, title, description }: { threadId: string; title: string; description: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description || '');
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this thread and all its replies?')) return;
    setLoading(true);
    await supabase.from('threads').update({ is_deleted: true }).eq('thread_id', threadId);
    router.push('/forum');
  }

  async function handleSave() {
    if (!editTitle.trim()) return;
    setLoading(true);
    await supabase.from('threads').update({
      title: editTitle.trim(), description: editDesc.trim() || null, updated_at: new Date().toISOString()
    }).eq('thread_id', threadId);
    setEditing(false); setShowMenu(false); router.refresh(); setLoading(false);
  }

  if (editing) {
    return (
      <div className="space-y-3 w-full mt-4 p-4 bg-slate-50 rounded-lg">
        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Thread title" />
        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} placeholder="Description..."
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancel</Button>
          <Button size="sm" className="bg-purple-600 text-white" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Save</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 hover:text-slate-600 p-1"><MoreVertical className="h-5 w-5" /></button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border py-1 w-36">
            <button onClick={() => { setEditing(true); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><Edit className="h-3 w-3" /> Edit Thread</button>
            <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 className="h-3 w-3" /> Delete Thread</button>
          </div>
        </>
      )}
    </div>
  );
}