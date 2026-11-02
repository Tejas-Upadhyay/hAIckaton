import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApiServer } from '../../server/index.js';
import { readProviderChain } from '../../server/config.js';

const env = { AI_PROVIDER: 'nim', AI_FALLBACK_PROVIDER: 'openrouter', NIM_API_KEY: 'mock-nim', NIM_MODEL: 'nvidia/nemotron-3.5-super-vl-120b-a12b', OPENROUTER_API_KEY: 'mock-router', OPENROUTER_MODEL: 'nvidia/nemotron-3.5-super-vl:free' };
const good = () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ summary: 'Test only.', severity: 'unknown', observations: [], hazards: [], nextSteps: [], limitations: [] }) } }] });
async function run(fetchImpl, options = {}) {
  const server = createApiServer({ env, fetchImpl, ...options });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const form = new FormData();
    form.append('image', new File([await readFile(new URL('../fixtures/pixel.png', import.meta.url))], 'qa.png', { type: 'image/png' }));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/analyze`, { method: 'POST', body: form });
    return { status: response.status, body: await response.json() };
  } finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
}
test('NIM primary uses its own credentials, model and compatible request fields', async () => {
  const result = await run(async (url, init) => {
    assert.equal(url, 'https://integrate.api.nvidia.com/v1/chat/completions');
    assert.equal(init.headers.Authorization, 'Bearer mock-nim');
    const body = JSON.parse(init.body);
    assert.equal(body.model, env.NIM_MODEL);
    assert.equal(body.reasoning_effort, 'none');
    assert.equal(body.provider, undefined);
    assert.equal(body.response_format.type, 'json_schema');
    return good();
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.model, `nim:${env.NIM_MODEL}`);
});
test('auth, rate limit, network and pending NIM responses use live OpenRouter backup', async () => {
  for (const fail of [() => new Response('', { status: 401 }), () => new Response('', { status: 429 }), () => new Response('{}', { status: 202 }), () => { throw new Error('network'); }]) {
    const calls = [];
    const result = await run(async (url, init) => {
      calls.push(url);
      if (url.includes('nvidia.com')) return fail();
      assert.equal(init.headers.Authorization, 'Bearer mock-router');
      return good();
    });
    assert.equal(calls.length, 2);
    assert.equal(result.body.model, `openrouter:${env.OPENROUTER_MODEL}`);
    assert.ok(result.body.limitations.some(s => s.includes('Backup live provider')));
    assert.equal(result.body.mode, 'live');
  }
});
test('timed-out primary reserves time for backup', async () => {
  const result = await run(async (url, init) => {
    if (!url.includes('nvidia.com')) return good();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(good()), 200);
      init.signal.addEventListener('abort', () => { clearTimeout(timer); reject(init.signal.reason); }, { once: true });
    });
  }, { providerTimeoutMs: 100 });
  assert.equal(result.status, 200);
  assert.equal(result.body.model, `openrouter:${env.OPENROUTER_MODEL}`);
});
test('invalid/refused output stops instead of using backup to evade refusal', async () => {
  let calls = 0;
  const result = await run(async () => { calls++; return Response.json({ choices: [{ finish_reason: 'content_filter', message: { refusal: 'refused' } }] }); });
  assert.equal(calls, 1);
  assert.equal(result.status, 502);
  assert.equal(result.body.error.code, 'INVALID_RESPONSE');
});
test('missing primary can use configured backup; missing both stays unconfigured', async () => {
  assert.deepEqual(readProviderChain({}).map(c => c.provider), []);
  assert.deepEqual(readProviderChain({ ...env, NIM_API_KEY: '' }).map(c => c.provider), ['openrouter']);
  const result = await run(async () => { throw new Error('must not call'); }, { env: {} });
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, 'NOT_CONFIGURED');
});
test('both providers failing returns an error, never a sample', async () => {
  const result = await run(async () => new Response('', { status: 503 }));
  assert.equal(result.status, 503);
  assert.equal(result.body.mode, undefined);
});
