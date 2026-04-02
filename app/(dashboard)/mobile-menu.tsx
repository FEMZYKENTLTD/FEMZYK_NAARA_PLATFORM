'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight } from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
}

export default function MobileMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} className="p-2 text-slate-600 hover:text-purple-600">
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setOpen(false)} />

          {/* Slide-in Menu */}
          <div className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-slate-900">
                FEMZYK <span className="text-orange-500">NÀÁRA</span>
              </span>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="py-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </nav>

            {/* Admin Link */}
            <div className="border-t mt-2 pt-2">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <span>Admin Dashboard</span>
                <ChevronRight className="h-4 w-4 text-amber-400" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}