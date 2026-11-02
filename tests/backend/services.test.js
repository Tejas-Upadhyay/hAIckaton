import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDamage, listSampleCases, getEmergencyResources } from '../../src/services/aiService.js';
import { isAssessment, MAX_IMAGE_BYTES } from '../../src/contracts/assessment.js';

test('every explicit sample returns a valid, visibly non-live assessment', async () => {
  const samples = await listSampleCases();
  assert.equal(samples.length, 3);
  for (const sample of samples) {
    const result = await analyzeDamage({ sampleId: sample.id });
    assert.ok(isAssessment(result));
    assert.equal(result.mode, 'sample');
    assert.equal(result.model, null);
    assert.equal(result.sampleId, sample.id);
  }
});

test('sample response cannot mutate future fixture results', async () => {
  const result = await analyzeDamage({ sampleId: 'cape-coral-roof' });
  result.observations.push('untrusted modification');
  const fresh = await analyzeDamage({ sampleId: 'cape-coral-roof' });
  assert.ok(!fresh.observations.includes('untrusted modification'));
});

test('unknown, missing, ambiguous, and invalid image inputs are rejected', async () => {
  const invalid = [undefined, { sampleId: 'unknown' }, { file: { type: 'image/jpeg', size: 1 }, sampleId: 'cape-coral-roof' }, { file: { type: 'text/html', size: 5 } }, { file: { type: 'image/png', size: 0 } }, { file: { type: 'image/png', size: MAX_IMAGE_BYTES + 1 } }];
  for (const input of invalid) await assert.rejects(analyzeDamage(input), { name: 'ServiceError' });
});

test('uploaded photos never silently receive fixtures on provider/network failure', async (t) => {
  const file = new File(['not-real-image-test-body'], 'test.png', { type: 'image/png' });
  const stub = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { code: 'NOT_CONFIGURED', message: 'Not connected.' } }), { status: 503 }));
  await assert.rejects(analyzeDamage({ file }), { code: 'NOT_CONFIGURED' });
  stub.mock.mockImplementation(async () => { throw new Error('network unavailable'); });
  await assert.rejects(analyzeDamage({ file }), { code: 'UNAVAILABLE' });
});

test('live response validation rejects malformed JSON, sample substitution, and incorrect provenance', async (t) => {
  const file = new File(['test'], 'test.png', { type: 'image/png' });
  const sample = await analyzeDamage({ sampleId: 'cape-coral-roof' });
  const stub = t.mock.method(globalThis, 'fetch', async () => new Response('not json', { status: 200 }));
  await assert.rejects(analyzeDamage({ file }), { code: 'INVALID_RESPONSE' });
  stub.mock.mockImplementation(async () => Response.json(sample));
  await assert.rejects(analyzeDamage({ file }), { code: 'INVALID_RESPONSE' });
  assert.equal(isAssessment({ ...sample, mode: 'live' }), false);
  assert.equal(isAssessment({ ...sample, severity: 'safe' }), false);
  assert.equal(isAssessment({ ...sample, limitations: [] }), false);
  assert.equal(isAssessment({ ...sample, createdAt: 'yesterday' }), false);
  assert.equal(isAssessment({ ...sample, extra: 'unexpected' }), false);
  const live = { ...sample, mode: 'live', sampleId: null, model: 'configured-test-model' };
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
});
