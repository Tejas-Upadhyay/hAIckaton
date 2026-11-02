import { invalidResponse, notConfigured, timeout, unavailable } from './errors.js';
import { PROVIDER_TIMEOUT_MS, SYSTEM_INSTRUCTION, USER_PROMPT, readResponseText } from './provider-common.js';

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const text = { type: 'string', minLength: 1, maxLength: 600 };
const list = { type: 'array', maxItems: 16, items: text };
export const OPENROUTER_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    summary: { type: 'string', minLength: 1, maxLength: 1200 },
    severity: { type: 'string', enum: ['minor', 'moderate', 'major', 'unknown'] },
    observations: list, hazards: list, nextSteps: list, limitations: list,
  },
  required: ['summary', 'severity', 'observations', 'hazards', 'nextSteps', 'limitations'],
};

export function buildOpenRouterRequest({ bytes, mimeType, model }) {
  return {
    model, stream: false, temperature: 0.2, max_tokens: 4096,
    provider: { require_parameters: true },
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: [
        { type: 'text', text: USER_PROMPT },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}` } },
      ] },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'damage_observations', strict: true, schema: OPENROUTER_SCHEMA } },
  };
}

export async function requestChatAssessment({ bytes, mimeType, config, fetchImpl = globalThis.fetch, signal: externalSignal, timeoutMs = PROVIDER_TIMEOUT_MS }) {
  if (!config?.configured) throw notConfigured();
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = externalSignal ? AbortSignal.any([deadline, externalSignal]) : deadline;
  try {
    const response = await fetchImpl(config.provider === 'nim' ? 'https://integrate.api.nvidia.com/v1/chat/completions' : OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify((() => { const body = buildOpenRouterRequest({ bytes, mimeType, model: config.model }); if (config.provider === 'nim') { delete body.provider; body.reasoning_effort = 'none'; } return body; })()), signal,
    });
    if (response.status === 202) {
      await response.body?.cancel?.().catch(() => {});
      throw unavailable();
    }
    if (!response.ok) {
      await response.body?.cancel?.().catch(() => {});
      if ([400, 401, 402, 403, 404, 422].includes(response.status)) throw notConfigured('Check the server AI provider, model access, credentials, and available credits. You can choose a labeled sample instead.');
      throw unavailable();
    }
    const raw = await readResponseText(response);
    let payload;
    try { payload = JSON.parse(raw); } catch { throw invalidResponse(); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw invalidResponse();
    if (payload.error) throw unavailable();
    const choice = payload.choices?.[0];
    if (choice?.finish_reason !== 'stop' || choice.message?.refusal || typeof choice.message?.content !== 'string') throw invalidResponse();
    try { return JSON.parse(choice.message.content); } catch { throw invalidResponse(); }
  } catch (error) {
    if (error?.name === 'ApiError') throw error;
    if (externalSignal?.aborted) throw unavailable('The request was cancelled.');
    if (deadline.aborted) throw timeout();
    throw unavailable();
  }
}

export const requestOpenRouterAssessment = requestChatAssessment;
