# FEMZYK NÀÁRA — Developer Handoff

## 1) Project Overview
FEMZYK NÀÁRA is a modular Next.js (App Router) + Supabase platform for Africa’s informal economy:
- Skills verification (SkillForge / ProofPortfolio)
- Opportunities (local gigs + global gigs)
- Community forum + petitions
- Resource sharing (FreeCycle / AssetShare)
- Trust + safety signals (TrustGuard / Module 16: Digital Safety Engine)

This repo uses Next.js 16 + Supabase with Turbopack.

## 2) Current Tech Stack
- Frontend: Next.js App Router + React (client/server components)
- Styling: Tailwind CSS
- Supabase:
  - Auth (Supabase Auth)
  - Database (Postgres via Supabase)
  - Realtime (used in messaging + notifications)
  - Storage buckets for evidence/media

Key Supabase client files:
- Server-side Supabase client: `lib/supabase/server.ts`
- Browser/client Supabase client: `lib/supabase/client.ts`

## 3) App Architecture Summary
App Router pages are split into:
- `app/(auth)/*` (auth pages)
- `app/(dashboard)/*` (authenticated dashboard ecosystem)
- Server components are used for data fetching pages; client components are used for interactive UI (messaging compose, modals, etc.).

## 4) Folder Structure Summary (practical)
Most relevant code for this handoff:
- `app/(auth)/register/page.tsx` (signup + creates `users` row)
- `app/(dashboard)/profile/page.tsx` (profile fetch + “Complete Profile” fallback)
- `app/(dashboard)/messages/page.tsx` (messaging list + send)
- `app/(dashboard)/user/[userId]/message-button.tsx` (compose from public profile)
- `app/(dashboard)/user/[userId]/report-user-modal.tsx` (report UI)
- `app/(dashboard)/admin/page.tsx` (admin dashboard + Trust & Safety card)
- `app/(dashboard)/trust-guard/page.tsx` (TrustGuard UI)

Reusable safety/trust services:
- `lib/safety/analyzeMessage.ts` (deterministic risk analysis)
- `lib/safety/digitalSafetyEngine.ts` (auto-flag + persistence + trust penalty)
- `lib/safety/trustScoreService.ts` (centralized bounded trust delta update)
- `lib/safety/reportUserService.ts` (report persistence + trust penalty attempt)
- `lib/safety/adminModerationService.ts` (admin moderation placeholder)

## 5) Auth Flow Summary
Primary entry:
- `app/(auth)/register/page.tsx`
  - Creates auth user via `supabase.auth.signUp`
  - Inserts a new row into `users` (profile) with `auth_id` = auth user id

Stability note:
- We stabilized client auth usage in the dashboard by removing duplicate `supabase.auth.getUser()` calls from components that run concurrently (see “Known Risks”).

## 6) Profile Flow Summary
- `app/(dashboard)/profile/page.tsx`
  - Fetches profile row from `users` with `auth_id = session.user.id`
  - If `users` row is missing, it shows **Complete Profile** UI and inserts the missing row.

This prevents blank profile states after signup races or RLS delays.

## 7) Messaging Flow Summary (including Module 16)
Sending messages is implemented in two places:
1) Main Messages page:
   - `app/(dashboard)/messages/page.tsx`
   - Uses `supabase.rpc('send_message', {...})`

2) Message compose from public user profile:
   - `app/(dashboard)/user/[userId]/message-button.tsx`
   - Also uses `supabase.rpc('send_message', {...})`

Risk detection:
- Both send flows call `autoFlagMessageIfUnsafe()` from:
  - `lib/safety/digitalSafetyEngine.ts`
- The content is analyzed by:
  - `lib/safety/analyzeMessage.ts`

Receiver warning UI:
- Implemented in `app/(dashboard)/messages/page.tsx`:
  - For incoming messages only (`m.sender_id !== userId`)
  - Shows: `⚠️ This message may be unsafe`

Backend persistence:
- Auto-flag messages are persisted as a **MVP safety signal** into the existing backend table:
  - `scam_reports` with `scam_type='messaging'`

Important: For RLS compatibility in client-side MVP, the safety signal is created under the sender’s auth context (details in “Known Constraints”).

## 8) Trust / Safety Architecture Summary
Module 16 (first slice) is implemented as:
1) Deterministic content analysis (`analyzeMessage`)
2) Safety signal persistence (writes to `scam_reports`)
3) Trust score penalty attempt (`users.trust_score` update via `applyTrustScoreDelta`)
4) Reporting UI (`report-user-modal.tsx`) which also writes to `scam_reports`
5) Admin UI card on the admin dashboard that lists recent safety events

This is intentionally “thin MVP”:
- No new backend tables added yet
- UI warning works even if persistence fails

## 9) Supabase Integration Summary
Direct Supabase usage in this slice:
- Messages:
  - `supabase.rpc('send_message', ...)`
  - `messages` table query for chat history
  - `messages` table update to mark read
- Safety persistence:
  - `scam_reports` insert
  - `scam_reports` list query for admin
- Trust updates:
  - `users.trust_score` update with bounded clamp 0..100

Storage buckets referenced in safety-related code:
- `scam-evidence` (used by existing ScamShield report form)

## 10) Important Assumptions
Because we did not modify SQL in this iteration, the code assumes:
- `scam_reports` exists and supports:
  - columns: `user_id`, `scam_type`, `scam_detail`, `reported_account`, `risk_score`, `evidence_urls`, `timestamp`, `is_deleted`
- `users` table has:
  - column: `trust_score`
  - optional columns: `is_synced`, `last_synced` (best-effort)
- `send_message` RPC exists with parameters:
  - `p_receiver_id`, `p_content`, `p_client_message_id`, `p_conversation_id`

## 11) Known Constraints (backend compatibility)
### RLS compatibility for “auto-flagging”
The MVP implementation persists safety signals from the message sender client.
If your RLS policy for `scam_reports.user_id` requires `user_id = auth.uid()`, this approach is compatible.

However, a perfect “receiver-owned report record created at send time” would require:
- Backend-side trigger/RPC logic inside `send_message` or a server function
- Otherwise, we should expect the record ownership to be “sender-owned” for MVP stability.

### Trust score mutation ownership
`trustScoreService.ts` attempts to update `users.trust_score` for the target user id.
If RLS restricts updating other users, the penalty update will fail silently (service returns `ok:false`), but the chat UI will remain functional.

## 12) Current Implementation Status
### Production-ready (frontend)
- Auth/profile stabilization:
  - duplicate auth calls removed in `notification-bell.tsx` and `messages/page.tsx`
  - `profile/page.tsx` has “Complete Profile” fallback
- Messaging UI:
  - still sends messages through `send_message` RPC
  - receiver warning UI is shown for incoming risky messages
- TrustGuard UI module:
  - `/trust-guard` route exists

### Partial / placeholder (frontend + backend)
- Admin moderation actions:
  - UI buttons exist, but backend actions are not wired
- Trust score penalties for manual reporting:
  - persistence is best-effort; trust update may be blocked by RLS

## 13) Known Risks
1) RLS policies may block:
   - `scam_reports` inserts if `user_id` ownership doesn’t match auth user
   - `users.trust_score` updates if editing other users is restricted
2) Message warning UI depends on client-side analysis:
   - if you later want per-message persisted flags, you’ll need a safety event schema tied to `messages.message_id`

## 14) Recommended Next Steps
Backend (highest priority):
1) Move “auto-flag message -> create receiver safety signal -> trust penalty” into `send_message` RPC or a trigger.
2) Add a dedicated table (or columns) for message safety events:
   - link to `messages.message_id` for exact per-message warnings.
3) Implement admin moderation endpoints:
   - warn/suspend/ban actions with RLS + audit trails.

Frontend:
4) Improve warning UX using persisted safety metadata once backend schema exists.
5) Replace admin action placeholders with real endpoints once backend is ready.

