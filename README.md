# SWFL StormGuard AI

Solo hackathon entry supported by Codex, OpenCode, and Antigravity. Recovered worker implementation: labeled sample assessments, a printable documentation draft, and server-side photo analysis through OpenRouter or Gemini. Copilot and live emergency information remain unavailable. A real-key Gemini smoke test is still required.

## Local development

Use Node 22.12+ (22.x) or Node 24+.

```sh
npm install
npm run dev
```

UI: http://127.0.0.1:5173. In another terminal, `npm run dev:server` starts the API on port 8787. Copy `.env.example` to ignored `.env.local` and set `AI_PROVIDER=openrouter`, server-only `OPENROUTER_API_KEY`, and `OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free`. Alternatively, select `AI_PROVIDER=gemini` and set `GEMINI_API_KEY` / `GEMINI_MODEL`. Restart the API after configuration changes. Never use a `VITE_` key or commit credentials. Health reports configuration presence, not provider connectivity. Sample selection needs no key; live failures never substitute sample results.

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

OpenRouter is the recommended runtime setup for this demo. Its default `nvidia/nemotron-3.5-super-vl:free` advertised image input and structured outputs in the [model catalog](https://openrouter.ai/api/v1/models) on November 2, 2026. Free endpoints are rate-limited and availability can change. Model support is tested with mocks until a real OpenRouter key is configured. Credentials remain server-side; the model string in reports identifies the selected provider model.

The optional Gemini runtime model is `gemini-3.8-flash`, which [Google documents](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) as supporting image input and structured output. Your API project still needs model access and quota. The app's runtime key is separate from development-tool logins.

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

Both worker worktrees and their commits exist. Recovery restored their code into the main working directory without resetting history or changing the worktrees. Reconstructed integration fixes are uncommitted; see `docs/handoffs/integration-report.md`. Do not rerun the initial setup script to merge these changes.

## Scope

All sample results are illustrative fixtures. Photo results are provisional documentation, not official FEMA classifications, coverage/eligibility determinations, repair quotes, or structural-safety certifications. Unknown emergency information stays unavailable.

## Browser regression tests

`npm run test:e2e` starts an isolated Vite server on port 5175 and uses installed Google Chrome via Playwright. Browser AI responses are mocked, so automated checks never consume API quota. It tests sample/live/error flows, upload validation, drag/drop, offline behavior, print/PDF, mobile/tablet/desktop layouts, keyboard controls and serious automated accessibility issues. PDFs/screenshots and a JSON result file go to `dogfood-output/`. A live provider smoke test is still separate.
