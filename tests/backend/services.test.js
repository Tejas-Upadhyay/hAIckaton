import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeDamage, listSampleCases, getEmergencyResources } from '../../src/services/aiService.js';
import { isAssessment, MAX_IMAGE_BYTES } from '../../src/contracts/assessment.js';

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXQAAAAASUVORK5CYII=',
  'base64',
);

function uploadFile() {
  return new File([PNG_BYTES], 'test.png', { type: 'image/png' });
}

async function liveAssessmentFixture() {
  const sample = await analyzeDamage({ sampleId: 'cape-coral-roof' });
  return { ...sample, mode: 'live', sampleId: null, model: 'configured-test-model' };
}

test('every explicit sample returns a valid, visibly non-live assessment', async () => {
  const samples = await listSampleCases();
  assert.equal(samples.length, 3);
  assert.deepEqual(samples.map((sample) => sample.id), ['cape-coral-roof', 'fort-myers-flood', 'sanibel-lanai']);
  for (const sample of samples) {
    assert.deepEqual(Object.keys(sample).sort(), ['description', 'id', 'imageUrl', 'title']);
    assert.match(sample.imageUrl, /^\/samples\/[a-z0-9-]+\.svg$/);
    const asset = await readFile(new URL(`../../public${sample.imageUrl}`, import.meta.url), 'utf8');
    assert.match(asset, /SYNTHETIC ILLUSTRATION/);
    const result = await analyzeDamage({ sampleId: sample.id });
    assert.ok(isAssessment(result));
    assert.equal(result.mode, 'sample');
    assert.equal(result.model, null);
    assert.equal(result.sampleId, sample.id);
    assert.ok(result.limitations.some((item) => /Pre-written illustrative sample/.test(item)));
    assert.ok(Number.isFinite(Date.parse(result.createdAt)));
  }
});

test('sample response cannot mutate future fixture results', async () => {
  const result = await analyzeDamage({ sampleId: 'cape-coral-roof' });
  result.observations.push('untrusted modification');
  result.limitations.length = 0;
  const fresh = await analyzeDamage({ sampleId: 'cape-coral-roof' });
  assert.ok(!fresh.observations.includes('untrusted modification'));
  assert.ok(fresh.limitations.length > 0);
});

test('unknown, missing, ambiguous, and invalid image inputs are rejected', async () => {
  const invalid = [
    undefined,
    {},
    { sampleId: '' },
    { sampleId: 'unknown' },
    { file: uploadFile(), sampleId: 'cape-coral-roof' },
    { file: { type: 'image/png', size: 10 } },
    { file: new File([], 'empty.png', { type: 'image/png' }) },
  ];
  for (const input of invalid) {
    await assert.rejects(analyzeDamage(input), { name: 'ServiceError' });
  }
  await assert.rejects(
    analyzeDamage({ file: new File([Buffer.alloc(MAX_IMAGE_BYTES + 1)], 'large.png', { type: 'image/png' }) }),
    { code: 'INVALID_IMAGE' },
  );
  await assert.rejects(
    analyzeDamage({ file: new File(['x'], 'x.gif', { type: 'image/gif' }) }),
    { code: 'UNSUPPORTED_MEDIA_TYPE' },
  );
});

test('uploaded photos never silently receive fixtures on provider/network failure', async (t) => {
  const file = uploadFile();
  const stub = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: { code: 'NOT_CONFIGURED', message: 'Not connected.' } }, { status: 503 }),
  );
  await assert.rejects(analyzeDamage({ file }), { code: 'NOT_CONFIGURED' });
  stub.mock.mockImplementation(async () => {
    throw new Error('network unavailable');
  });
  await assert.rejects(analyzeDamage({ file }), { code: 'UNAVAILABLE' });
});

test('timeouts and malformed responses fail clearly instead of falling back to samples', async (t) => {
  const file = uploadFile();
  const stub = t.mock.method(globalThis, 'fetch', async () => {
    const error = new Error('timed out');
    error.name = 'TimeoutError';
    throw error;
  });
  await assert.rejects(analyzeDamage({ file }), { code: 'TIMEOUT' });

  stub.mock.mockImplementation(async () => new Response('not json', { status: 200 }));
  await assert.rejects(analyzeDamage({ file }), { code: 'INVALID_RESPONSE' });

  stub.mock.mockImplementation(async () =>
    Response.json({ error: { code: 'INVALID_IMAGE', message: '<script>unsafe</script>' } }, { status: 400 }),
  );
  await assert.rejects(analyzeDamage({ file }), (error) => {
    assert.equal(error.name, 'ServiceError');
    assert.equal(error.code, 'INVALID_IMAGE');
    assert.ok(!error.message.includes('<script>'));
    return true;
  });
});

test('live response validation rejects malformed JSON, sample substitution, and incorrect provenance', async (t) => {
  const file = uploadFile();
  const sample = await analyzeDamage({ sampleId: 'cape-coral-roof' });
  const stub = t.mock.method(globalThis, 'fetch', async () => new Response('not json', { status: 200 }));
  await assert.rejects(analyzeDamage({ file }), { code: 'INVALID_RESPONSE' });

  stub.mock.mockImplementation(async () => Response.json(sample));
  await assert.rejects(analyzeDamage({ file }), { code: 'INVALID_RESPONSE' });

  const live = await liveAssessmentFixture();
  assert.ok(isAssessment(live));
  assert.equal(isAssessment({ ...live, mode: 'sample' }), false);
  assert.equal(isAssessment({ ...live, sampleId: 'cape-coral-roof' }), false);
  assert.equal(isAssessment({ ...live, severity: 'safe' }), false);
  assert.equal(isAssessment({ ...live, limitations: [] }), false);
  assert.equal(isAssessment({ ...live, createdAt: 'yesterday' }), false);
  assert.equal(isAssessment({ ...live, extra: 'unexpected' }), false);

  stub.mock.mockImplementation(async () => Response.json(live));
  assert.deepEqual(await analyzeDamage({ file }), live);
});

test('emergency data stays explicitly unavailable and has no fabricated entries', async () => {
  const result = await getEmergencyResources();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.updatedAt, null);
  assert.equal(result.sourceUrl, null);
  assert.deepEqual(result.shelters, []);
  assert.deepEqual(result.advisories, []);
  assert.match(result.message, /not connected/i);
});

test('a timeout while reading the response body remains a timeout', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => { throw new DOMException('Aborted during body read', 'AbortError'); },
  }));
  await assert.rejects(analyzeDamage({ file: uploadFile() }), { code: 'TIMEOUT' });
});
