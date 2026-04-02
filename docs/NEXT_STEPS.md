# FEMZYK NÀÁRA — Next Engineering Steps

This doc is written for a developer who has never seen the repo before.
It focuses on what to do next after today’s stability + Module 16 MVP safety slice.

## A) Immediate Next Engineering Tasks (highest priority)
1. Verify RLS compatibility for Module 16 writes
   - `scam_reports` inserts from:
     - `lib/safety/digitalSafetyEngine.ts`
     - `lib/safety/reportUserService.ts`
   - `users.trust_score` updates from:
     - `lib/safety/trustScoreService.ts`
   What to check:
   - Does `scam_reports.user_id` need to equal `auth.uid()`?
   - Does RLS prevent client users from updating other users’ trust scores?

2. Move receiver warning persistence into the backend (end-to-end spec)
   Current behavior:
   - receiver sees warning UI using client-side `analyzeMessage()` in:
     - `app/(dashboard)/messages/page.tsx`
   Next change to reach spec:
   - Update `send_message` RPC (or add DB trigger):
     - Detect risky content
     - Create safety event tied to `messages.message_id` OR add safety columns on `messages`
     - Apply trust penalty safely (server-side)

3. Implement real admin moderation endpoints
   Current UI:
   - `app/(dashboard)/admin/trust-safety-action-buttons.tsx` calls:
     - `lib/safety/adminModerationService.ts` (throws Not implemented)
   Backend work:
   - Create RPC or API routes for warn/suspend/ban
   - Add schema fields if missing (`users.is_suspended`, `users.is_banned`, etc.)
   - Implement admin-only RLS policies

## B) Backend Tasks (Module 16 full spec completion)
1. Add per-message safety persistence
   - Option 1: add columns to `messages`:
     - `safety_risk_score`, `safety_flags`, `is_safety_flagged`
   - Option 2: add new table:
     - `message_safety_events(message_id, receiver_id, sender_id, risk_score, flags, created_at)`

2. Add a trust-score adjustment endpoint
   - RPC like `apply_trust_penalty(target_user_id, delta, reason, evidence)`
   - Server-side compute/clamp + audit

3. Community reporting moderation pipeline
   - Ensure report categories are stored (map UI categories to backend schema)
   - Add admin review status fields to reports if needed

## C) UI Tasks (non-breaking improvements)
1. Display backend safety metadata when available
   - Update `app/(dashboard)/messages/page.tsx` to use backend safety fields instead of only client analysis.

2. Report UI improvements
   - In `report-user-modal.tsx`, ensure the “reported account” hint matches backend field expectations (phone vs user_id).

3. TrustGuard learning foundation
   - If backend supports lesson completion:
     - add completion state + unlock trust bonuses.
   - If not supported:
     - keep local-only completion as a placeholder and label clearly.

## D) Refactor Opportunities
1. Remove duplicated message warning logic once backend fields exist
   - `messages/page.tsx` and message compose components can share one “message safety view model” helper.

## E) Demo Readiness Checklist
1. On a test account:
   - Send a message containing “Send OTP” from one user to another.
   - Receiver sees “⚠️ This message may be unsafe”.
2. In ScamShield:
   - Ensure a safety signal appears in `scam_reports` after sending (if RLS allows).
3. Admin dashboard:
   - Verify the Trust & Safety card shows recent events.

## F) Documentation Quality Requirements (for future contributors)
- When adding new backend behaviors:
  - document the required DB columns/RLS policies
  - state whether UI is placeholder or production-backed
- Prefer adding feature-specific docs in `docs/` rather than scattering knowledge in code.

