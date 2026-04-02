import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Admin moderation actions (MVP placeholder).
 *
 * Backend endpoints / DB fields for warn/suspend/ban are not yet wired in this codebase.
 * We keep this abstraction so a future backend implementation can be dropped in without refactoring UI.
 */
export async function warnUser(_supabase: SupabaseClient, _params: { targetUserId: string }) {
  void _supabase;
  void _params;
  throw new Error('Not implemented: backend warnUser action is missing.');
}

export async function suspendUser(_supabase: SupabaseClient, _params: { targetUserId: string }) {
  void _supabase;
  void _params;
  throw new Error('Not implemented: backend suspendUser action is missing.');
}

export async function banUser(_supabase: SupabaseClient, _params: { targetUserId: string }) {
  void _supabase;
  void _params;
  throw new Error('Not implemented: backend banUser action is missing.');
}

