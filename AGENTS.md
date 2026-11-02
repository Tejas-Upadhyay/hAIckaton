# StormGuard team instructions

One human owns this hackathon entry. Codex, OpenCode, and Antigravity are development tools. Read this file, `plan.md`, `docs/contracts.md`, and your handoff before editing. The implementation contracts and the project owner's latest instructions supersede speculative details in the original plan.

## Ownership

| Owner | Writable files |
|---|---|
| Codex | Root configuration, package/lock files, `src/main.jsx`, `src/App.jsx`, `src/contracts/**`, project documentation, integration |
| OpenCode | `src/services/**`, `src/data/**`, `server/**`, `tests/backend/**`, `public/samples/**`, `docs/handoffs/backend-report.md` |
| Antigravity | `src/components/**`, `src/styles/**`, `public/ui/**`, `tests/frontend/**`, `docs/handoffs/frontend-report.md` |

Codex may edit all files during integration after the workers finish. Workers must request contract/config/dependency changes in their report instead of editing another owner's files. Do not spawn or launch other agents unless the project owner explicitly asks.

## Commands

- Node: use Node 22.12+ (22.x) or Node 24+. Current machine: Node 26.11.1.
- `npm install` initially; `npm ci` after a lockfile exists. Each worktree needs dependencies installed.
- `npm run dev`: UI at http://127.0.0.1:5173.
- `npm run dev:server`: API at http://127.0.0.1:8787 in a separate terminal.
- `npm test`: dependency-free Node contract/service tests.
- `npm run test:targeted`: service and in-memory API checks without localhost sockets.
- `npm run test:render`: actual React report markup checks using existing Vite/React dependencies.
- `npm run test:e2e`: isolated Playwright browser/PDF/accessibility regressions using installed Chrome and mocked AI.
- `npm run build`: production UI build; required before integration is accepted.
- `npm run preview`: built UI smoke test only. It has no API proxy; preview supports samples, and live API hosting remains a deployment concern.
- `npm run check`: tests and build.

## Collaboration

- Codex integrates in the original checkout. OpenCode uses `.worktrees/backend` / `work/backend`; Antigravity uses `.worktrees/frontend` / `work/frontend`.
- Worktrees contain separate copies of tracked files. They do not share chat history, uncommitted edits, or installed dependencies. Never work in another agent's checkout.
- Do not stage with a broad command that could include unrelated local files. Commit only your owned files.
- Handoff: branch, commit hash, changed files, test commands and results, environment needs, known issues, and requested contract changes. Record the report in your owned report file.
- Do not push, deploy, or submit the hackathon entry as part of these worker tasks.

## Application rules

- Prioritize upload → assessment → printable documentation draft. Emergency resources and copilot are secondary.
- AI credentials stay server-side: NIM_API_KEY/NIM_MODEL for primary NIM, OPENROUTER_API_KEY/OPENROUTER_MODEL for backup. AI_PROVIDER and AI_FALLBACK_PROVIDER define order. Gemini runtime support is removed.
- Model names in `plan.md` describe owner-reported development selections, not verified Gemini API endpoint IDs.
- Use `src/contracts/assessment.js` and `docs/contracts.md` as the interface authority. Do not add mandatory fields without an integration handoff. Reports identify the successful provider in the existing model field.
- Return explicit unavailable/errors for live failures. Samples are user-selected, visibly labeled illustrations; never substitute a sample assessment for an arbitrary uploaded image.
- Emergency entries need verified source URLs and timestamps; otherwise show unavailable or demo. Never infer official evacuation zones from city names or hard-coded surge heights.
- Photo assessments are provisional observations. Do not claim official FEMA classifications, eligibility, structural safety, confirmed mold, or repair quotes from a photo.
- Keep reports labeled with sample/live provenance, limitations, and generation time, including in print.
