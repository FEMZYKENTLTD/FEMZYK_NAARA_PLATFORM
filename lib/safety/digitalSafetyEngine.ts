import type { SupabaseClient } from '@supabase/supabase-js';
import { analyzeMessage } from './analyzeMessage';
import { applyTrustScoreDelta } from './trustScoreService';

export const MESSAGE_RISK_THRESHOLD = 0.7;

export type SafetyDecision = {
  riskScore: number;
  flags: string[];
  isPotentiallyUnsafe: boolean;
};

function computeTrustPenaltyFromRisk(riskScore: number) {
  // Small bounded penalty: higher risk -> larger penalty.
  // Keep it conservative to avoid surprising users during MVP.
  const penalty = Math.round(3 + riskScore * 10);
  return -penalty;
}

function buildMessageScamDetail(flags: string[], riskScore: number) {
  // Stored in scam_detail for now (until we introduce a dedicated safety event table).
  const flagsText = flags.length ? flags.join(', ') : 'no_flags';
  return `Auto-flagged message risk=${riskScore.toFixed(2)} | flags=${flagsText}`;
}

/**
 * First backend-connected slice:
 * - Detect risky messages via `analyzeMessage()`
 * - Persist an auto-safety signal into `scam_reports` (scam_type='messaging')
 * - Apply a bounded trust_score penalty to the message sender
 *
 * IMPORTANT: This is best-effort. Messaging must not be blocked by safety writes.
 */
export async function autoFlagMessageIfUnsafe(params: {
  supabase: SupabaseClient;
  senderUserId: string; // the user who sent the message
  receiverUserId: string; // the user who will receive the message
  content: string;
  // Optional: if the DB expects phone/account instead of user_id, we can pass it later.
  reportedAccountOverride?: string;
}): Promise<{ decision: SafetyDecision; persisted: boolean; trustUpdated: boolean }> {
  const analysis = analyzeMessage(params.content);
  const decision: SafetyDecision = {
    riskScore: analysis.riskScore,
    flags: analysis.flags,
    isPotentiallyUnsafe: analysis.riskScore >= MESSAGE_RISK_THRESHOLD,
  };

  if (!decision.isPotentiallyUnsafe) {
    return { decision, persisted: false, trustUpdated: false };
  }

  try {
    const reportedAccount = params.reportedAccountOverride ?? params.senderUserId;

    const { error: insertErr } = await params.supabase.from('scam_reports').insert({
      // Report is created by the currently authenticated sender.
      // This is best-effort for MVP stability under typical RLS rules.
      user_id: params.senderUserId,
      scam_type: 'messaging',
      scam_detail: buildMessageScamDetail(decision.flags, decision.riskScore),
      reported_account: reportedAccount,
      risk_score: decision.riskScore,
      evidence_urls: [],
    });

    // Apply trust penalty only if we managed to persist the safety signal.
    if (insertErr) throw insertErr;

    const trustPenalty = computeTrustPenaltyFromRisk(decision.riskScore);
    const { ok } = await applyTrustScoreDelta(params.supabase, params.senderUserId, trustPenalty);

    return { decision, persisted: true, trustUpdated: ok };
  } catch {
    return { decision, persisted: false, trustUpdated: false };
  }
}

