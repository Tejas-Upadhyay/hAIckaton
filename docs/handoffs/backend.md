# OpenCode handoff — backend

> **Historical assignment:** The initial Gemini task was completed and later superseded. Current backend code lives in the integration checkout on `main` and uses NIM primary with OpenRouter backup. See `docs/handoffs/backend-report.md` and `server/README.md`.

Worktree: `/Users/hz256598/Documents/code/hAIckaton/.worktrees/backend`
Branch: `work/backend`
Owner-reported model: DeepSeek V4.1 Flash (free), max effort. Select/verify it in OpenCode; this document does not change tool settings.

Read `AGENTS.md`, `plan.md`, and `docs/contracts.md`. Implement v1 without changing shared contracts.

## Owned files

`src/services/**`, `src/data/**`, `server/**`, `tests/backend/**`, `public/samples/**`, `docs/handoffs/backend-report.md` only. Package/config changes go to Codex as requests. Native Node fetch/http is available; request a multipart parser dependency if needed rather than writing an unsafe parser.

## Tasks in priority order

1. Preserve all public service exports and working sample mode. Add representative, credited local sample assets if feasible; label synthetic illustrations. Keep IDs stable.
2. Implement POST `/api/analyze` on the supplied native Node server, using server-only NIM/OpenRouter credentials and runtime model IDs. Never hard-code the development tool's model name as an API model ID. The current implementation uses NIM primary, OpenRouter backup, and explicit failover.
3. Independently validate uploaded content, MIME, and caps. Validate structured model output and attach server-owned provenance. Add safe error mapping, timeouts, and no image persistence/logging.
4. Keep explicit sample selection distinct from live analysis, including on key/network/provider failure. No live response may be a fixture.
5. Preserve unavailable emergency status unless real source verification and a Codex-approved entry schema exist. Copilot is secondary and may remain 503.
6. Add meaningful tests for malformed input/model output, absent credentials, provider/network failures, timeouts, and sample/live separation. Mock provider calls; do not require paid calls or secrets in tests.

## Verify

`npm test`, `npm run build`, then run `npm run dev:server` and check GET `/api/health` and absent-key POST behavior. If npm install is blocked, run dependency-free tests and state the build limitation; do not claim a pass. Never print keys.

## Acceptance and report

Browser can still use samples with no API key. Arbitrary uploads never receive sample assessments. Valid live output conforms to v1 with trusted metadata. Invalid/oversized images, invalid model JSON, and missing credentials fail clearly. No API key appears in browser code or bundle.

Commit only owned files. Write `docs/handoffs/backend-report.md` with branch, commit reference, files, checks/results, model/API setup needed, requested dependencies/contracts, and remaining issues. Return the final commit hash to the owner for integration. Do not push, deploy, or launch agents.
