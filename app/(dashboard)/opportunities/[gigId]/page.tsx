import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, User, Clock, Shield } from 'lucide-react';
import ApplyButton from './apply-button';
import ContractPanel from './contract-panel';

export default async function GigDetailPage({ params }: { params: Promise<{ gigId: string }> }) {
  const { gigId } = await params;
  const supabase = await createClient();

  const { data: gig } = await supabase.from('gigs')
    .select(`*, employer:users!gigs_posted_by_fkey(full_name, user_id)`)
    .eq('gig_id', gigId).single();

  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
    userProfile = data;
  }

  if (!gig) {
    return (<div className="text-center py-12"><h1 className="text-xl font-bold">Gig not found</h1>
      <Link href="/opportunities" className="text-purple-600 hover:underline mt-2 inline-block">Back</Link></div>);
  }

  const employer = gig.employer as { full_name: string; user_id: string } | null;
  const appliedUsers = (gig.applied_users as string[]) || [];
  const hasApplied = userProfile ? appliedUsers.includes(userProfile.user_id) : false;
  const isEmployer = userProfile?.user_id === gig.posted_by;
  const isAssignedWorker = userProfile?.user_id === gig.assigned_to;
  const isInProgress = gig.status === 'in_progress';
  const isCompleted = gig.status === 'completed';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/opportunities" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to gigs
      </Link>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={`border-0 ${gig.status === 'open' ? 'bg-green-100 text-green-700'
            : gig.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
            : gig.status === 'completed' ? 'bg-blue-100 text-blue-700'
            : 'bg-slate-100 text-slate-700'}`}>{gig.status.replace('_', ' ')}</Badge>
          {gig.escrow_funded && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]"><Shield className="h-3 w-3 mr-1 inline" />Escrow Protected</Badge>}
          {gig.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO</Badge>}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">{gig.title}</h1>
        <p className="text-slate-600 whitespace-pre-wrap mb-4">{gig.description}</p>

        {gig.payment && (
          <div className="mb-4">
            <div className="text-3xl font-bold text-green-600">{gig.currency} {gig.payment.toLocaleString()}</div>
            {gig.escrow_funded && <p className="text-xs text-green-600 mt-1">₦{gig.escrow_amount?.toLocaleString()} secured in escrow</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <Link href={`/user/${gig.posted_by}`} className="flex items-center gap-1 hover:text-purple-600">
            <User className="h-4 w-4" />{employer?.full_name}
          </Link>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(gig.created_at).toLocaleDateString()}</span>
          <span>{appliedUsers.length} applicant(s)</span>
        </div>
      </Card>

      {/* Apply Button — only for open gigs, non-employers */}
      {userProfile && gig.status === 'open' && !isEmployer && (
        <ApplyButton gigId={gigId} userId={userProfile.user_id} hasApplied={hasApplied} currentApplicants={appliedUsers} />
      )}

      {/* Employer: Select applicant to assign */}
      {isEmployer && gig.status === 'open' && appliedUsers.length > 0 && (
        <AssignPanel gigId={gigId} applicantIds={appliedUsers} supabase={null} />
      )}

      {/* Contract Panel — for in-progress gigs */}
      {userProfile && (isInProgress || isCompleted) && (isEmployer || isAssignedWorker) && (
        <ContractPanel
          gigId={gigId}
          userId={userProfile.user_id}
          isEmployer={isEmployer}
          employerConfirmed={gig.employer_confirmed || false}
          workerConfirmed={gig.worker_confirmed || false}
          escrowAmount={gig.escrow_amount || 0}
          escrowFunded={gig.escrow_funded || false}
          gigStatus={gig.status}
          postedBy={gig.posted_by}
          assignedTo={gig.assigned_to}
        />
      )}

      {isCompleted && (
        <Card className="p-5 text-center bg-blue-50 border-blue-200">
          <p className="text-blue-800 font-medium">This gig has been completed. Funds have been released to the worker.</p>
        </Card>
      )}
    </div>
  );
}

// Server component to show applicants for employer to assign
interface Applicant {
  user_id: string;
  full_name: string;
  username: string;
  trust_score: number;
}

async function AssignPanel({ gigId, applicantIds }: { gigId: string; applicantIds: string[]; supabase: null }) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: applicants } = await supabase.from('users')
    .select('user_id, full_name, username, trust_score')
    .in('user_id', applicantIds);

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-slate-900 mb-3">Applicants — Select a Worker</h2>
      <div className="space-y-2">
        {applicants?.map((a) => (
          <AssignButton key={a.user_id} gigId={gigId} applicant={a} />
        ))}
      </div>
    </Card>
  );
}

function AssignButton({ gigId, applicant }: { gigId: string; applicant: Applicant }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div>
        <Link href={`/user/${applicant.user_id}`} className="font-medium text-sm text-purple-600 hover:underline">{applicant.full_name}</Link>
        <p className="text-xs text-slate-400">@{applicant.username} • Trust: {applicant.trust_score}%</p>
      </div>
      <AssignAction gigId={gigId} workerId={applicant.user_id} workerName={applicant.full_name} />
    </div>
  );
}

// Need client component for the assign action
import AssignAction from './assign-action';