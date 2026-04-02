import Link from 'next/link';
import { Home, MessageSquare, Wrench, Briefcase, User, Wallet } from 'lucide-react';
import NotificationBell from './notification-bell';
import MobileMenu from './mobile-menu';

const BOTTOM_NAV = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/forum', icon: MessageSquare, label: 'Forum' },
  { href: '/skills', icon: Wrench, label: 'Skills' },
  { href: '/opportunities', icon: Briefcase, label: 'Gigs' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const ALL_NAV = [
  { href: '/home', label: 'Home' },
  { href: '/forum', label: 'Forum' },
  { href: '/skills', label: 'SkillForge' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/messages', label: 'Messages' },
  { href: '/learn', label: 'MicroSkill Labs' },
  { href: '/petitions', label: 'PetitionHub' },
  { href: '/freecycle', label: 'FreeCycle' },
  { href: '/pricepulse', label: 'PricePulse' },
  { href: '/billsplit', label: 'BillSplit' },
  { href: '/assetshare', label: 'AssetShare' },
  { href: '/scamshield', label: 'ScamShield' },
  { href: '/trust-guard', label: 'TrustGuard' },
  { href: '/safety', label: 'Safety' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/profile', label: 'Profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/home" className="text-lg font-bold text-slate-900">
            FEMZYK <span className="text-orange-500">NÀÁRA</span>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden lg:flex items-center gap-5">
              {[
                { href: '/home', icon: Home, label: 'Home' },
                { href: '/forum', icon: MessageSquare, label: 'Forum' },
                { href: '/skills', icon: Wrench, label: 'Skills' },
                { href: '/opportunities', icon: Briefcase, label: 'Gigs' },
                { href: '/wallet', icon: Wallet, label: 'Wallet' },
                { href: '/messages', icon: MessageSquare, label: 'Chat' },
                { href: '/profile', icon: User, label: 'Profile' },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-purple-600 transition-colors">
                  <item.icon className="h-4 w-4" />{item.label}
                </Link>
              ))}
            </nav>
            <NotificationBell />
            <MobileMenu items={ALL_NAV} />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-4">
        <div className="max-w-7xl mx-auto px-4 py-4">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {BOTTOM_NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-500 hover:text-purple-600 transition-colors">
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}