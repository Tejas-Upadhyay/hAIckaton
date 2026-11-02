# Live provider verification completed

Both saved keys authenticated successfully against their real services. No keys were printed or copied into reports.

| Check | Result | Observed time |
|---|---|---|
| NIM independent neutral-image analysis | HTTP 200, valid schema, correctly reports no damage evidence | 2.6 s |
| OpenRouter independent neutral-image analysis | HTTP 200, valid schema, correctly reports no damage evidence | 4.5 s |
| Browser upload → primary NIM → report | Real live report with NIM provenance | 2.9 s |
| Simulated NIM 503 → real OpenRouter backup | HTTP 200, live result, OpenRouter provenance and trusted backup note | 5.8 s |
| Browser synthetic roof illustration → NIM | Live observations identify synthetic illustration and visible roof features, warn against treating it as real evidence | PASS |
| Live roof report PDF | Two pages; provenance, synthetic warning, limitations, timestamp retained; final page visually inspected | PASS |

The failure in the failover check was deliberately injected only for NIM; OpenRouter returned a real response. Automated regression tests still use mocked model responses to avoid consuming quota. The existing 46 Node/HTTP + 4 render + 10 browser checks passed on this implementation. No source changes were required after adding the valid credentials.

Evidence files: `dogfood-output/live-browser-result.json`, `live-failover-result.json`, `live-roof-result.json`, `pdfs/live-neutral.pdf`, `pdfs/live-roof-illustration.pdf`, and `screenshots/live-roof-report.png`. Keys are excluded from these artifacts and the browser bundle. Gemini configuration remains removed.

Remaining scope limits: real damaged-property photo accuracy was not evaluated; test inputs were a neutral generated image and a visibly labeled synthetic roof illustration. AI observations remain provisional. Copilot and live emergency feeds are intentionally unavailable. No deployment was performed. No handoff is required for the completed verification. If additional provider/backend issues arise, OpenCode is the appropriate worker; Antigravity handles visual/UI changes.

The older key/setup blockers below are historical and superseded by this live verification.

---

> **Current provider setup:** NIM primary with OpenRouter backup; Gemini runtime and saved credential removed. Failover covers unavailable/configuration/auth/rate/network/timeout/pending responses under one 25-second budget. Invalid/refused output stops. Reports identify the answering provider/model and backup use. Verification: 46 Node/HTTP, 4 render, and 10 browser checks pass, plus production build and real live calls to both providers. Both routes use Nemotron, so a shared underlying-model outage may affect both.

> **Latest verification supersedes earlier restrictions:** full Node/HTTP suite 46/46, render checks 4/4, and Playwright browser checks 10/10 PASS. Three actual sample PDFs and two live-report PDFs were verified. NIM and OpenRouter both returned real live results, including a simulated-primary-failure failover. See [current QA report](../../dogfood-output/report.md). Integration is committed locally; nothing is pushed or deployed. Earlier read-only/DNS/browser restrictions below are historical.

> Superseded QA follow-up: the full localhost suite, live provider calls, and saved-PDF checks were completed later the same day. See the live-verification section above and [current QA report](../../dogfood-output/report.md).

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

## Browser demo verification (historical, restricted environment)

> This pass predates the live provider work and the permission change. Current browser/PDF results are in the live-verification section at the top and in `dogfood-output/report.md`.

Used Chrome DevTools on the already-running UI at http://127.0.0.1:5173. The agent shell could not start a separate Vite/API listener because local port binding is restricted. Browser source and screenshots reflected the integration changes.

Verified with real DOM events in the browser:

- All three sample selections display SAMPLE reports, with loaded synthetic images.
- Invalid format, empty file and oversized image are rejected; previous report clears.
- Valid file input and drag/drop show a photo preview.
- File input resets for reselection. Sample selection clears uploaded evidence.
- Analyze with the unavailable API displays a notice and no fabricated assessment. The current Vite API health proxy returned 502; no API server was reachable there.
- Injected a clearly mocked API response only inside the test browser: live provenance/model rendered, and Remove photo cleared report/preview. This did not verify a real provider call.
- Static checklist toggles and copilot form shows unavailable.
- Print button invokes window.print (intercepted during this check). Actual print dialog, pagination, and saved PDF remain unverified.
- At 375, 768 and 1440 pixels: no horizontal overflow; sample images loaded. Reviewed mobile and full-page desktop screenshots. No pre-existing visual baseline: visual regression comparison is INCONCLUSIVE.
- Keyboard Tab reached Change photo with a visible 3px focus outline. No unnamed form inputs detected. No full screen-reader or axe audit was performed; do not claim complete accessibility certification.
- Browser console check after the sample flow showed no error/warning messages. Failed API requests are expected during explicit unavailable-path tests.

## Live AI setup and remaining work

The historical Gemini setup below was superseded by the NIM/OpenRouter migration in `a212764`. The current server-only configuration is:

```dotenv
AI_PROVIDER=nim
AI_FALLBACK_PROVIDER=openrouter
NIM_API_KEY=your-nvidia-key
NIM_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
PORT=8787
```

Both providers were verified live on November 2, 2026, including a browser upload and a simulated-primary-failure failover. The full localhost HTTP suite, saved-PDF inspection, and Git integration commit are complete. Copilot and live emergency feeds remain intentionally unavailable. Production same-origin API hosting and public repository publication are separate owner tasks; preview has no API proxy.

Remaining scope limit: real damaged-property photo accuracy was not evaluated. Test inputs were a neutral generated image and a visibly labeled synthetic roof illustration.

Sources checked November 2, 2026:
- NIM endpoint/model/schema: https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b-infer
- OpenRouter structured output: https://openrouter.ai/docs/guides/features/structured-outputs
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

Validation at recovery time: production build passed, 15 socket-free backend/frontend/integration checks passed, and 4 actual React render checks passed. The full backend HTTP suite was blocked by localhost port binding (`EPERM`). These restrictions were resolved later; the full suite, live provider calls, and saved-PDF checks now pass as recorded above. No secrets were read or provider calls made during recovery itself.

The recovery state was later committed as `8202317` and the provider migration as `a212764`; live verification is recorded in `4a825fc`. Worker commits remain available in their worktrees. The backend worktree still contains the superseded Gemini implementation and must be synced from `main` before further work.
