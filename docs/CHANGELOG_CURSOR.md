# Changelog

## 2026-03-25

### What I fixed (previous pass, high impact)
- Stabilized auth/session usage to prevent Supabase auth token lock errors.
  - Updated `app/(dashboard)/notification-bell.tsx` to ensure `supabase.auth.getUser()` is called only once per load and reused.
  - Updated `app/(dashboard)/messages/page.tsx` to avoid repeated `getUser()` calls during realtime refreshes.
- Fixed “profile not showing” states.
  - Updated `app/(dashboard)/profile/page.tsx` to show **Complete Profile** UI when the `users` row is missing and insert the missing profile row.

### What I added now (Module 16 Digital Safety Engine first slice)
- Implemented a centralized safety service layer:
  - `lib/safety/digitalSafetyEngine.ts` (auto-detect + persist safety signal + trust penalty attempt)
  - `lib/safety/trustScoreService.ts` (bounded trust_score delta helper)
  - `lib/safety/reportUserService.ts` (report user UI persistence + trust penalty attempt)
  - `lib/safety/adminModerationService.ts` (admin moderation stub abstraction)
- Wired safety into messaging (non-destructive):
  - Updated `app/(dashboard)/messages/page.tsx` to:
    - persist safety signals during send
    - show receiver warning UI for incoming messages
  - Updated `app/(dashboard)/user/[userId]/message-button.tsx` to persist safety signals on send
- Added community reporting UI:
  - New `app/(dashboard)/user/[userId]/report-user-modal.tsx`
  - Updated `app/(dashboard)/user/[userId]/page.tsx` to include “Report” action
- Extended admin dashboard UI:
  - Updated `app/(dashboard)/admin/page.tsx` with a Trust & Safety card
  - New `app/(dashboard)/admin/trust-safety-action-buttons.tsx` (warn/suspend/ban UI placeholders)

### Files changed (high level)
- Messaging, message compose, user profile, admin dashboard
- Added new safety services + docs

### Follow-up needed
- Confirm RLS ownership rules for `scam_reports` inserts and `users.trust_score` updates.
- Add backend wiring so receiver warnings can be driven by backend-saved per-message flags (instead of client analysis only).
- Wire real admin moderation backend endpoints.

