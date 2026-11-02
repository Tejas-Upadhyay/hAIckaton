import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readAIConfig } from '../../server/config.js';
import { buildOpenRouterRequest, requestOpenRouterAssessment, OPENROUTER_ENDPOINT } from '../../server/openrouter.js';
import { createApiServer } from '../../server/index.js';

const content = { summary: 'Test observation only.', severity: 'unknown', observations: ['Unclear image.'], hazards: [], nextSteps: [], limitations: ['Test only.'] };
const env = { AI_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'mock-openrouter-key', OPENROUTER_MODEL: 'nvidia/nemotron-3.5-super-vl:free', GEMINI_API_KEY: 'never-forward-this' };
const payload = () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(content) } }] });

test('provider selection is explicit and credentials stay isolated', () => {
  assert.equal(readAIConfig(env).provider, 'openrouter');
  assert.equal(readAIConfig(env).apiKey, 'mock-openrouter-key');
  assert.equal(readAIConfig({ ...env, OPENROUTER_API_KEY: '' }).configured, false);
  assert.equal(readAIConfig({ ...env, AI_PROVIDER: 'unknown' }).configured, false);
  assert.equal(readAIConfig({ ...env, OPENROUTER_API_KEY: 'bad\r\nvalue' }).configured, false);
  assert.equal(readAIConfig({}).provider, 'nim');
});

test('OpenRouter requests pin a model and include image input and strict output schema', async () => {
  const bytes = await readFile(new URL('../fixtures/pixel.png', import.meta.url));
  const request = buildOpenRouterRequest({ bytes, mimeType: 'image/png', model: env.OPENROUTER_MODEL });
  assert.equal(request.model, env.OPENROUTER_MODEL);
  assert.equal(request.provider.require_parameters, true);
  assert.equal(request.response_format.json_schema.strict, true);
  assert.equal(request.response_format.json_schema.schema.additionalProperties, false);
  assert.match(request.messages[1].content[1].image_url.url, /^data:image\/png;base64,/);
  const result = await requestOpenRouterAssessment({ bytes, mimeType: 'image/png', config: readAIConfig(env), fetchImpl: async (url, init) => {
    assert.equal(url, OPENROUTER_ENDPOINT);
    assert.equal(init.headers.Authorization, 'Bearer mock-openrouter-key');
    assert.ok(!JSON.stringify(init).includes('never-forward-this'));
    return Response.json(payload());
  } });
  assert.deepEqual(result, content);
});

test('auth, credit, rate and invalid output failures never become sample responses', async () => {
  const args = { bytes: Buffer.alloc(1), mimeType: 'image/png', config: readAIConfig(env) };
  for (const status of [401, 402, 403, 404]) {
    await assert.rejects(requestOpenRouterAssessment({ ...args, fetchImpl: async () => new Response('private details', { status }) }), { code: 'NOT_CONFIGURED' });
  }
  await assert.rejects(requestOpenRouterAssessment({ ...args, fetchImpl: async () => new Response('rate limit', { status: 429 }) }), { code: 'UNAVAILABLE' });
  await assert.rejects(requestOpenRouterAssessment({ ...args, fetchImpl: async () => Response.json({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] }) }), { code: 'INVALID_RESPONSE' });
  await assert.rejects(requestOpenRouterAssessment({ ...args, fetchImpl: async () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: 'not json' } }] }) }), { code: 'INVALID_RESPONSE' });
});

test('real HTTP upload uses OpenRouter and trusted server provenance', async () => {
  const server = createApiServer({ env, fetchImpl: async () => Response.json(payload()) });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const bytes = await readFile(new URL('../fixtures/pixel.png', import.meta.url));
    const body = new FormData();
    body.append('image', new File([bytes], 'qa.png', { type: 'image/png' }));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/analyze`, { method: 'POST', body });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.mode, 'live');
    assert.equal(result.model, 'openrouter:' + env.OPENROUTER_MODEL);
    assert.equal(result.sampleId, null);
    assert.ok(result.limitations.length > 1);
    assert.ok(!JSON.stringify(result).includes('mock-openrouter-key'));
  } finally {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  }
});
