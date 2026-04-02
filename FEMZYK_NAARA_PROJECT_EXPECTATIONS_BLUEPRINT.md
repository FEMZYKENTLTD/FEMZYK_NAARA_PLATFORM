# FEMZYK NÀÁRA — Project Expectations & Blueprint (UI + Module Spec)

This file captures the additional ecosystem expectations you requested after Parts 8–11, including the new **TrustGuard** UI module and the MUST-ADD **Module 16: Digital Safety Engine** (Trust & Safety Intelligence Layer).

## TrustGuard (Dashboard Module)
**Goal:** Provide user-facing safety insights and suspicious-activity workflows without breaking existing messaging functionality.

**Pages / UI**
- Dashboard homepage must include a TrustGuard card in the same style as existing module cards.
- Create route: `(/dashboard)/trust-guard` (URL: `/trust-guard`).

**UI-first scope (current)**
- Trust indicator (low / medium / high risk).
- Educational tips for cyber safety.
- A “Report Suspicious Activity” UI scaffold (submit is UI-only until backend wiring is added).

## Module 16 — Digital Safety Engine
**Name:** Digital Safety Engine (Trust & Safety Intelligence Layer)

### Core Idea
The platform actively detects, prevents, and educates against cybercrime/scam behavior in real-time, and turns those signals into a dynamic user safety/trust layer.

### What Module 16 Adds (expected behavior)
1. **Smart Message Risk Detection** (integrated with the existing messaging system)
   - Detect suspicious message patterns:
     - scam language
     - phishing attempts
     - manipulation patterns (e.g. “Send OTP”, “Click this urgent link”, “You’ve won…”)
   - System response (receiver-facing):
     - flag message as unsafe
     - show a clear warning before the receiver acts

2. **Dynamic Trust Score**
   - Use `trust_score` as a dynamic safety+trust indicator:
     - increase trust when behavior is normal / verified actions occur
     - decrease trust when behavior is flagged / reported

3. **Community Reporting System**
   - “Report user” workflow with categories:
     - Scam
     - Harassment
     - Fake identity
   - Reports feed into safety signals and admin review:
     - repeat offenders get limited
     - admin can warn/suspend/ban

4. **Cyber Awareness Micro-Learning**
   - In-app lessons on scam/phishing/data protection
   - Gamification:
     - completing lessons increases trust/safety signals

5. **Identity + Behavior AI Layer (heavy AI)**
   - Track behavioral anomalies:
     - unusual messaging frequency
     - repeated copy-paste patterns
     - multiple reports across time/windows
   - Automatically flag suspicious accounts for review

### How Module 16 Fits the Current System (non-breaking integration)
- Existing messaging remains intact.
- The new safety engine operates as an enhancer:
  - message scanning -> warnings
  - safety signals -> trust score adjustments
  - reports -> admin workflow + safety signals
  - lessons -> safety/trust rewards

### Backend wiring required (implementation note)
UI scaffolding is present now (TrustGuard), but backend logic is not yet implemented end-to-end:
- Message risk detection needs receiver-facing UI integration + persistence of “flagged” events.
- Trust score adjustments require a safety-signal pipeline that updates `users.trust_score` (and/or writes to a safety table).
- Reporting needs a stored report model + RLS + admin review actions.
- Micro-lessons require course/lesson tables and completion tracking.

