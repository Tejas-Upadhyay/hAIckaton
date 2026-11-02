# StormGuard AI server

## Primary and backup

`AI_PROVIDER=nim` selects NVIDIA NIM; `AI_FALLBACK_PROVIDER=openrouter` enables a backup. Each provider has its own server-only key/model. Copy `.env.example` to `.env.local` and populate both keys.

- NIM endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
- NIM model: `nvidia/nemotron-3.5-super-vl-120b-a12b`
- OpenRouter endpoint: `https://openrouter.ai/api/v1/chat/completions`
- OpenRouter model: `nvidia/nemotron-3.5-super-vl:free`

Both accept image input and JSON-schema output. NIM uses reasoning_effort=none; OpenRouter requires schema-capable endpoints. No Gemini integration or key is used.

## Failover behavior

Only configured providers are attempted, in the explicit order above. Authentication/configuration, credit/rate, pending, network and timeout failures can use the backup. Invalid or refused output stops; it is not retried to evade a refusal. Invalid uploads never reach either provider. Samples always require explicit user selection.

The entire provider chain shares a 25-second budget. With two configured providers, the primary gets at most 12 seconds and half the remaining budget; the backup uses the remainder. Client disconnect aborts the active call and prevents another attempt. Reports identify the successful provider and model in the model field, and include a trusted backup-use note when applicable. If both fail, return an explicit safe error and no assessment.

## Operation

`npm run dev:server` serves localhost:8787. Vite proxies /api to it. Restart after changing .env.local. Health indicates at least one provider has configuration, not that credentials/quota are valid.

Uploads: one nonempty JPEG/PNG/WebP image, 5 MiB file and 6 MiB body cap, matching MIME/signature and basic container checks. This is not full pixel decoding. Images stay in memory; credentials and image bodies are not logged. Structured output is validated before the server adds provenance and limitations.

Copilot and live emergency feeds remain unavailable. Production hosting is a separate task.

[NVIDIA endpoint/model/schema documentation](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b-infer) · [OpenRouter structured output](https://openrouter.ai/docs/guides/features/structured-outputs)
