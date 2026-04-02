// app/(dashboard)/petitions/[petitionId]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Users, Clock, Target } from 'lucide-react';
import SignButton from './sign-button';

export default async function PetitionDetailPage({
  params,
}: {
  params: Promise<{ petitionId: string }>;
}) {
  const { petitionId } = await params;
  const supabase = await createClient();

  const { data: petition } = await supabase
    .from('petitions')
    .select(`*, creator:users!petitions_created_by_fkey(full_name)`)
    .eq('petition_id', petitionId)
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
    userProfile = data;
  }

  if (!petition) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold">Petition not found</h1>
        <Link href="/petitions" className="text-purple-600 hover:underline mt-2 inline-block">Back</Link>
      </div>
    );
  }

  const creator = petition.creator as { full_name: string } | null;
  const signatures = (petition.signatures as string[]) || [];
  const hasSigned = userProfile ? signatures.includes(userProfile.user_id) : false;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/petitions" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to petitions
      </Link>

      <Card className="p-6">
        <Badge className={`mb-4 border-0 ${petition.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
          {petition.status}
        </Badge>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{petition.title}</h1>
        <p className="text-slate-600 whitespace-pre-wrap mb-4">{petition.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{creator?.full_name}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(petition.created_at).toLocaleDateString()}</span>
          {petition.target_authority && (
            <span className="flex items-center gap-1"><Target className="h-4 w-4" />{petition.target_authority}</span>
          )}
        </div>
      </Card>

      {/* Signature Counter */}
      <Card className="p-6 text-center bg-gradient-to-r from-red-50 to-orange-50">
        <div className="text-5xl font-bold text-red-600 mb-2">{petition.signature_count}</div>
        <div className="text-slate-600 font-medium">Signatures Collected</div>

        {/* Progress bar to a goal */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{petition.signature_count} signed</span>
            <span>Goal: 100</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-red-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min((petition.signature_count / 100) * 100, 100)}%` }} />
          </div>
        </div>
      </Card>

      {/* Sign Button */}
      {userProfile && petition.status === 'open' && (
        <SignButton
          petitionId={petitionId}
          userId={userProfile.user_id}
          hasSigned={hasSigned}
          currentSignatures={signatures}
          currentCount={petition.signature_count}
        />
      )}
    </div>
  );
}