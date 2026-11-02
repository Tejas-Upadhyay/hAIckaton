# Antigravity handoff — frontend

> **Historical assignment:** The frontend was completed and integrated into `main`. The current app uses NIM primary with OpenRouter backup; Gemini is not part of the runtime. See `docs/handoffs/frontend-report.md` and `AGENTS.md`.

Worktree: `/Users/hz256598/Documents/code/hAIckaton/.worktrees/frontend`
Branch: `work/frontend`
Owner-reported model: Gemini 3.8. Select/verify it in Antigravity; this document does not change tool settings.

Read `AGENTS.md`, `plan.md`, and `docs/contracts.md`. Build on the functional scaffold, preserving the default `StormGuardApp({ services })` entry point.

## Owned files

`src/components/**`, `src/styles/**`, `public/ui/**`, `tests/frontend/**`, `docs/handoffs/frontend-report.md` only. Do not edit App.jsx, services, contracts, package/lock files, or config. Ask Codex for required dependency or contract changes.

## Tasks in priority order

1. Build a coherent, responsive SWFL property-documentation interface. Decompose the root component into Header, DamageAuditor, ClaimReportModal/report, and secondary resource components as useful.
2. Implement drag/drop and file-picker upload, validated file selection, preview, explicit analyze action, pending/empty/error states, and duplicate-request prevention. Use only the provided services prop or pass those functions to child components.
3. Sample selection clears uploaded evidence and uses explicit sample provenance. Display live errors without fabricated fallback results. Ignore stale responses after selection changes.
4. Show readable observations, informal severity, potential concerns, next steps, limitations, and generated time. Build a print view that preserves sample/live labeling and limitations. Browser Print / Save as PDF is enough.
5. Secondary emergency resources must show unavailable until verified data exists. Do not show fake evacuation orders, shelter capacities, city-derived zones, or a live alert ticker. Copilot may stay visibly unavailable.
6. Verify keyboard operation, accessible names, focus, status/error announcements, mobile layout, and print output. Keep animations optional and respect reduced motion.

## Verify

Install dependencies in this worktree, then `npm test`, `npm run build`, `npm run dev`. Inspect at mobile and desktop widths. Rehearse sample → report → print; upload → unavailable error; switching samples; invalid/oversized image; keyboard use. Do not add test dependencies without a Codex handoff. If package installation or browser tooling is unavailable, state exactly which checks remain unverified.

## Acceptance and report

A judge can complete a clearly labeled sample documentation flow with no API key. The same UI supports future live Assessment responses without contract changes. Printed output includes source mode and limitations. No backend modifications or credentials in UI.

Commit only owned files. Write `docs/handoffs/frontend-report.md` with branch, commit reference, changed files, checks/results, UI/browser evidence, requested dependencies/contracts, and remaining issues. Return the final commit hash to the owner. Do not push, deploy, or launch agents.
