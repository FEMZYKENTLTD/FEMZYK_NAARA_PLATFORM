// app/(dashboard)/home/page.tsx
// ============================================================================
// Home Dashboard — Main hub after login
// Shows overview of user activity, trust score, quick actions
// ============================================================================

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wrench,
  Briefcase,
  BookOpen,
  FileSignature,
  Recycle,
  TrendingUp,
  Shield,
  AlertTriangle,
  BarChart3,
  Wallet,
  Share2,
  UserCircle,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard — FEMZYK NÀÁRA',
  description: 'Your personal dashboard for skills, opportunities, and community.',
};

/** Quick action cards for navigating to modules */
const MODULES = [
  {
    href: '/skills',
    icon: Wrench,
    title: 'SkillForge',
    desc: 'Track and verify your skills',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/opportunities',
    icon: Briefcase,
    title: 'Opportunities',
    desc: 'Find local gigs for your skills',
    color: 'bg-green-50 text-green-600',
  },
  {
    href: '/learn',
    icon: BookOpen,
    title: 'MicroSkill Labs',
    desc: 'Free courses and learning',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    href: '/forum',
    icon: TrendingUp,
    title: 'Forum',
    desc: 'Join community discussions',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    href: '/petitions',
    icon: FileSignature,
    title: 'PetitionHub',
    desc: 'Sign and create petitions',
    color: 'bg-red-50 text-red-600',
  },
  {
    href: '/freecycle',
    icon: Recycle,
    title: 'FreeCycle',
    desc: 'Give and receive free items',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    href: '/scamshield',
    icon: Shield,
    title: 'ScamShield',
    desc: 'Report and check scams',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/trust-guard',
    icon: AlertTriangle,
    title: 'TrustGuard',
    desc: 'Detect suspicious activity & stay safe',
    color: 'bg-fuchsia-50 text-fuchsia-600',
  },
  {
    href: '/pricepulse',
    icon: BarChart3,
    title: 'PricePulse',
    desc: 'Track market prices',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    href: '/billsplit',
    icon: Wallet,
    title: 'BillSplit',
    desc: 'Split shared expenses',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    href: '/assetshare',
    icon: Share2,
    title: 'AssetShare',
    desc: 'Book shared tools & assets',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    href: '/profile',
    icon: UserCircle,
    title: 'ProofPortfolio',
    desc: 'Your verified skills portfolio',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    href: '/analytics',
    icon: PieChart,
    title: 'Analytics',
    desc: 'View ecosystem metrics',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

export default async function HomePage() {
  // Fetch the current user data
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the user profile from our users table
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
    profile = data;
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const trustScore = profile?.trust_score || 0;
  const userRole = profile?.role || 'apprentice';

  return (
    <div className="space-y-6">
      {/* ---- Welcome Section ---- */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {displayName}! 👋</h1>
            <p className="text-purple-200 mt-1">
              Your NÀÁRA ecosystem is ready. Start building your profile.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Trust Score Circle */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10">
                <span className="text-xl font-bold">{trustScore}%</span>
              </div>
              <span className="text-xs text-purple-200 mt-1">Trust Score</span>
            </div>
            {/* Role Badge */}
            <Badge className="bg-white/20 text-white border-0 capitalize text-sm px-3 py-1">
              {userRole}
            </Badge>
          </div>
        </div>
      </div>

      {/* ---- Quick Stats ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-slate-900">0</div>
          <div className="text-sm text-slate-500 mt-1">Verified Skills</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-slate-900">0</div>
          <div className="text-sm text-slate-500 mt-1">Gigs Completed</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-slate-900">0</div>
          <div className="text-sm text-slate-500 mt-1">Courses Done</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-slate-900">0</div>
          <div className="text-sm text-slate-500 mt-1">Forum Posts</div>
        </Card>
      </div>

      {/* ---- Module Grid ---- */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Explore Ecosystem
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="p-5 hover:shadow-lg transition-all cursor-pointer h-full border-l-4 border-transparent hover:border-purple-500">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${mod.color}`}
                  >
                    <mod.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">{mod.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}