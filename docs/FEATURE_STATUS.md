# FEMZYK NÀÁRA — Feature Status

| Feature / Module | Status | Frontend Status | Backend Status | Notes |
|---|---|---|---|---|
| Auth (Signup/Login) | partial | Signup creates `users` row (`app/(auth)/register/page.tsx`) | Depends on Supabase Auth + RLS | Profile stabilization work prevents missing profile blank states |
| Profile | complete | `app/(dashboard)/profile/page.tsx` shows “Complete Profile” if `users` row missing | Supabase `users` table insert/update | Frontend inserts missing profile row (assumes backend/RLS allows) |
| Dashboard ecosystem | complete | Navigation cards + layout stable | N/A | Added module entry for `TrustGuard` |
| Messaging | complete | `app/(dashboard)/messages/page.tsx` + compose via `message-button.tsx` | Requires `send_message` RPC + `messages` table | Stability: removed duplicate auth calls to prevent Supabase lock errors |
| TrustGuard UI | complete | `/trust-guard` route exists (`app/(dashboard)/trust-guard/page.tsx`) | No backend logic yet | Lessons are UI-only foundations |
| Digital Safety Engine (Module 16) | partial | Risk analysis + receiver warning UI + report modal + admin card | Uses `scam_reports` table + attempts `users.trust_score` updates | MVP uses `scam_reports` as safety signal store; moderation endpoints not wired yet |
| Smart Message Risk Detection | partial | Sender send flows persist safety signal and show receiver warnings (UI via analysis) | Depends on RLS for `scam_reports` insert | Non-destructive: messages always send; safety writes are best-effort |
| Dynamic Trust Score Hooks | partial | Bounded trust penalty attempts in safety services | Depends on RLS for `users.trust_score` updates | Manual report penalty likely blocked if RLS forbids editing other users |
| Community Reporting (Report User) | complete (UI) | Modal report UI on public profile (`report-user-modal.tsx`) | Persists to `scam_reports` (best-effort) | Categories map to `scam_type='other'` due to limited enum |
| Admin moderation | placeholder | UI buttons exist in admin trust card | Not wired | Buttons call stub service throwing “Not implemented” |
| Skills | complete | SkillForge UI pages exist | DB tables: `trades`, `skills`, `apprentice_skills` | No explicit trust-score mutation in frontend; likely DB triggers |
| Opportunities | complete | Opportunities UI pages exist | DB tables: `gigs`, `global_gigs`, etc. | Not modified in this pass |
| FreeCycle | complete | FreeCycle pages exist | DB tables: `freecycle` / relevant tables | Not modified in this pass |
| Petitions | complete | Petition pages exist | DB tables: `petitions`, signatures | Not modified in this pass |
| Analytics / Trust-related | partial | Dashboard analytics route exists | Depends on DB tables | Not deeply modified here |

