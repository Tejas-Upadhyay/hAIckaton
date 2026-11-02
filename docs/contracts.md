# Shared contracts — version 1

These contracts supersede the browser key, guessed evacuation zones, assumed live capacity, and automatic sample-substitution proposals in `plan.md`. Codex owns this document and `src/contracts/assessment.js`. Workers preserve interfaces and propose changes through their reports.

## Frontend integration

`src/App.jsx` renders the default export from `src/components/StormGuardApp.jsx` with one prop, `services`. Antigravity owns that component and may split it into smaller components without editing App.jsx. Use the supplied services prop; do not import server modules or implement provider calls in UI components.

All service functions return Promises:

```js
listSampleCases() // -> Array<{ id, title, description, imageUrl?: string }>
analyzeDamage({ file: File | null, sampleId: string | null }) // -> Assessment
getEmergencyResources() // -> EmergencyResources
askCopilot({ message: string, county: string | null }) // -> CopilotReply
```

Exactly one of file/sampleId is required. `file` accepts JPEG, PNG, WebP, nonempty, at most 5 MiB (5,242,880 bytes). The UI should validate early; the server independently validates size, MIME, and actual image content. Clear old results on a new upload or request. For sample selection, clear any uploaded-image preview so it cannot be mistaken for the sample's evidence.

`ServiceError` has `name: 'ServiceError'`, a `code` string, and a user-safe `message`. The UI catches errors and offers explicit sample buttons. It never silently changes analysis mode.

## Assessment response

The executable JSON Schema is `assessmentSchema` in `src/contracts/assessment.js`; `isAssessment` also enforces provenance cross-field rules. Exact top-level fields:

```json
{
  "id": "assessment-unique-id",
  "mode": "sample",
  "sampleId": "cape-coral-roof",
  "createdAt": "2026-11-02T14:00:00.000Z",
  "model": null,
  "summary": "Clearly labeled illustrative sample summary.",
  "severity": "moderate",
  "observations": ["Visible or illustrative observations only."],
  "hazards": ["Potential concerns, with uncertainty."],
  "nextSteps": ["Documentation or professional follow-up."],
  "limitations": ["Not an official assessment or insurance determination."]
}
```

- Severity: `minor | moderate | major | unknown`, an informal preliminary label.
- Sample: `mode=sample`, nonempty sampleId, `model=null`. Pre-written content, not a provider inference. No fake AI latency or scanning claim.
- Live: `mode=live`, `sampleId=null`, nonempty actual server-configured model ID.
- Server sets id, mode, sampleId, createdAt, and model; provider text cannot override trusted provenance. Validate model output before returning it.
- Arrays contain strings; limitations must have at least one item. Do not use model-generated HTML. Render strings as text.
- No repair-cost/FEMA-determination fields in v1. Print a documentation draft with provenance and limitations, not an official claim form.

## API

Development: Vite proxies `/api` to `http://127.0.0.1:8787`. Both processes must run for live requests. No permissive CORS needed. Production same-origin API routing is not configured by this scaffold.

| Endpoint | Request | Success |
|---|---|---|
| `GET /api/health` | none | `{status: 'stub' | 'ready', liveAnalysis: boolean}` |
| `POST /api/analyze` | multipart/form-data; one `image` file | HTTP 200, live Assessment |
| `GET /api/resources` | none | HTTP 200, EmergencyResources |
| `POST /api/chat` | JSON `{message, county}`; message max 2000 chars; county null or Lee/Collier/Charlotte | HTTP 200, CopilotReply |

For multipart, browser fetch sets Content-Type and boundary automatically. Server enforces an overall multipart payload cap of 6 MiB and a file cap of 5 MiB. Do not retain uploads or log image bodies. Bound provider requests to 25 seconds; browser timeout is 30 seconds. Client disconnect cancels provider work where practical.

Errors: `{ "error": { "code": "NOT_CONFIGURED", "message": "Safe user-facing description." } }`.
Status/code mapping: 400 `INVALID_REQUEST` or `INVALID_IMAGE`; 413 `IMAGE_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE`; 503 `NOT_CONFIGURED` or `UNAVAILABLE`; 502 `INVALID_RESPONSE`; 504 `TIMEOUT`; 405 `METHOD_NOT_ALLOWED`; 404 `NOT_FOUND`. Never include credentials, stack traces, raw provider payloads, or arbitrary HTML.

POST analyze implements server-side OpenRouter and Gemini integrations selected by `AI_PROVIDER`; it returns 503 when credentials or model configuration are missing. POST chat remains intentionally unavailable. For OpenRouter configure server-only `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`; for Gemini use `GEMINI_API_KEY` and `GEMINI_MODEL`. Selection defaults to Gemini if AI_PROVIDER is omitted for compatibility; the example env explicitly selects OpenRouter. Provider choice never changes the v1 Assessment shape and never silently falls back to another model, provider, or sample. The browser must not send an API key or a model selector.

## Emergency resources

```js
{
  status: 'unavailable', // 'unavailable' | 'verified' | 'demo'
  updatedAt: null, // ISO timestamp or null
  sourceUrl: null, // verified HTTPS source or null
  message: 'Live information is not connected.',
  shelters: [],
  advisories: []
}
```

V1 uses empty lists and unavailable status. Adding verified entries requires an agreed item schema, source, timestamp, and freshness policy. No city-based zone lookup, fabricated capacities, evacuation orders, or live alert ticker. UI may point users to sourced official resources after verification.

## Copilot (secondary)

`CopilotReply = { mode: 'live', message: string, sources: Array<{ title: string, url: string }>, limitations: string[] }`. It is acceptable to keep copilot unavailable for the MVP. Do not invent emergency citations or current regulations. A prepared static checklist must be labeled as general guidance, not live copilot output.

## Report and frontend acceptance

Upload preview, pending/error/empty states, disabled duplicate submissions, clear sample/live badge, keyboard-accessible controls, and printable results are required. Print retains provenance, generated timestamp, observations, and limitations. `window.print()` / browser Save as PDF is sufficient; no export dependency needed.
