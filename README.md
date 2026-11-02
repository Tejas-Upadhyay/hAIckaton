# SWFL StormGuard AI

Solo hackathon entry supported by Codex, OpenCode, and Antigravity. Integrated implementation: labeled sample assessments, a printable documentation draft, and server-side photo analysis through NVIDIA NIM with OpenRouter backup. NIM and OpenRouter were each verified live on November 2, 2026; a real damaged-property photo has not been evaluated. Copilot and live emergency information remain unavailable. Nothing is deployed.

## Local development

Use Node 22.12+ (22.x) or Node 24+.

```sh
npm install
npm run dev
```

UI: http://127.0.0.1:5173. In another terminal run `npm run dev:server` for port 8787. Configure ignored `.env.local`:

```dotenv
AI_PROVIDER=nim
AI_FALLBACK_PROVIDER=openrouter
NIM_API_KEY=your-nvidia-key
NIM_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
PORT=8787
```

Restart the API after changing credentials. Both keys remain server-side. The backup is used on service/configuration failures within a shared timeout, never as a substitute sample. Reports show which provider/model answered. Invalid/refused model output stops rather than bypassing refusal. See [provider details](server/README.md). Live provider verification passed with both keys on November 2, 2026. Samples need neither key.

```sh
npm test
npm run test:targeted
npm run test:render
npm run test:e2e
npm run build
npm run preview
```

Preview is for the static build and has no API proxy. Same-origin production API hosting is a later integration task. Generated assets do not make the app fully offline; samples work locally while the dev server runs, but no service worker is installed.

`npm test` includes real localhost HTTP tests and needs permission to bind a local port. `npm run test:targeted` runs service and in-memory API checks when sockets are restricted. `npm run test:render` checks actual React report markup; neither replaces a real provider smoke test or checking a saved PDF.

Uploads are checked for MIME, size, signatures, and basic container completeness before a provider request. This catches obvious truncation, but is not a full image decoder. Damaged compressed image data may still be rejected by the provider, with an explicit error rather than an invented assessment.


## Five-minute demo rehearsal

1. Open each sample and point out its synthetic illustration and SAMPLE report badge.
2. Print a report or save it as PDF; check that findings, generation time, and limitations remain visible.
3. Choose a JPEG/PNG/WebP photo up to 5 MiB. Confirm preview, then analyze. Without a connected API, the app must show unavailable and no report. With a configured API, verify LIVE AI INFERENCE and the model label.
4. Switch from upload to sample and remove/reselect a photo. Old evidence and reports must clear.
5. Show the county resource directory and static checklist. Live emergency feeds and copilot remain explicitly unavailable.

## Contracts and worker tasks

- `AGENTS.md`: ownership and handoff rules.
- `docs/contracts.md`: stable service/API/UI contracts.
- `docs/handoffs/backend.md`: OpenCode assignment.
- `docs/handoffs/frontend.md`: Antigravity assignment.
- `docs/dependencies.md`: version evidence and verification limitations.

Start each worker in its assigned worktree after the scaffold commit. Worktrees need their own dependency install and do not inherit uncommitted files or conversations. Do not run both UIs on port 5173 simultaneously; close the integration UI before starting the frontend worker UI, or run `npm run dev -- --port 5174`.

The integration is saved in local commit `4a825fc`. The worker worktrees and their historical commits remain available, but they do not contain the NIM/OpenRouter migration. Do not continue backend work in `.worktrees/backend` without syncing it from `main`. Public repository publication and production hosting are separate owner tasks; nothing has been pushed or deployed.

## Scope

All sample results are illustrative fixtures. Photo results are provisional documentation, not official FEMA classifications, coverage/eligibility determinations, repair quotes, or structural-safety certifications. Unknown emergency information stays unavailable.

## Browser regression tests

`npm run test:e2e` starts an isolated Vite server on port 5175 and uses installed Google Chrome via Playwright. Browser AI responses are mocked, so automated checks never consume API quota. It tests sample/live/error flows, upload validation, drag/drop, offline behavior, print/PDF, mobile/tablet/desktop layouts, keyboard controls and serious automated accessibility issues. PDFs/screenshots and a JSON result file go to `dogfood-output/`. A live provider smoke test is still separate.
