// app/(dashboard)/skills/[tradeId]/page.tsx
// ============================================================================
// Skill Tree Page — Shows all skills for a specific trade
// Users can view their progress and check in skills
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Camera,
} from 'lucide-react';

/** Color mapping for skill status */
const STATUS_CONFIG = {
  verified: {
    color: 'bg-green-100 border-green-500 text-green-800',
    icon: CheckCircle2,
    label: 'Verified',
    iconColor: 'text-green-600',
  },
  pending: {
    color: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    icon: Clock,
    label: 'Pending',
    iconColor: 'text-yellow-600',
  },
  locked: {
    color: 'bg-slate-50 border-slate-300 text-slate-500',
    icon: Lock,
    label: 'Not Started',
    iconColor: 'text-slate-400',
  },
};

export default async function SkillTreePage({
  params,
}: {
  params: Promise<{ tradeId: string }>;
}) {
  const { tradeId } = await params;
  const supabase = await createClient();

  // Fetch trade info
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('trade_id', tradeId)
    .single();

  // Fetch skills for this trade
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('trade_id', tradeId)
    .order('level', { ascending: true });

  // Fetch current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile to get user_id
  let userProfile = null;
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single();
    userProfile = data;
  }

  // Fetch user's progress on these skills
  const userSkills: Record<string, string> = {};
  if (userProfile) {
    const { data } = await supabase
      .from('apprentice_skills')
      .select('skill_id, status')
      .eq('user_id', userProfile.user_id);

    if (data) {
      data.forEach((s) => {
        userSkills[s.skill_id] = s.status;
      });
    }
  }

  if (!trade) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold text-slate-900">Trade not found</h1>
        <Link href="/skills" className="text-purple-600 hover:underline mt-2 inline-block">
          Back to trades
        </Link>
      </div>
    );
  }

  // Count stats
  const totalSkills = skills?.length || 0;
  const verifiedCount = Object.values(userSkills).filter((s) => s === 'verified').length;
  const pendingCount = Object.values(userSkills).filter((s) => s === 'pending').length;
  const progressPercent = totalSkills > 0 ? Math.round((verifiedCount / totalSkills) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div>
        <Link
          href="/skills"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to trades
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{trade.trade_name}</h1>
        <p className="text-slate-500 mt-1">{trade.description}</p>
      </div>

      {/* Progress Overview */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">Skill Progress</span>
              <span className="text-slate-500">{verifiedCount}/{totalSkills} verified</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {/* Stats badges */}
          <div className="flex gap-2 flex-shrink-0">
            <Badge className="bg-green-100 text-green-700 border-0">
              {verifiedCount} Verified
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-700 border-0">
              {pendingCount} Pending
            </Badge>
          </div>
        </div>
      </Card>

      {/* Skill Tree */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Skill Tree</h2>
        <div className="space-y-3">
          {skills?.map((skill) => {
            const status = userSkills[skill.skill_id] || 'locked';
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.locked;
            const StatusIcon = config.icon;

            return (
              <Card
                key={skill.skill_id}
                className={`p-4 border-l-4 ${config.color} transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status icon */}
                    <StatusIcon className={`h-6 w-6 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                    <div className="flex-1">
                      {/* Skill name + level */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{skill.skill_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          Level {skill.level}
                        </Badge>
                      </div>
                      {/* Description */}
                      <p className="text-sm text-slate-500 mt-1">{skill.description}</p>
                      {/* Status label */}
                      <span className="text-xs font-medium mt-2 inline-block">
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Check-in button (only for non-verified skills) */}
                  {status !== 'verified' && (
                    <Link href={`/skills/${tradeId}/checkin/${skill.skill_id}`}>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Check In
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {(!skills || skills.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No skills defined for this trade yet.</p>
        </Card>
      )}
    </div>
  );
}