// src/app/page.tsx
// ============================================================================
// FEMZYK NÀÁRA PLATFORM — Landing Page (Public)
// SEO-optimized entry point. Server-rendered for maximum crawlability.
// ============================================================================

import Link from 'next/link';
import { Metadata } from 'next';
import {
  Shield,
  Briefcase,
  BookOpen,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/** SEO Metadata — this appears in Google search results */
export const metadata: Metadata = {
  title: 'FEMZYK NÀÁRA — The Trust Layer for Africa\'s Informal Economy',
  description:
    'Verify skills, find opportunities, learn new trades, and connect with your community. FEMZYK NÀÁRA digitizes Africa\'s informal economy with verified credentials, gig matching, and civic engagement.',
  keywords: [
    'Africa skills verification',
    'informal economy platform',
    'apprenticeship tracking',
    'digital credentials Africa',
    'gig economy Nigeria',
    'skill verification',
    'trade skills',
    'FEMZYK NAARA',
  ],
  openGraph: {
    title: 'FEMZYK NÀÁRA PLATFORM',
    description: 'The trust layer for Africa\'s informal economy and digital society.',
    type: 'website',
    locale: 'en_US',
  },
};

/** Feature cards displayed on the landing page */
const features = [
  {
    icon: Shield,
    title: 'SkillForge',
    description: 'Verify your trade skills with photo/video evidence. Build a trusted digital portfolio.',
  },
  {
    icon: Briefcase,
    title: 'Opportunity Hub',
    description: 'Find local and international gigs matched to your verified skills.',
  },
  {
    icon: BookOpen,
    title: 'MicroSkill Labs',
    description: 'Access free courses offline. Learn new trades and digital skills.',
  },
  {
    icon: Users,
    title: 'Community Forum',
    description: 'Connect with artisans, mentors, and employers across Africa.',
  },
  {
    icon: TrendingUp,
    title: 'Trust Score',
    description: 'Build your reputation through verified work, skills, and community engagement.',
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* ---- Hero Section ---- */}
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Brand Name */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          FEMZYK{' '}
          <span className="text-orange-400">NÀÁRA</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-8">
          The trust layer for Africa&apos;s informal economy and digital society.
          Verify skills. Find opportunities. Build trust.
        </p>

                {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white/10 border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-6 text-lg font-semibold"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Social Proof */}
        <p className="mt-8 text-sm text-slate-400">
          Empowering 30M+ artisans across Sub-Saharan Africa
        </p>
      </section>

      {/* ---- Features Section ---- */}
      <section className="px-4 py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
            One Platform. Infinite Possibilities.
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            FEMZYK NÀÁRA connects skills, learning, jobs, civic participation,
            and community resources into one verified ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="p-6 hover:shadow-lg transition-shadow border-slate-200"
              >
                <feature.icon className="h-10 w-10 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA Section ---- */}
      <section className="px-4 py-16 bg-purple-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to prove your skills to the world?
        </h2>
        <p className="text-purple-200 mb-8 max-w-xl mx-auto">
          Join thousands of artisans, freelancers, and community leaders
          building their verified digital identity.
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg">
            Create Your NÀÁRA Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* ---- Footer ---- */}
      <footer className="px-4 py-8 bg-slate-900 text-slate-400 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} FEMZYK NÀÁRA PLATFORM. All rights reserved.</p>
        <p className="mt-1">The trust layer for Africa&apos;s skill economy.</p>
      </footer>
    </main>
  );
}