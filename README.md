# SWFL StormGuard AI

Solo hackathon entry supported by Codex, OpenCode, and Antigravity. Scaffold stage: explicit sample assessments and a printable documentation draft work through the browser service layer. Live analysis and copilot are intentional unavailable stubs awaiting OpenCode implementation. There is no verified live emergency feed.

## Local development

Use Node 22.12+ (22.x) or Node 24+.

```sh
npm install
npm run dev
```

UI: http://127.0.0.1:5173. In another terminal, `npm run dev:server` starts the stub API on port 8787. Copy `.env.example` to `.env.local` for future server-only Gemini configuration. Never use a `VITE_` key or commit credentials. The scaffold remains a stub even if credentials are configured.

```sh
npm test
npm run build
npm run preview
```

Preview is for the static build and has no API proxy. Same-origin production API hosting is a later integration task. Generated assets do not make the app fully offline; samples work locally while the dev server runs, but no service worker is installed.

## Contracts and worker tasks

- `AGENTS.md`: ownership and handoff rules.
- `docs/contracts.md`: stable service/API/UI contracts.
- `docs/handoffs/backend.md`: OpenCode assignment.
- `docs/handoffs/frontend.md`: Antigravity assignment.
- `docs/dependencies.md`: version evidence and verification limitations.

Start each worker in its assigned worktree after the scaffold commit. Worktrees need their own dependency install and do not inherit uncommitted files or conversations. Do not run both UIs on port 5173 simultaneously; close the integration UI before starting the frontend worker UI, or run `npm run dev -- --port 5174`.

The current agent sandbox permits project edits but makes `.git` read-only. The scaffold commit and worker worktrees could not be created from that sandbox. Run `bash scripts/setup-worktrees.sh` from an ordinary terminal to commit the prepared scaffold and create both worktrees. This script launches no agents. Then install dependencies in each checkout when registry access is available. Until the script succeeds, the worker paths in the handoffs are planned paths, not existing checkouts.

## Scope

All sample results are illustrative fixtures. Photo results are provisional documentation, not official FEMA classifications, coverage/eligibility determinations, repair quotes, or structural-safety certifications. Unknown emergency information stays unavailable.
