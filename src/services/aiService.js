import { IMAGE_TYPES, MAX_IMAGE_BYTES, isAssessment } from '../contracts/assessment.js';
import { sampleDamageCases } from '../data/sampleDamageCases.js';
import { emergencyResources } from '../data/swflEmergencyData.js';

export class ServiceError extends Error {
  constructor(code, message) { super(message); this.name = 'ServiceError'; this.code = code; }
}

export async function listSampleCases() {
  return sampleDamageCases.map(({ id, title, description }) => ({ id, title, description }));
}

export async function analyzeDamage({ file = null, sampleId = null } = {}) {
  if (file && sampleId) throw new ServiceError('INVALID_REQUEST', 'Choose either an uploaded photo or a sample.');
  if (sampleId) {
    const sample = sampleDamageCases.find((item) => item.id === sampleId);
    if (!sample) throw new ServiceError('INVALID_REQUEST', 'Unknown sample.');
    return {
      id: `sample-${sample.id}`, mode: 'sample', sampleId: sample.id,
      createdAt: new Date().toISOString(), model: null,
      summary: sample.summary, severity: sample.severity,
      observations: [...sample.observations], hazards: [...sample.hazards], nextSteps: [...sample.nextSteps],
      limitations: ['Pre-written illustrative sample, not live AI analysis.', 'Not an official FEMA classification, repair quote, or insurance determination.'],
    };
  }
  if (!file || !IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_IMAGE_BYTES) {
    throw new ServiceError('INVALID_IMAGE', 'Choose a JPEG, PNG, or WebP image up to 5 MiB.');
  }
  const form = new FormData();
  form.append('image', file);
  let response;
  try {
    response = await fetch('/api/analyze', { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
  } catch {
    throw new ServiceError('UNAVAILABLE', 'Live analysis is unavailable. You can choose a labeled sample instead.');
  }
  let body;
  try { body = await response.json(); } catch { throw new ServiceError('INVALID_RESPONSE', 'The analysis service returned an invalid response.'); }
  if (!response.ok) throw new ServiceError(body?.error?.code || 'UNAVAILABLE', body?.error?.message || 'Analysis could not be completed.');
  if (!isAssessment(body) || body.mode !== 'live') throw new ServiceError('INVALID_RESPONSE', 'The analysis service returned an invalid assessment.');
  return body;
}

export async function getEmergencyResources() { return structuredClone(emergencyResources); }

export async function askCopilot() {
  throw new ServiceError('NOT_CONFIGURED', 'The copilot is not connected yet.');
}
