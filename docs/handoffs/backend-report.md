# Backend handoff report — final

- Integration checkout: `/Users/hz256598/Documents/code/hAIckaton` on `main`
- Provider migration commit: `a212764` (`feat: use NIM with OpenRouter failover and remove Gemini`)
- Live-verification report commit: `4a825fc`
- Worker implementation history: `work/backend` at `c8f2287` (Gemini version, now superseded)
- Worker: OpenCode / services + data

## Current delivered behavior

- `POST /api/analyze` accepts exactly one multipart `image` part.
- Uploads are checked for declared MIME, actual JPEG/PNG/WebP signature, basic container completeness, the 5 MiB file cap, and the 6 MiB body cap.
- Live analysis uses a server-owned provider chain:
  - **Primary:** NVIDIA NIM, `nvidia/nemotron-3.5-super-vl-120b-a12b`
  - **Backup:** OpenRouter, `nvidia/nemotron-3.5-super-vl:free`
- Provider keys and model IDs come only from `NIM_API_KEY`/`NIM_MODEL` and `OPENROUTER_API_KEY`/`OPENROUTER_MODEL`.
- The whole chain shares a 25-second budget. The primary gets at most 12 seconds when a backup is configured; the backup uses the remainder.
- Authentication/configuration, rate/credit, network, pending, and timeout failures may use the backup.
- Invalid or refused model output stops immediately; it is not retried to evade a refusal.
- A client disconnect aborts the active provider call and prevents another attempt.
- Provider output is validated before the server adds trusted provenance and limitations. Severity is limited to `minor | moderate | major | unknown`; text and list sizes are bounded.
- Reports identify the successful provider/model in the existing `model` field (for example `nim:nvidia/...`) and add a trusted backup-use note when applicable.
- Sample mode is unchanged: stable sample IDs, explicit `mode: 'sample'`, no provider key required, and visibly synthetic SVG illustrations.
- An arbitrary upload never receives a sample assessment. If both providers fail, the API returns an explicit safe error and no assessment.
- Gemini runtime support and the saved Gemini credential were removed.

## Safe error mapping

- 400 `INVALID_REQUEST` / `INVALID_IMAGE`
- 413 `IMAGE_TOO_LARGE`
- 415 `UNSUPPORTED_MEDIA_TYPE`
- 503 `NOT_CONFIGURED` / `UNAVAILABLE`
- 502 `INVALID_RESPONSE`
- 504 `TIMEOUT`
- 405 / 404 for method and route errors

Errors never include credentials, provider payloads, stack traces, or image bytes.

## Checks and results

- `npm test` — **46 passed, 0 failed**.
- `npm run test:render` — **4 passed**.
- `npm run test:e2e` — **10 passed** in installed Chrome; mocked AI, no provider quota consumed.
- `npm run check` — passed tests and production build.
- `npm run build` — 26 modules transformed; no server credential found in the browser bundle.
- `git diff --check` — clean.
- `.env.local` remains gitignored with mode `0600`.

## Live provider verification

Both saved keys authenticated successfully against their real services. No keys were printed or copied into reports.

| Check | Result | Observed time |
|---|---|---|
| NIM neutral-image analysis | HTTP 200, valid schema, correctly reports no damage evidence | 2.6 s |
| OpenRouter neutral-image analysis | HTTP 200, valid schema, correctly reports no damage evidence | 4.5 s |
| Browser upload → primary NIM → report | Real live report with NIM provenance | 2.9 s |
| Simulated NIM 503 → real OpenRouter backup | HTTP 200, live result, OpenRouter provenance and backup note | 5.8 s |
| Browser synthetic roof illustration → NIM | Identifies the illustration and visible roof features; warns it is not real evidence | PASS |
| Live roof report PDF | Two pages; provenance, synthetic warning, limitations, timestamp retained | PASS |

Evidence: `dogfood-output/live-browser-result.json`, `live-failover-result.json`, `live-roof-result.json`, `pdfs/live-neutral.pdf`, `pdfs/live-roof-illustration.pdf`, and `screenshots/live-roof-report.png`.

Automated tests still mock provider responses so they do not consume quota. The live checks above are separate.

## Setup

Create an ignored `.env.local` in the integration checkout:

```dotenv
AI_PROVIDER=nim
AI_FALLBACK_PROVIDER=openrouter
NIM_API_KEY=your-nvidia-key
NIM_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
PORT=8787
```

Run `npm run dev` and `npm run dev:server` in separate terminals. Restart the API after changing credentials. `/api/health` reports configuration presence, not live credential/quota validity.

## Remaining issues

- Real damaged-property photo accuracy was not evaluated; test inputs were a neutral generated image and a visibly labeled synthetic roof illustration.
- Both providers use Nemotron, so a shared underlying-model outage may affect both.
- Copilot and live emergency feeds remain intentionally unavailable.
- Production same-origin API hosting and public repository publication remain owner tasks. Nothing was pushed or deployed.
- The older `work/backend` worktree still contains the Gemini implementation; do not continue there without syncing from `main`.
- The previously pasted Gemini key must be treated as compromised and revoked; it is not used by the current app.
