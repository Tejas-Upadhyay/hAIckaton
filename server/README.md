# StormGuard API server

## Recommended OpenRouter setup

Select `AI_PROVIDER=openrouter`, set server-only `OPENROUTER_API_KEY`, and pin `OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free`. Metadata checked November 2, 2026 lists image input, response_format and structured_outputs, with zero prompt/completion price. Free capacity is rate-limited; real-key success is still required. The adapter posts image data URLs and a strict JSON schema to `https://openrouter.ai/api/v1/chat/completions`, with `require_parameters: true`. It uses the same validation, timeouts, safe errors and server-owned provenance as Gemini. No automatic provider/model switching occurs.

References: [model catalog](https://openrouter.ai/api/v1/models), [structured output](https://openrouter.ai/docs/guides/features/structured-outputs), [image inputs](https://github.com/OpenRouterTeam/docs/blob/main/guides/overview/multimodal/image-understanding.mdx).

The Gemini instructions below remain available by setting `AI_PROVIDER=gemini`.

Native Node HTTP server. No provider SDK or multipart dependency is required; Node 22.12+ provides `fetch`, `Request`/`Response`, `FormData`, `File`, and `AbortSignal`.

## Server-only configuration

Copy `.env.example` to `.env.local` and set:

```sh
GEMINI_API_KEY=your-server-only-key
GEMINI_MODEL=gemini-3.8-flash
PORT=8787
```

`GEMINI_API_KEY` and `GEMINI_MODEL` are read only from the server process. Never expose either through a `VITE_` variable, browser storage, logs, or an API response. `GEMINI_MODEL` is required; the server does not substitute a development-tool model name.

## Verified Gemini integration (checked 2026-11-02)

- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Authentication: `x-goog-api-key` request header
- Image input: `contents[].parts[].inlineData` with `mimeType` and base64 `data`
- Structured output: `generationConfig.responseMimeType: "application/json"` and `generationConfig.responseSchema`
- Timeout: 25 seconds for the provider request and response body; the browser service uses 30 seconds
- Privacy: the request sets `store: false` where the provider supports that flag. The server keeps image bytes in memory only and never logs or persists them.

The stable `gemini-3.8-flash` endpoint is documented as accepting text, image, video, audio, and PDF input and producing text output, with structured outputs supported:

- <https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash>
- <https://ai.google.dev/api/generate-content>
- <https://ai.google.dev/gemini-api/docs/structured-output>

The owner may configure another verified vision-capable model ID. The server validates the ID shape, normalizes an optional `models/` prefix, and records the actual normalized ID in each live assessment.

## Routes

| Route | Behavior |
|---|---|
| `GET /api/health` | `{ status: 'stub' \| 'ready', liveAnalysis: boolean }` |
| `POST /api/analyze` | `multipart/form-data` with exactly one `image` file; returns a live Assessment |
| `GET /api/resources` | Explicitly unavailable emergency data |
| `POST /api/chat` | 503 `NOT_CONFIGURED` (copilot is secondary) |

## Upload validation

- One `image` part, nonempty, JPEG/PNG/WebP only
- Declared MIME and file signature must agree; basic PNG/JPEG/WebP container checks reject obvious truncation before provider calls (not a full image decode)
- File cap: 5 MiB (5,242,880 bytes)
- Overall multipart cap: 6 MiB
- Safe errors: 400 `INVALID_REQUEST`/`INVALID_IMAGE`; 413 `IMAGE_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE`; 503 `NOT_CONFIGURED`/`UNAVAILABLE`; 502 `INVALID_RESPONSE`; 504 `TIMEOUT`; 405/404 as appropriate

Provider content is validated against the shared severity and array/string rules. The server adds trusted `id`, `mode`, `sampleId`, `createdAt`, `model`, and safety limitations after validation. A provider or network failure never becomes a sample assessment.

## Local run

```sh
npm run dev:server
curl http://127.0.0.1:8787/api/health
```

The Vite dev server proxies `/api` to port 8787. Production same-origin API hosting remains a deployment task.

## Sample assets

`public/samples/*.svg` are original synthetic illustrations, visibly labeled `SYNTHETIC ILLUSTRATION`. They are not photographs of real properties. `listSampleCases()` returns an additive `imageUrl` field so the UI can display them; the Assessment itself keeps the v1 field set unchanged.
