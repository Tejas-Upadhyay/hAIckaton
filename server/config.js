// Explicit server-only provider ordering. No Gemini credentials are read.
export function readAIConfig(env = process.env, selected = env.AI_PROVIDER || 'nim') {
  const provider = selected.trim().toLowerCase();
  if (!['nim', 'openrouter'].includes(provider)) return { provider, apiKey: '', model: null, configured: false };
  const prefix = provider === 'nim' ? 'NIM' : 'OPENROUTER';
  const apiKey = typeof env[`${prefix}_API_KEY`] === 'string' ? env[`${prefix}_API_KEY`].trim() : '';
  const model = typeof env[`${prefix}_MODEL`] === 'string' ? env[`${prefix}_MODEL`].trim() : '';
  const safeKey = apiKey && !/[\r\n]/.test(apiKey) ? apiKey : '';
  const safeModel = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(model) ? model : null;
  return { provider, apiKey: safeKey, model: safeModel, configured: Boolean(safeKey && safeModel) };
}
export function readProviderChain(env = process.env) {
  const names = [env.AI_PROVIDER || 'nim', env.AI_FALLBACK_PROVIDER || ''];
  return [...new Set(names.map(name => name.trim().toLowerCase()).filter(Boolean))].map(name => readAIConfig(env, name)).filter(config => config.configured);
}
