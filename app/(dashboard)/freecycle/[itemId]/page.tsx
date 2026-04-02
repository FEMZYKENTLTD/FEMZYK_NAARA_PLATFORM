// app/(dashboard)/freecycle/[itemId]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, User, Clock, Tag } from 'lucide-react';
import ClaimButton from './claim-button';

export default async function FreeCycleItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('freecycle_items')
    .select(`*, poster:users!freecycle_items_posted_by_fkey(full_name)`)
    .eq('item_id', itemId)
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
    userProfile = data;
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold">Item not found</h1>
        <Link href="/freecycle" className="text-purple-600 hover:underline mt-2 inline-block">Back</Link>
      </div>
    );
  }

  const poster = item.poster as { full_name: string } | null;
  const isOwner = userProfile?.user_id === item.posted_by;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/freecycle" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to FreeCycle
      </Link>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
          <Badge className={`border-0 capitalize ${
            item.status === 'available' ? 'bg-green-100 text-green-700'
            : item.status === 'claimed' ? 'bg-yellow-100 text-yellow-700'
            : 'bg-slate-100 text-slate-700'
          }`}>{item.status}</Badge>
        </div>

        {item.description && (
          <p className="text-slate-600 mb-4 whitespace-pre-wrap">{item.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1"><User className="h-4 w-4" />{poster?.full_name}</span>
          <span className="flex items-center gap-1"><Tag className="h-4 w-4" />{item.category}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </Card>

      {userProfile && item.status === 'available' && !isOwner && (
        <ClaimButton itemId={itemId} userId={userProfile.user_id} />
      )}

      {isOwner && item.status === 'available' && (
        <Card className="p-4 text-center bg-blue-50 border-blue-200">
          <p className="text-blue-800 font-medium">This is your item. Waiting for someone to claim it.</p>
        </Card>
      )}

      {item.status === 'claimed' && (
        <Card className="p-4 text-center bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800 font-medium">This item has been claimed!</p>
        </Card>
      )}

      {item.status === 'collected' && (
        <Card className="p-4 text-center bg-slate-50 border-slate-200">
          <p className="text-slate-600 font-medium">This item has been collected.</p>
        </Card>
      )}
    </div>
  );
}