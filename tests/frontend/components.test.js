import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_IMAGE_BYTES, IMAGE_TYPES, SEVERITIES, isAssessment } from '../../src/contracts/assessment.js';
import { sampleDamageCases } from '../../src/data/sampleDamageCases.js';
import { emergencyResources } from '../../src/data/swflEmergencyData.js';

test('frontend contracts: image constraints match specification', () => {
  assert.equal(MAX_IMAGE_BYTES, 5242880, 'Max image size must be exactly 5 MiB');
  assert.deepEqual(IMAGE_TYPES, ['image/jpeg', 'image/png', 'image/webp']);
  assert.deepEqual(SEVERITIES, ['minor', 'moderate', 'major', 'unknown']);
});

test('frontend sample cases: all samples provide valid assessment structures', () => {
  assert.ok(sampleDamageCases.length >= 3, 'Must have at least 3 sample cases for judging');

  for (const sample of sampleDamageCases) {
    assert.ok(sample.id, 'Sample must have an id');
    assert.ok(sample.title, 'Sample must have a title');
    assert.ok(sample.summary, 'Sample must have a summary');
    assert.ok(SEVERITIES.includes(sample.severity), `Severity ${sample.severity} must be valid`);
    assert.ok(Array.isArray(sample.observations) && sample.observations.length > 0);
    assert.ok(Array.isArray(sample.hazards) && sample.hazards.length > 0);
    assert.ok(Array.isArray(sample.nextSteps) && sample.nextSteps.length > 0);

    // Simulate the assessment returned when this sample is chosen
    const mockSampleAssessment = {
      id: `sample-${sample.id}`,
      mode: 'sample',
      sampleId: sample.id,
      createdAt: new Date().toISOString(),
      model: null,
      summary: sample.summary,
      severity: sample.severity,
      observations: [...sample.observations],
      hazards: [...sample.hazards],
      nextSteps: [...sample.nextSteps],
      limitations: ['Pre-written illustrative sample, not live AI analysis.', 'Not an official FEMA classification.'],
    };

    assert.ok(isAssessment(mockSampleAssessment), `Sample ${sample.id} must satisfy isAssessment contract`);
    assert.equal(mockSampleAssessment.mode, 'sample');
    assert.equal(mockSampleAssessment.model, null);
    assert.equal(mockSampleAssessment.sampleId, sample.id);
  }
});

test('frontend safety: emergency resources contract retains unavailable status', () => {
  assert.equal(emergencyResources.status, 'unavailable');
  assert.equal(emergencyResources.updatedAt, null);
  assert.equal(emergencyResources.sourceUrl, null);
  assert.deepEqual(emergencyResources.shelters, []);
  assert.deepEqual(emergencyResources.advisories, []);
  assert.ok(emergencyResources.message.includes('not connected'));
});

test('frontend client validation logic rejects invalid or oversized files', () => {
  function validateFile(file) {
    if (!file) return 'NO_FILE';
    if (!IMAGE_TYPES.includes(file.type)) return 'INVALID_TYPE';
    if (file.size > MAX_IMAGE_BYTES) return 'TOO_LARGE';
    if (file.size === 0) return 'EMPTY_FILE';
    return 'VALID';
  }

  assert.equal(validateFile(null), 'NO_FILE');
  assert.equal(validateFile({ type: 'text/plain', size: 100 }), 'INVALID_TYPE');
  assert.equal(validateFile({ type: 'application/pdf', size: 500 }), 'INVALID_TYPE');
  assert.equal(validateFile({ type: 'image/gif', size: 500 }), 'INVALID_TYPE');
  assert.equal(validateFile({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 }), 'TOO_LARGE');
  assert.equal(validateFile({ type: 'image/png', size: 0 }), 'EMPTY_FILE');
  assert.equal(validateFile({ type: 'image/jpeg', size: 1024 * 1024 }), 'VALID');
  assert.equal(validateFile({ type: 'image/png', size: 4 * 1024 * 1024 }), 'VALID');
  assert.equal(validateFile({ type: 'image/webp', size: 500 * 1024 }), 'VALID');
});
