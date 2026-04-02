// app/(dashboard)/forum/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, Plus, Clock, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Forum — FEMZYK NÀÁRA',
  description: 'Join discussions with artisans, mentors, and employers across Africa.',
};

export default async function ForumPage() {
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from('threads')
    .select(`*, author:users!threads_created_by_fkey(full_name, username, role)`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  const threadIds = threads?.map((t) => t.thread_id) || [];
  const postCounts: Record<string, number> = {};
  if (threadIds.length > 0) {
    const { data: posts } = await supabase.from('posts').select('thread_id').eq('is_deleted', false);
    if (posts) {
      posts.forEach((p) => { postCounts[p.thread_id] = (postCounts[p.thread_id] || 0) + 1; });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Forum</h1>
          <p className="text-slate-500 mt-1">Discuss skills, gigs, community issues, and more</p>
        </div>
        <Link href="/forum/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> New Thread
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {threads && threads.length > 0 ? threads.map((thread) => {
          const author = thread.author as { full_name: string; username: string; role: string } | null;
          const count = postCounts[thread.thread_id] || 0;
          const timeAgo = new Date(thread.created_at).toLocaleDateString();

          return (
            <Link key={thread.thread_id} href={`/forum/${thread.thread_id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer mb-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-base">{thread.title}</h3>
                      {thread.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO</Badge>}
                    </div>
                    {thread.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{thread.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{author?.full_name || 'Unknown'}</span>
                      {author?.role && <Badge variant="outline" className="text-[10px] capitalize py-0">{author.role}</Badge>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{count} {count === 1 ? 'reply' : 'replies'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        }) : (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No threads yet</h3>
            <p className="text-slate-500 mt-1 mb-4">Be the first to start a discussion!</p>
            <Link href="/forum/new">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white"><Plus className="h-4 w-4 mr-2" />Create First Thread</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}