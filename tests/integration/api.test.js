import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createApiServer } from '../../server/index.js';
import * as services from '../../src/services/aiService.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXQAAAAASUVORK5CYII=', 'base64');

// Real request routing with serialized multipart, without binding a local port.
async function dispatch(server, path, options = {}) {
  const serialized = new Request(`http://localhost${path}`, options);
  const bytes = Buffer.from(await serialized.arrayBuffer());
  const request = Readable.from(bytes.length ? [bytes] : []);
  Object.assign(request, { url: path, method: serialized.method, headers: Object.fromEntries(serialized.headers) });
  return new Promise((resolve, reject) => {
    const response = new EventEmitter();
    const headers = new Headers();
    response.setHeader = (key, value) => headers.set(key, value);
    response.end = (body) => {
      response.writableEnded = true;
      resolve(new Response(body, { status: response.statusCode, headers }));
    };
    request.on('error', reject);
    server.emit('request', request, response);
  });
}
function upload(file) { const body = new FormData(); body.append('image', file); return { method: 'POST', body }; }

test('all sample assets and assessments are available without a provider request', async (t) => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Samples must not fetch'); });
  for (const sample of await services.listSampleCases()) {
    const svg = await readFile(new URL(`../../public${sample.imageUrl}`, import.meta.url), 'utf8');
    assert.match(svg, /SYNTHETIC ILLUSTRATION/);
    const result = await services.analyzeDamage({ sampleId: sample.id });
    assert.equal(result.mode, 'sample');
    assert.equal(result.model, null);
  }
});

test('no-key valid upload goes through real handler and fails without sample substitution', async (t) => {
  const server = createApiServer({ env: {} });
  t.mock.method(globalThis, 'fetch', (path, options) => dispatch(server, path, options));
  await assert.rejects(services.analyzeDamage({ file: new File([png], 'photo.png', { type: 'image/png' }) }), { code: 'NOT_CONFIGURED' });
});

test('handler validates image bytes and keeps resources and chat unavailable', async () => {
  const server = createApiServer({ env: {} });
  for (const [file, status, code] of [
    [new File(['fake png'], 'fake.png', { type: 'image/png' }), 400, 'INVALID_IMAGE'],
    [new File([], 'empty.png', { type: 'image/png' }), 400, 'INVALID_IMAGE'],
    [new File([png], 'wrong.gif', { type: 'image/gif' }), 415, 'UNSUPPORTED_MEDIA_TYPE'],
    [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }), 413, 'IMAGE_TOO_LARGE'],
  ]) {
    const response = await dispatch(server, '/api/analyze', upload(file));
    assert.equal(response.status, status);
    assert.equal((await response.json()).error.code, code);
  }
  const resources = await (await dispatch(server, '/api/resources')).json();
  assert.equal(resources.status, 'unavailable');
  assert.deepEqual(resources.shelters, []);
  assert.deepEqual(resources.advisories, []);
  assert.equal((await dispatch(server, '/api/chat', { method: 'POST' })).status, 503);
});

test('browser service accepts validated live output through handler with mocked provider', async (t) => {
  const server = createApiServer({
    env: { GEMINI_API_KEY: 'mock-only', GEMINI_MODEL: 'test-vision' },
    fetchImpl: async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({
      summary: 'Mocked observation.', severity: 'unknown', observations: ['Insufficient detail.'],
      hazards: [], nextSteps: ['Seek qualified inspection.'], limitations: ['Mock provider.'],
    }) }] } }] }),
  });
  t.mock.method(globalThis, 'fetch', (path, options) => dispatch(server, path, options));
  const result = await services.analyzeDamage({ file: new File([png], 'photo.png', { type: 'image/png' }) });
  assert.equal(result.mode, 'live');
  assert.equal(result.sampleId, null);
  assert.equal(result.model, 'test-vision');
  assert.ok(result.limitations.length > 1);
});

test('provider authentication, network and malformed output failures stay explicit and safe', async () => {
  for (const [fetchImpl, status, code] of [
    [async () => new Response('private provider details', { status: 403 }), 503, 'NOT_CONFIGURED'],
    [async () => { throw new Error('private provider failure'); }, 503, 'UNAVAILABLE'],
    [async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"severity":"safe"}' }] } }] }), 502, 'INVALID_RESPONSE'],
  ]) {
    const server = createApiServer({ env: { GEMINI_API_KEY: 'mock-secret', GEMINI_MODEL: 'test-vision' }, fetchImpl });
    const response = await dispatch(server, '/api/analyze', upload(new File([png], 'photo.png', { type: 'image/png' })));
    assert.equal(response.status, status);
    const text = await response.text();
    assert.equal(JSON.parse(text).error.code, code);
    assert.doesNotMatch(text, /mock-secret|private provider/);
    assert.ok(!text.includes(png.toString('base64')));
  }
});

test('provider timeout is bounded and does not return sample content', async () => {
  const server = createApiServer({
    env: { GEMINI_API_KEY: 'mock-secret', GEMINI_MODEL: 'test-vision' },
    providerTimeoutMs: 10,
    fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(Response.json({})), 1000);
      signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
    }),
  });
  const response = await dispatch(server, '/api/analyze', upload(new File([png], 'photo.png', { type: 'image/png' })));
  assert.equal(response.status, 504);
  assert.equal((await response.json()).error.code, 'TIMEOUT');
});

test('non-JSON proxy failure is described as unavailable, not an assessment', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 502 }));
  await assert.rejects(services.analyzeDamage({ file: new File([png], 'photo.png', { type: 'image/png' }) }), { code: 'UNAVAILABLE' });
});
