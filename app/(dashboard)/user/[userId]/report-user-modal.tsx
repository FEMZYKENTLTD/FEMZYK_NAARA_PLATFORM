'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Flag, Loader2, X } from 'lucide-react';
import { reportUserForSafety, type ReportCategory } from '@/lib/safety/reportUserService';

export default function ReportUserModal(props: {
  reporterUserId: string;
  targetUserId: string;
  targetReportedAccount: string;
  targetDisplayName: string;
}) {
  const { reporterUserId, targetUserId, targetReportedAccount, targetDisplayName } = props;
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>('scam');
  const [detail, setDetail] = useState('');
  const [accountHint, setAccountHint] = useState(targetReportedAccount);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function close() {
    setOpen(false);
    setSubmitting(false);
    setSuccess(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!detail.trim()) return;

    setSubmitting(true);
    setSuccess(false);
    try {
      const result = await reportUserForSafety({
        supabase,
        reporterUserId,
        targetUserId,
        targetReportedAccount: accountHint,
        category,
        detail,
      });

      if (!result.ok) throw new Error('Report failed');
      setSuccess(true);

      setTimeout(() => {
        close();
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert('Could not submit report right now. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="h-4 w-4 mr-1" />
        Report
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card
            className="w-full max-w-xl p-5 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Flag className="h-5 w-5 text-red-600" />
                  Report User
                </h2>
                <p className="text-sm text-slate-500">
                  Reporting helps protect the community. Target: <span className="font-medium">{targetDisplayName}</span>
                </p>
              </div>
              <button type="button" className="p-2 text-slate-500 hover:text-slate-700" onClick={close}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="scam">Scam</option>
                  <option value="harassment">Harassment</option>
                  <option value="fake_identity">Fake identity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label>Reported account (used for backend)</Label>
                <Input
                  value={accountHint}
                  onChange={(e) => setAccountHint(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Details</Label>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Describe what happened (e.g., scam message, harassment, fake ID)."
                />
              </div>

              {success && (
                <div className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm">
                  Report submitted. Thank you.
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={close} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={submitting || !detail.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Report
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}

