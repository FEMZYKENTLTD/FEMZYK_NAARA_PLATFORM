import { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Trust & Safety Insights — FEMZYK NÀÁRA',
  description: 'Trust and safety placeholder analytics.',
};

export default function SafetyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Trust & Safety Insights</h1>
      <Card className="p-5 text-slate-600">
        Trust &amp; Safety Insights
      </Card>
    </div>
  );
}
