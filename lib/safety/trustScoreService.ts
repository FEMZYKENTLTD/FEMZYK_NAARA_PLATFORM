import type { SupabaseClient } from '@supabase/supabase-js';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Applies a bounded delta to `users.trust_score`.
 *
 * Notes:
 * - This is intentionally centralized so score updates don't get scattered across components.
 * - It clamps the score to 0..100 to avoid runaway negative/positive values.
 */
export async function applyTrustScoreDelta(
  supabase: SupabaseClient,
  userId: string,
  delta: number,
): Promise<{ ok: boolean; nextTrustScore: number | null }> {
  try {
    const { data: row, error: readErr } = await supabase
      .from('users')
      .select('trust_score')
      .eq('user_id', userId)
      .single();

    if (readErr) throw readErr;

    const current = typeof row?.trust_score === 'number' ? row.trust_score : 0;
    const next = clamp(current + delta, 0, 100);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ trust_score: next, is_synced: false, last_synced: new Date().toISOString() })
      .eq('user_id', userId);

    // If those optional sync columns don't exist in DB, we still want to be safe.
    if (updateErr) {
      // Retry without sync-related fields (best-effort compatibility).
      await supabase.from('users').update({ trust_score: next }).eq('user_id', userId);
    }

    return { ok: true, nextTrustScore: next };
  } catch {
    return { ok: false, nextTrustScore: null };
  }
}

