'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, Loader2, AlertTriangle } from 'lucide-react';

interface BillMember {
  member_id: string;
  user_id: string;
  full_name: string;
  amount_owed: number;
  has_approved_completion: boolean;
  has_approved_withdrawal: boolean;
}

interface BillItem {
  bill_id: string;
  title: string;
  amount: number;
  mode: string;
  status: string;
  is_demo?: boolean;
  is_contribution?: boolean;
  target_amount?: number;
  total_deposited?: number;
  created_at: string;
}

export default function BillDetailPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = use(params);
  const supabase = useMemo(() => createClient(), []);
  const [bill, setBill] = useState<BillItem | null>(null);
  const [members, setMembers] = useState<BillMember[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
        if (p) setUserId(p.user_id);
      }
      const { data: b } = await supabase.from('bills').select('*').eq('bill_id', billId).single();
      setBill((b as BillItem | null) || null);
      const { data: m } = await supabase.from('bill_members').select('*').eq('bill_id', billId);
      setMembers((m as BillMember[] | null) || []);
      setLoading(false);
    }
    load();
  }, [supabase, billId]);

  async function approveCompletion() {
    if (!userId) return;
    setActionLoading(true);
    await supabase.from('bill_members').update({ has_approved_completion: true }).eq('bill_id', billId).eq('user_id', userId);

    // Check if all members approved
    const { data: updated } = await supabase.from('bill_members').select('has_approved_completion').eq('bill_id', billId);
    const allApproved = updated?.every(m => m.has_approved_completion);
    if (allApproved) {
      await supabase.from('bills').update({ status: 'paid', completed_at: new Date().toISOString() }).eq('bill_id', billId);
    }

    // Refresh
    const { data: m } = await supabase.from('bill_members').select('*').eq('bill_id', billId);
    setMembers((m as BillMember[] | null) || []);
    const { data: b } = await supabase.from('bills').select('*').eq('bill_id', billId).single();
    setBill((b as BillItem | null) || null);
    setActionLoading(false);
  }

  async function approveWithdrawal() {
    if (!userId) return;
    setActionLoading(true);
    await supabase.from('bill_members').update({ has_approved_withdrawal: true }).eq('bill_id', billId).eq('user_id', userId);
    const { data: m } = await supabase.from('bill_members').select('*').eq('bill_id', billId);
    setMembers((m as BillMember[] | null) || []);
    setActionLoading(false);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
  if (!bill) return <div className="text-center py-12"><h1 className="text-xl font-bold">Bill not found</h1></div>;

  const myMember = members.find(m => m.user_id === userId);
  const allCompletionApproved = members.length > 0 && members.every(m => m.has_approved_completion);
  const isEscrow = bill.mode === 'escrow';
  const isContribution = bill.is_contribution;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/billsplit" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">{bill.title}</h1>
          {bill.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO</Badge>}
          {isContribution && <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">Joint Contribution</Badge>}
          {isEscrow && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Escrow Protected</Badge>}
          <Badge className={`border-0 ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{bill.status === 'paid' ? 'Completed' : 'Pending'}</Badge>
        </div>

        <div className="text-3xl font-bold text-slate-900 mb-1">₦{bill.amount?.toLocaleString()}</div>
        {isContribution && bill.target_amount && (
          <div className="mb-4">
            <div className="text-sm text-slate-500">Target: ₦{bill.target_amount?.toLocaleString()}</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(((bill.total_deposited || 0) / bill.target_amount) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        {isContribution && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-md text-xs mb-4">
            <AlertTriangle className="h-3 w-3 inline mr-1" /> Early withdrawal before target = 5% fee (all members must agree)
          </div>
        )}
      </Card>

      {/* Members & Approvals */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Members ({members.length})</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.member_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium text-sm text-slate-900">{m.full_name}</div>
                <div className="text-xs text-slate-400">Owes: ₦{m.amount_owed?.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                {m.has_approved_completion ? (
                  <Badge className="bg-green-100 text-green-700 border-0 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 border-0 text-[10px]"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      {bill.status !== 'paid' && myMember && (
        <div className="space-y-3">
          {!myMember.has_approved_completion && (
            <Button onClick={approveCompletion} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700 text-white py-5">
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" />Approve as Complete</>}
            </Button>
          )}
          {myMember.has_approved_completion && !allCompletionApproved && (
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-md text-sm text-center">
              You approved. Waiting for other members...
            </div>
          )}
          {allCompletionApproved && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm text-center font-medium">
              All members approved — Bill marked as Complete!
            </div>
          )}

          {isEscrow && !myMember.has_approved_withdrawal && bill.status !== 'paid' && (
            <Button onClick={approveWithdrawal} disabled={actionLoading} variant="outline" className="w-full py-5">
              Approve Withdrawal
            </Button>
          )}
        </div>
      )}

      <div className="text-xs text-slate-400 text-center">Created {new Date(bill.created_at).toLocaleDateString()}</div>
    </div>
  );
}