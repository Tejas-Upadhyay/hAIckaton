// Server-only Gemini configuration.
// GEMINI_MODEL is supplied at runtime; this module never assumes a development
// tool's model name is an API endpoint.

const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// Normalize the optional "models/" prefix used by the REST endpoint.
export function normalizeModelId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutPrefix = trimmed.startsWith('models/') ? trimmed.slice('models/'.length) : trimmed;
  return MODEL_ID_PATTERN.test(withoutPrefix) ? withoutPrefix : null;
}

export function readGeminiConfig(env = process.env) {
  const apiKey = typeof env.GEMINI_API_KEY === 'string' ? env.GEMINI_API_KEY.trim() : '';
  const safeApiKey = apiKey && !/[\r\n]/.test(apiKey) ? apiKey : '';
  const model = normalizeModelId(env.GEMINI_MODEL);
  return Object.freeze({
    apiKey: safeApiKey,
    model,
    configured: Boolean(safeApiKey && model),
  });
}

export function readAIConfig(env = process.env) {
  const provider = (env.AI_PROVIDER || 'gemini').trim().toLowerCase();
  if (provider === 'gemini') return { ...readGeminiConfig(env), provider };
  if (provider !== 'openrouter') return { provider, apiKey: '', model: null, configured: false };
  const apiKey = typeof env.OPENROUTER_API_KEY === 'string' ? env.OPENROUTER_API_KEY.trim() : '';
  const safeKey = apiKey && !/[\r\n]/.test(apiKey) ? apiKey : '';
  const model = typeof env.OPENROUTER_MODEL === 'string' ? env.OPENROUTER_MODEL.trim() : '';
  const safeModel = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(model) ? model : null;
  return { provider, apiKey: safeKey, model: safeModel, configured: Boolean(safeKey && safeModel) };
}
