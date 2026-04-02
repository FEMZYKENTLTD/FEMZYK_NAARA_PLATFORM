# FEMZYK NÀÁRA — DB & Backend Dependencies

This doc lists the **actual Supabase tables/functions/storage buckets** referenced by the codebase (based on recent code edits and searches), plus what must exist in backend to make the safety slice fully functional.

## 1) Supabase Tables referenced in this repo (key ones)
### Core identity & profile
- `users`
  - Used in:
    - `app/(dashboard)/register/page.tsx` (insert profile row)
    - `app/(dashboard)/profile/page.tsx` (select + update + fallback insert)
    - `app/(dashboard)/user/[userId]/page.tsx` (public profile)
    - Safety/trust:
      - `lib/safety/trustScoreService.ts` updates `users.trust_score`
  - Assumed columns:
    - `user_id`, `auth_id`, `full_name`, `username`, `phone_number` (optional), `role`, `trust_score`, `profile_photo`, `cover_photo`, `language`, `is_verified`, etc.

### Messaging
- `messages`
  - Used in:
    - `app/(dashboard)/messages/page.tsx` (select conversation + mark read)
    - `lib/supabase/*` via RPC usage

- `send_message` RPC
  - Used in:
    - `app/(dashboard)/messages/page.tsx` (messages page send)
    - `app/(dashboard)/user/[userId]/message-button.tsx` (compose send)
  - Assumed signature (from call sites):
    - `p_receiver_id`, `p_content`, `p_client_message_id`, `p_conversation_id`

### Safety signals & reporting (Module 16 MVP)
- `scam_reports`
  - Used in:
    - `app/(dashboard)/scamshield/report-form.tsx` (manual scam report insert)
    - `app/(dashboard)/scamshield/page.tsx` (list recent reports)
    - `app/(dashboard)/scamshield/scam-search.tsx` (search reports)
    - `lib/safety/digitalSafetyEngine.ts` (auto-flag messaging writes)
    - `lib/safety/reportUserService.ts` (report user writes)
    - `app/(dashboard)/admin/page.tsx` (Trust & Safety card lists recent reports)
  - Assumed columns (from code usage):
    - `report_id`
    - `user_id` (reporter/owner in the manual scamshield flow)
    - `scam_type` (values include `phone`, `bank`, `messaging`, `other`)
    - `scam_detail`
    - `reported_account`
    - `risk_score` (number)
    - `timestamp` (used for ordering/display)
    - `evidence_urls` (array used by scamshield report form + recent report rendering)
    - `is_deleted` (used by scamshield page query)

### Admin reads for counts
- `skill_suggestions`
  - Used in:
    - `app/(dashboard)/admin/page.tsx` (count pending suggestions)
    - `app/(dashboard)/admin/skills/page.tsx` (review/approve)

### Notifications (existing)
- `notifications`
  - Used in:
    - `app/(dashboard)/notification-bell.tsx` (select/list + realtime inserts)
    - `app/(dashboard)/user/[userId]/message-button.tsx` (insert notification when new message is sent)
    - multiple other modules (not part of this slice)

## 2) Storage buckets referenced
- `scam-evidence`
  - Used in `app/(dashboard)/scamshield/report-form.tsx` to upload evidence images.

- `forum-media`
  - Used in multiple forum/profile upload flows (not directly part of module 16, but referenced in this repo).

## 3) What backend support is still required for full Module 16 behavior
### A) Perfect receiver-owned message warning persistence
Current MVP auto-flag writes a `scam_reports` record from the **sender** client.

To fully match the spec (“receiver warning UI driven by backend-saved per-message flags”):
1) Move “auto-flag risky messages” into the `send_message` RPC (or a DB trigger).
2) Create safety event records tied to `messages.message_id` (or add columns to `messages`).
3) Ensure the receiver can query those flags under RLS.

### B) Trust score updates for other users
`lib/safety/trustScoreService.ts` updates `users.trust_score` directly.
If RLS prevents updating other users, trust penalties from:
- `reportUserService.ts` (manual report penalty)
- `digitalSafetyEngine.ts` (auto-flag penalty)
may fail. The code is best-effort (won’t break messaging), but for production:
- Provide backend RPC like `apply_trust_penalty(target_user_id, amount, reason)` with admin or receiver-safe permission model.

### C) Admin moderation endpoints (warn/suspend/ban)
The admin buttons currently call `lib/safety/adminModerationService.ts` which throws “Not implemented”.
You’ll need backend endpoints + DB fields (e.g., `users.is_suspended`, `users.is_banned`, etc.) and RLS for admin-only actions.

## 4) RLS-sensitive paths (must be verified)
- Inserts into `scam_reports` from:
  - `reportUserService.ts`
  - `digitalSafetyEngine.ts`
  Must match ownership rules for `scam_reports.user_id`.
- Updates to `users.trust_score` from:
  - `trustScoreService.ts`
  Must be allowed for the requesting role (currently client-side best-effort).

