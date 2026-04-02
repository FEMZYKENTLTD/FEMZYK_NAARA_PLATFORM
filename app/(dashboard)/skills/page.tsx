// app/(dashboard)/skills/page.tsx
// ============================================================================
// SkillForge — Trade selection and skill tree tracking
// Users select a trade, view the skill tree, and check in skills
// ============================================================================

import type { ComponentType } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Wrench,
  Scissors,
  Flame,
  Hammer,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'SkillForge — FEMZYK NÀÁRA',
  description: 'Track and verify your trade skills with SkillForge. Select your trade and build your skill tree.',
};

const TRADE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  wrench: Wrench,
  scissors: Scissors,
  flame: Flame,
  hammer: Hammer,
  smartphone: Smartphone,
};

const TRADE_COLORS = [
  'from-blue-500 to-blue-700',
  'from-pink-500 to-pink-700',
  'from-orange-500 to-orange-700',
  'from-amber-600 to-amber-800',
  'from-cyan-500 to-cyan-700',
];

export default async function SkillsPage() {
  const supabase = await createClient();

  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching trades:', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SkillForge</h1>
        <p className="text-slate-500 mt-1">
          Select your trade to view and track your skill tree
        </p>
      </div>

      <Card className="p-4 border-2 border-dashed border-purple-300 bg-purple-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-purple-900">Can&apos;t find your skill?</h3>
            <p className="text-sm text-purple-600">Suggest a new trade or skill for the community</p>
          </div>
          <Link href="/skills/suggest">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">Suggest Skill</Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trades?.map((trade, index) => {
          const IconComponent = TRADE_ICONS[trade.icon || 'wrench'] || Wrench;
          const colorClass = TRADE_COLORS[index % TRADE_COLORS.length];

          return (
            <Link
              key={trade.trade_id}
              href={`/skills/${trade.trade_id}`}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                <div className={`bg-linear-to-r ${colorClass} p-6 text-white`}>
                  <IconComponent className="h-10 w-10 mb-3 opacity-90" />
                  <h2 className="text-xl font-bold">{trade.trade_name}</h2>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="text-sm text-slate-600 flex-1">
                    {trade.description}
                  </p>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors ml-2 shrink-0" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {(!trades || trades.length === 0) && (
        <Card className="p-8 text-center">
          <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No trades available</h3>
          <p className="text-slate-500 mt-1">Trades will appear here once added to the system.</p>
        </Card>
      )}
    </div>
  );
}