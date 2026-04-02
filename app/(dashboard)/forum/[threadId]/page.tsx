import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, User, Clock } from 'lucide-react';
import ReplyForm from './reply-form';
import PostActions from './post-actions';
import ThreadActions from './thread-actions';

export default async function ThreadDetailPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase.from('threads')
    .select(`*, author:users!threads_created_by_fkey(full_name, username, role)`)
    .eq('thread_id', threadId).single();

  const { data: posts } = await supabase.from('posts')
    .select(`*, author:users!posts_user_id_fkey(full_name, username, role)`)
    .eq('thread_id', threadId).eq('is_deleted', false)
    .order('created_at', { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('user_id, full_name').eq('auth_id', user.id).single();
    userProfile = data;
  }

  if (!thread || thread.is_deleted) {
    return (<div className="text-center py-12"><h1 className="text-xl font-bold">Thread not found</h1>
      <Link href="/forum" className="text-purple-600 hover:underline mt-2 inline-block">Back</Link></div>);
  }

  const author = thread.author as { full_name: string; username: string; role: string } | null;
  const isThreadOwner = userProfile?.user_id === thread.created_by;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/forum" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to forum
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {thread.is_demo && <Badge className="mb-2 bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO CONTENT</Badge>}
            <h1 className="text-2xl font-bold text-slate-900 mb-3">{thread.title}</h1>
            {thread.description && <p className="text-slate-600 mb-4">{thread.description}</p>}
          </div>
          {isThreadOwner && <ThreadActions threadId={threadId} title={thread.title} description={thread.description} />}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <Link href={`/user/${thread.created_by}`} className="flex items-center gap-1 hover:text-purple-600">
            <User className="h-4 w-4" />{author?.full_name || 'Unknown'}
          </Link>
          {author?.role && <Badge variant="outline" className="text-xs capitalize">{author.role}</Badge>}
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />
            {new Date(thread.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">{posts?.length || 0} {posts?.length === 1 ? 'Reply' : 'Replies'}</h2>
        {posts && posts.length > 0 ? (
          <div className="space-y-3">{posts.map((post) => {
            const postAuthor = post.author as { full_name: string; username: string; role: string } | null;
            const media = (post.media as { url: string; type: string }[]) || [];
            const isOwner = userProfile?.user_id === post.user_id;
            return (
              <Card key={post.post_id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><User className="h-4 w-4 text-purple-600" /></div>
                    <div>
                      <Link href={`/user/${post.user_id}`} className="font-medium text-sm text-purple-600 hover:underline">{postAuthor?.full_name || 'Unknown'}</Link>
                      {postAuthor?.role && <Badge variant="outline" className="text-[10px] capitalize ml-2 py-0">{postAuthor.role}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.is_edited && <span className="text-[10px] text-slate-400">(edited)</span>}
                    <span className="text-xs text-slate-400">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {isOwner && <PostActions postId={post.post_id} content={post.content} threadId={threadId} />}
                  </div>
                </div>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{post.content}</p>
                {media.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">{media.map((m, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border">
                      {m.type.startsWith('video/') ? <video src={m.url} controls className="w-full max-h-60 object-cover" />
                        : <img src={m.url} alt="Post media" className="w-full max-h-60 object-cover" />}
                    </div>
                  ))}</div>
                )}
              </Card>
            );
          })}</div>
        ) : (<Card className="p-6 text-center"><p className="text-slate-500">No replies yet. Be the first!</p></Card>)}
      </div>
      {userProfile && <ReplyForm threadId={threadId} userId={userProfile.user_id} />}
    </div>
  );
}