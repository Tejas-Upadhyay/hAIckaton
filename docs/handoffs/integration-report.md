> **Current provider setup:** NIM primary with OpenRouter backup; Gemini runtime and saved credential removed. Failover covers unavailable/configuration/auth/rate/network/timeout/pending responses under one 25-second budget. Invalid/refused output stops. Reports identify the answering provider/model and backup use. Verification: 46 Node/HTTP, 4 render, and 10 browser checks pass, plus production build. Real provider checks await NIM and OpenRouter keys. Both routes use Nemotron, so a shared underlying-model outage may affect both.

> **Latest verification supersedes earlier restrictions:** full Node/HTTP suite 40/40, render checks 4/4, and Playwright browser checks 10/10 PASS. Three actual PDFs verified. Recommended provider is now OpenRouter; real inference awaits its key. See [current QA report](../../dogfood-output/report.md). Integration is being saved as a local commit; nothing is pushed/deployed. Earlier read-only/DNS/browser restrictions below are historical.

> Latest QA follow-up: production build passes, 23 targeted + 4 render checks pass; full localhost suite and real Gemini/PDF remain blocked. See [user QA report](../../dogfood-output/report.md).

# Integration verification — November 2, 2026

## Integrated code and repository state

Main checkout: `/Users/hz256598/Documents/code/hAIckaton`. Backend source: `work/backend` at `c8f2287` (implementation `ce752ad`); frontend source: `work/frontend` at `e09b7bd`. Both workers' implementations are present together in the main working directory after recovery. Neither worker worktree was changed. The pre-existing Vite allowedHosts setting and pitch deck were preserved.

**No integration commit/merge was recorded.** `.git` is read-only in this environment: staging failed with `Unable to create .git/index.lock: Operation not permitted`. Main HEAD remains `1bcca46`. Review and commit restored/integrated files from a Git-writable terminal; do not reset or clean the working tree. No push, deployment, or submission was performed.

## Integration fixes

- Approved optional sample-list imageUrl and restored explicitly synthetic sample images.
- File replacement/removal invalidates requests and clears reports. Rejected replacement files also clear previous evidence, avoiding stale-report confusion.
- File input resets to permit same-file reselection, and uses shared MIME/size constants.
- Added an accessible name to the hidden file picker and fixed the low-contrast Choose a photo button found in mobile browser inspection.
- Moved global CSS defaults into the Tailwind base layer so utility colors can override them.
- Non-JSON proxy errors now show unavailable rather than an invalid-assessment message.
- Removed the unconditional offline guarantee; no service worker exists.
- Updated county portal links using Florida's official directory, with a visible source/date. No live evacuation data or fabricated shelter status was added.
- Removed developer handoff wording from copilot notices and unsupported precise thresholds from the static checklist. Copilot remains explicitly unavailable.
- Updated server-only configuration example, runtime setup docs, contracts and check commands.

## Automated checks

- `npm ls --depth=0`: all six pinned dependencies present.
- `npm run build`: PASS; 26 modules transformed, local sample assets emitted.
- `npm run test:targeted`: PASS, 18/18. Covers fixtures, no-key failure through the real request handler, image rejection, safe provider/auth/network/timeout failures, unavailable secondary features and mocked live response acceptance.
- `npm run test:render`: PASS, 4/4. Actual React markup preserves report provenance/time/limitations, escapes provider text, labels synthetic images and shows errors without reports.
- `npm test`: 31 total, 18 pass, 13 fail **before HTTP transport checks execute**, each with `listen EPERM 127.0.0.1`. The full suite is not green in this environment. Run it in a normal terminal.
- `git diff --check`: clean.
- Built client JavaScript: no server key variable, API-key prefix, or known test key detected. This is a targeted scan, not a general security certification.

## Browser demo verification

Used Chrome DevTools on the already-running UI at http://127.0.0.1:5173. The agent shell could not start a separate Vite/API listener because local port binding is restricted. Browser source and screenshots reflected the integration changes.

Verified with real DOM events in the browser:

- All three sample selections display SAMPLE reports, with loaded synthetic images.
- Invalid format, empty file and oversized image are rejected; previous report clears.
- Valid file input and drag/drop show a photo preview.
- File input resets for reselection. Sample selection clears uploaded evidence.
- Analyze with the unavailable API displays a notice and no fabricated assessment. The current Vite API health proxy returned 502; no API server was reachable there.
- Injected a clearly mocked API response only inside the test browser: live provenance/model rendered, and Remove photo cleared report/preview. This does not verify Gemini.
- Static checklist toggles and copilot form shows unavailable.
- Print button invokes window.print (intercepted during this check). Actual print dialog, pagination, and saved PDF remain unverified.
- At 375, 768 and 1440 pixels: no horizontal overflow; sample images loaded. Reviewed mobile and full-page desktop screenshots. No pre-existing visual baseline: visual regression comparison is INCONCLUSIVE.
- Keyboard Tab reached Change photo with a visible 3px focus outline. No unnamed form inputs detected. No full screen-reader or axe audit was performed; do not claim complete accessibility certification.
- Browser console check after the sample flow showed no error/warning messages. Failed API requests are expected during explicit unavailable-path tests.

## Live AI setup and remaining work

QA follow-up: the owner supplied a runtime key, now saved in ignored .env.local with mode 0600 and model configuration. The shell could not reach Google (DNS ENOTFOUND) or bind the API port (EPERM), so key validity/quota and real inference remain unverified. See ../../dogfood-output/report.md for current QA results.

Create ignored .env.local:

```dotenv
GEMINI_API_KEY=your-real-server-only-key
GEMINI_MODEL=gemini-3.8-flash
PORT=8787
```

Run npm ci if needed, npm run dev for UI, and npm run dev:server in a second terminal. Restart the API after config changes. Health reports configuration presence only. Confirm your API project has model access/quota, then analyze a real supported photo and inspect the response, latency and quality. Development-tool subscriptions do not configure runtime credentials.

Still required: real Gemini smoke test, full localhost HTTP suite in an unrestricted terminal, actual saved-PDF inspection, and a Git integration commit. Copilot and live emergency feeds are intentionally unavailable. Production same-origin API hosting is a separate deployment task; preview has no API proxy.

Sources checked November 2, 2026:
- Model vision/structured-output support: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- REST request fields, including store: https://ai.google.dev/api/generate-content
- County directory: https://www.floridadisaster.org/planprepare/counties/
- Lee portal: https://www.leefl.gov/584/Emergency-Management
- Charlotte portal: https://www.charlottecountyfl.gov/departments/emergency-management/
- Collier portal listed by the state directory: https://www.collier.gov/Public-Safety/Emergency-Management (direct page fetch returned 403; page content unverified).

---

## Recovery record

# Recovery report — November 2, 2026

The main directory had reverted to scaffold commit `1bcca46`; worker implementation and integration files were missing. The backend branch `c8f2287` and frontend branch `e09b7bd` were intact. Applied their disjoint diffs back to the main working directory without altering Git history or either worktree.

Backed up the pre-recovery project files, excluding secrets, to `/tmp/stormguard-before-recovery-20261102-104718.zip`. The pitch deck, local Vite host configuration, package lockfile, and local exports were preserved.

Worker files were recovered from committed sources. Uncommitted integration files had no exact Git snapshot; reconstructed the earlier photo-clear/request invalidation fix, file-input reset, shared validation constants, sample image display, Tailwind base layer, contract/documentation updates, socket-free API checks, and React report-render checks from session evidence. This is a functional reconstruction, not a byte-for-byte restoration of every deleted uncommitted file.

Validation: production build passes, 15 socket-free backend/frontend/integration checks pass, and 4 actual React render checks pass. The full backend HTTP suite remains unverified here because localhost port binding is restricted (`EPERM`). Browser events, visual layout, real print/PDF behavior, and an actual Gemini request remain unverified. No secrets were read or provider calls made during recovery.

No recovery commit or branch merge has been recorded. Review and commit the restored changes from a Git-writable terminal; the worker commits are still available. The original integration request can continue from these recovered files.
