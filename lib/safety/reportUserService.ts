import type { SupabaseClient } from '@supabase/supabase-js';
import { applyTrustScoreDelta } from './trustScoreService';

export type ReportCategory = 'scam' | 'harassment' | 'fake_identity' | 'other';

function mapCategoryToRisk(category: ReportCategory) {
  // Conservative default values for MVP.
  if (category === 'scam') return { scamType: 'other' as const, riskScore: 0.7 };
  if (category === 'fake_identity') return { scamType: 'other' as const, riskScore: 0.65 };
  if (category === 'harassment') return { scamType: 'other' as const, riskScore: 0.55 };
  return { scamType: 'other' as const, riskScore: 0.45 };
}

function computePenaltyFromRisk(riskScore: number) {
  return -Math.round(3 + riskScore * 10);
}

/**
 * MVP reporting: persists to `scam_reports` (existing backend table used by ScamShield).
 *
 * NOTE: `scam_reports.scam_type` does not include "harassment" or "fake identity".
 * We map those categories to `scam_type='other'` for now and store category in `scam_detail`.
 */
export async function reportUserForSafety(params: {
  supabase: SupabaseClient;
  reporterUserId: string;
  targetUserId: string;
  targetReportedAccount: string; // phone/account identifier or fallback to user_id
  category: ReportCategory;
  detail: string;
}): Promise<{ ok: boolean; reportId: string | null; trustUpdated: boolean }> {
  const { scamType, riskScore } = mapCategoryToRisk(params.category);
  const scamDetail = `User report category=${params.category} | detail=${params.detail.trim()}`;
  const trustDelta = computePenaltyFromRisk(riskScore);

  try {
    // Persist report
    const { data, error } = await params.supabase
      .from('scam_reports')
      .insert({
        user_id: params.reporterUserId,
        scam_type: scamType,
        scam_detail: scamDetail,
        reported_account: params.targetReportedAccount,
        risk_score: riskScore,
        evidence_urls: [],
      })
      .select('report_id')
      .single();

    if (error) throw error;

    // Apply bounded trust penalty to the reported user.
    const { ok: trustOk } = await applyTrustScoreDelta(params.supabase, params.targetUserId, trustDelta);

    return { ok: true, reportId: data?.report_id ?? null, trustUpdated: trustOk };
  } catch {
    return { ok: false, reportId: null, trustUpdated: false };
  }
}

