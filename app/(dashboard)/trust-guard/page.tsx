import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  Search,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'TrustGuard — FEMZYK NÀÁRA',
  description: 'Detect suspicious behavior, report scams, and learn cyber safety tips.',
};

export default function TrustGuardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-600" />
          TrustGuard
        </h1>
        <p className="text-slate-500">
          Safety insights and scam detection signals across the community.
          (UI module only for now.)
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h2 className="font-semibold text-slate-900">Trust Indicator</h2>
            <p className="text-sm text-slate-500">
              Low risk means no suspicious patterns detected. Medium/high risk indicates repeated scam-like signals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-50 text-green-700 border border-green-200">Low</Badge>
            <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">Medium</Badge>
            <Badge className="bg-red-50 text-red-700 border border-red-200">High</Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Shield className="h-4 w-4 text-green-600" />
              Low Risk
            </div>
            <p className="text-sm text-slate-500 mt-2">Normal messaging rhythm, no scam keywords, no repeated reports.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Medium Risk
            </div>
            <p className="text-sm text-slate-500 mt-2">Suspicious wording patterns or unverified links detected.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              High Risk
            </div>
            <p className="text-sm text-slate-500 mt-2">Strong phishing/scam indicators or repeat offenders in reports.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-slate-900">Smart Message Detection</h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          The messaging system can detect scam-like patterns and warn the receiver before they click or follow instructions.
        </p>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Example risky phrases</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc pl-5">
              <li>“Send OTP to verify”</li>
              <li>“Click this urgent link”</li>
              <li>“You’ve won…”</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Suggested app response</p>
            <p className="text-sm text-slate-600 mt-2">
              ⚠️ This message may be unsafe. Learn why it looks suspicious and how to protect yourself.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-slate-900">Report Suspicious Activity</h2>
        </div>

        <p className="text-sm text-slate-500 mt-2">
          Report scams, harassment, or fake identity. Reports feed into safety signals and admin review.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select
              disabled
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              defaultValue="scam"
            >
              <option value="scam">Scam</option>
              <option value="harassment">Harassment</option>
              <option value="fake_identity">Fake identity</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Details</span>
            <textarea
              disabled
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 resize-none"
              placeholder="Describe what happened (UI will be wired to backend later)."
            />
          </label>

          <Button disabled className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5">
            Submit Report (UI only)
          </Button>

          <p className="text-xs text-slate-500">
            This page is intentionally frontend-first. Backend wiring can be added without redesigning the UI.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-slate-900">Cyber Awareness Micro-Lessons</h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Small lessons inside the app help users earn safety trust by learning how phishing and scams work.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-900 text-sm">How to detect scams</p>
            <p className="text-sm text-slate-500 mt-2">Learn warning signs: urgency, secrecy, and request-for-OTP.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-900 text-sm">Phishing explained</p>
            <p className="text-sm text-slate-500 mt-2">Understand fake links, spoofed pages, and social engineering.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-900 text-sm">Protect your data</p>
            <p className="text-sm text-slate-500 mt-2">Safeguard phone numbers, passwords, and verification codes.</p>
          </div>
        </div>
      </Card>

      <div className="text-center text-sm text-slate-500">
        Want to try ScamShield too?{' '}
        <Link href="/scamshield" className="text-purple-600 hover:underline">
          Open ScamShield
        </Link>
      </div>
    </div>
  );
}

