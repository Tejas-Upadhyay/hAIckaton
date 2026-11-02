# StormGuard QA — current verification

**Date:** November 2, 2026. **Browser:** installed Google Chrome. **Scope:** local hackathon MVP, not a production deployment.

## Result

- Production build: PASS.
- Full Node/HTTP suite: 40/40 PASS, including provider adapters, stream caps, disconnect cancellation, malformed output, credential isolation, and timeout handling.
- Actual React report rendering: 4/4 PASS.
- Playwright user journeys: 10/10 PASS.
- Three actual browser-generated sample PDFs: each one page; text extraction confirms SAMPLE, limitations and generation time, with controls hidden. Roof report inspected visually after rasterization.
- Automated accessibility: zero serious/critical WCAG A/AA violations in the checked sample-report state. This is not full accessibility certification or a screen-reader audit.
- Credential scan: no configured key or server key variable found in built browser JavaScript. .env.local remains ignored with owner-only permissions.

**All 54 automated checks pass. Live inference remains the only provider setup blocker.** The supplied Gemini credential received HTTP 401 UNAUTHENTICATED from Google; an actual upload through the local backend returned safe 503 NOT_CONFIGURED with no fabricated assessment. The app now selects OpenRouter, with an empty OPENROUTER_API_KEY awaiting the owner. No OpenRouter request has been made with a real key.

## Browser coverage and evidence

The reproducible suite is `npm run test:e2e`, with configuration in playwright.config.js and cases in tests/e2e/demo.spec.js. It starts a separate local UI on port 5175, mocks AI responses, and consumes no real API quota.

1. All three samples render labeled reports and generate printable PDFs.
2. Unsupported, empty and oversized file selection clears previous reports; valid images preview, remove and reselect correctly.
3. Unavailable AI returns a clear notice with no sample substitution.
4. Pending requests disable duplicate actions; validated mocked live results display provenance and clear on photo removal.
5. Drag/drop works; offline analysis fails explicitly, while already-loaded samples remain usable.
6. Copilot stays unavailable; checklist toggles; keyboard focus and Print button work.
7. Mobile/tablet/desktop widths 375/768/1440 have no horizontal overflow.
8. Automated accessibility and browser runtime-error checks pass.

Artifacts:
- `browser-results.json`: latest machine-readable test result.
- `screenshots/report-375.png`, `report-768.png`, `report-1440.png`: current layout evidence. No visual regression baseline existed, so screenshot-diff regression is not claimed.
- `pdfs/sample-roof.pdf`, `sample-flood.pdf`, `sample-lanai.pdf`: actual browser print outputs, not screenshot-only substitutes.
- Corresponding extracted text and raster previews support PDF inspection.

## Issues fixed during testing

1. Chunked upload overflow no longer destroys the request stream before a safe error response.
2. Response-body cancellations remain TIMEOUT, instead of becoming INVALID_RESPONSE.
3. Obvious PNG/JPEG/WebP truncation is rejected before provider work. These are container checks, not full pixel decoding.
4. Low-contrast supporting text was darkened after axe identified failures.
5. Sample-card selection no longer animates the background through a low-contrast intermediate state.
6. Print output stacks findings, permits pagination, uses high-contrast text and avoids boxing ordinary metadata labels.

The screenshot and regression-test evidence is generated from the fixed implementation. Earlier failures are documented below as history, not current failures.

## Provider decision

Recommended path: OpenRouter using pinned model `nvidia/nemotron-3.5-super-vl:free`. Public model metadata checked November 2, 2026 lists image input, response_format, structured_outputs, and zero prompt/completion price. The adapter requires schema-capable endpoints and preserves server-owned provenance. Model/provider availability and free-tier limits can change; metadata is not proof of successful live inference.

Gemini remains available with AI_PROVIDER=gemini. There is no automatic provider switch or hidden sample fallback.

Setup now in ignored .env.local:

```dotenv
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key-here
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
```

The owner needs to create/save an OpenRouter key. Restart the API afterward, then upload a real supported image in the UI and confirm a live report, latency and observation quality. The original Gemini credential is preserved privately and is not used while OpenRouter is selected.

## Remaining limits

- Real OpenRouter authentication, access/quota, observation quality and latency are not verified until a working key is supplied.
- Browser regressions run on Chrome only. No Safari/Firefox or full assistive-technology certification is claimed.
- Copilot and live emergency feeds remain explicitly unavailable by MVP scope.
- Production hosting and an installed offline service worker remain out of scope; samples work while the app is served.
- Source integration will be saved locally; nothing is pushed or deployed. Pre-existing pitch deck and Vite host configuration are preserved.

Sources: [OpenRouter catalog](https://openrouter.ai/api/v1/models), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [image input guide](https://github.com/OpenRouterTeam/docs/blob/main/guides/overview/multimodal/image-understanding.mdx), [Google subscription/API distinction](https://ai.google.dev/gemini-api/docs/google-ai-plans).

---

# Historical restricted-environment QA

The following report predates the permission change; its DNS/localhost/browser blockers have since been resolved and are superseded by the results above.

# StormGuard user QA report

**Target:** http://127.0.0.1:5173
**Date:** November 2, 2026
**Scope:** Image upload, sample selection, assessment provenance, service failures, report/print, responsive UI, keyboard use, runtime credential setup.

## Executive summary

Three reproducible backend/service issues were found and fixed. Production build passes. All 23 socket-free targeted checks and 4 actual React render checks pass. Full suite: 36 tests, 23 pass, 13 blocked by localhost bind denial (EPERM) before transport checks run.

**Verdict: conditional readiness; full live demo signoff remains blocked.** The earlier browser pass covered core interactions, but the current browser rerun is refused by approval controls. Real Gemini authentication/results and an actual saved PDF are unverified. No claim of perfection, complete accessibility, or production readiness is made.

## Fixed issues

### 1. Chunked oversized uploads could close before returning a readable error

- Severity: Medium; category: Functional.
- Location: server/multipart.js, POST /api/analyze.
- Reproduce: send a request without content-length and stream more than the body cap.
- Before: throwing out of the Readable async iterator destroyed the input stream and could close the socket before the safe 413 response.
- Expected: reject the request without retaining excess bytes, preserve the connection long enough to return the error, and drain remaining input.
- Fix: bounded event-based body reading, draining after rejection, cleanup on end/error/close/abort.
- Evidence: tests/backend/uploads.test.js regression confirms rejection without stream destruction, draining, and listener cleanup. Real transport test still needs a port-permitted terminal.
- Screenshot: not applicable to the stream-level failure.

### 2. Timeout during response-body reading was mislabeled

- Severity: Medium; category: UX/Functional.
- Location: src/services/aiService.js, upload analysis.
- Reproduce: fetch receives headers but JSON body reading aborts or times out.
- Before: user saw INVALID_RESPONSE instead of TIMEOUT.
- Expected: identify the timeout and leave no assessment.
- Fix: map AbortError/TimeoutError during response.json() to TIMEOUT.
- Evidence: tests/backend/services.test.js regression for body-read cancellation passes.
- Screenshot: current browser rerun blocked; regression covers the service outcome.

### 3. An image signature alone passed upload validation

- Severity: Medium; category: Functional.
- Location: server/multipart.js, POST /api/analyze.
- Reproduce: upload only the eight PNG signature bytes as image/png.
- Before: malformed image bytes could reach the provider, wasting a request or failing late.
- Expected: reject obvious truncation before provider calls.
- Fix: basic PNG chunk completeness, JPEG frame/scan/end checks, and WebP RIFF/chunk length checks. Added valid neutral QA fixtures; replaced fake header-only format fixtures.
- Evidence: tests/backend/uploads.test.js verifies PNG/JPEG/WebP acceptance and truncated-container rejection.
- Limitation: these are container checks, not full image decoding. Corrupt compressed pixels may still be rejected by the provider, with explicit errors.
- Screenshot: not applicable to binary validation.

## Further print hardening

Print styles now allow report overflow and stack findings vertically, reducing clipping risk in paginated output. Report markup retains mode/model, generation time, observations, next steps and limitations. Four React render checks pass. The Print button previously invoked window.print in the browser. Neither this nor CSS inspection proves actual saved-PDF pagination; manual PDF inspection remains required.

## Coverage

| Check | Result/evidence |
|---|---|
| All three explicit sample responses | Pass; fixtures and real React output |
| Sample/live separation | Pass; API/service validation and render checks |
| Unsupported/empty/oversized/truncated uploads | Pass; targeted checks |
| Valid PNG/JPEG/WebP containers | Pass; generated neutral fixtures |
| No-key/provider auth/network/invalid-output failures | Pass with mocked provider/in-memory real handler |
| Provider timeout and response-body timeout | Pass; regression tests |
| Real HTTP transport/disconnect | Blocked; all 13 HTTP tests fail at port binding before running |
| Dependency versions | npm ls --depth=0 matches all six pins |
| Production build | Pass, 26 modules |
| Browser bundle credential scan | Supplied key and server key variable absent |
| Secret file | Saved only in ignored .env.local, mode 0600; no credential in this report |
| Real Gemini request | Blocked by shell DNS access; key validity and quota unverified |
| Current browser/PDF rerun | Tool refuses approval under current policy |

## Earlier browser evidence from integration

The immediately preceding integration pass exercised actual DOM events on the running app: three sample reports, image picker and drag/drop, unsupported/empty/oversized validation, same-file reset, sample clearing uploaded evidence, remove clearing report, unavailable API notice with no report, mocked live provenance, checklist toggling, and unavailable copilot. Inspected 375/768/1440px layouts with no horizontal overflow and visible keyboard focus. Earlier screenshots were returned in the conversation, not saved as report artifacts. No new screenshots were captured in this restricted pass.

Those checks cover the earlier UI state; backend validation and print CSS changed afterward, so they do not constitute a complete current rerun. No full axe or screen-reader audit was performed.

## Remaining steps

1. In a normal terminal run `cd /Users/hz256598/Documents/code/hAIckaton && npm run dev:server` and leave it running. The supplied key and model are already configured in the ignored server env file; do not paste keys into the UI or chat again.
2. Keep the Vite UI running via npm run dev. Run a supported photo through live analysis. Verify authentication, model access/quota, response quality, provenance and latency. Health only proves configuration presence.
3. Run npm test from a terminal allowed to bind ports; resolve any actual transport failures.
4. Save a report as PDF and inspect every page for retained labels, limitations and clipping.
5. Review/commit the integration from a Git-writable terminal. Nothing was reset, cleaned, pushed or deployed by this QA pass.

Copilot and live emergency feeds remain intentionally unavailable. Production API hosting and a service worker are not implemented; samples work while the local app is served, not as a guaranteed offline-installed app.
