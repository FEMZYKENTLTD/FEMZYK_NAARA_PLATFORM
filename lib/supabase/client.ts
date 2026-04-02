// src/lib/supabase/client.ts
// ============================================================================
// Supabase Browser Client
// Used in Client Components (components with "use client" directive)
// This runs in the user's browser
// ============================================================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses the public anon key — safe to expose in the browser.
 * Row Level Security (RLS) on the database ensures users
 * can only access data they're authorized to see.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}