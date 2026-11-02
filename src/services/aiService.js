import { IMAGE_TYPES, MAX_IMAGE_BYTES, isAssessment } from '../contracts/assessment.js';
import { sampleDamageCases } from '../data/sampleDamageCases.js';
import { emergencyResources } from '../data/swflEmergencyData.js';

const BROWSER_TIMEOUT_MS = 30_000;

const SAMPLE_LIMITATIONS = [
  'Pre-written illustrative sample, not live AI analysis of an uploaded image.',
  'Not an official FEMA classification, coverage or eligibility determination, or repair quote.',
  'Provisional documentation only; consult qualified professionals before decisions.',
];

const SAFE_ERROR_MESSAGES = Object.freeze({
  INVALID_REQUEST: 'Choose one uploaded photo or one labeled sample.',
  INVALID_IMAGE: 'Choose a JPEG, PNG, or WebP image up to 5 MiB.',
  IMAGE_TOO_LARGE: 'The image is too large. Choose a JPEG, PNG, or WebP up to 5 MiB.',
  UNSUPPORTED_MEDIA_TYPE: 'Only JPEG, PNG, and WebP images are supported.',
  NOT_CONFIGURED: 'Live analysis is not configured. Choose a labeled sample instead.',
  UNAVAILABLE: 'Live analysis is unavailable. Choose a labeled sample instead.',
  INVALID_RESPONSE: 'The analysis service returned an invalid assessment. Choose a labeled sample or try again.',
  TIMEOUT: 'Live analysis timed out. Choose a labeled sample or try again.',
});

export class ServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

function normalizeType(value) {
  const type = typeof value === 'string' ? value.split(';')[0].trim().toLowerCase() : '';
  return type === 'image/jpg' ? 'image/jpeg' : type;
}

function isFileLike(value) {
  return Boolean(value) &&
    typeof value === 'object' &&
    typeof value.size === 'number' &&
    typeof value.type === 'string' &&
    typeof value.arrayBuffer === 'function';
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sampleAssessment(sample) {
  const assessment = {
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
    limitations: dedupe([...(sample.limitations || []), ...SAMPLE_LIMITATIONS]),
  };
  if (!isAssessment(assessment)) {
    throw new ServiceError('INVALID_RESPONSE', 'The sample could not be loaded.');
  }
  return assessment;
}

function safeServiceError(code, fallback = 'UNAVAILABLE') {
  const safeCode = typeof code === 'string' && Object.hasOwn(SAFE_ERROR_MESSAGES, code) ? code : fallback;
  return new ServiceError(safeCode, SAFE_ERROR_MESSAGES[safeCode]);
}

export async function listSampleCases() {
  // imageUrl is an additive, non-breaking extension for local synthetic illustrations.
  return sampleDamageCases.map(({ id, title, description, imageUrl }) => ({ id, title, description, imageUrl }));
}

export async function analyzeDamage({ file = null, sampleId = null } = {}) {
  const hasSample = sampleId !== null && sampleId !== undefined;
  if (file && hasSample) {
    throw new ServiceError('INVALID_REQUEST', SAFE_ERROR_MESSAGES.INVALID_REQUEST);
  }

  if (hasSample) {
    if (typeof sampleId !== 'string' || !sampleId) {
      throw new ServiceError('INVALID_REQUEST', SAFE_ERROR_MESSAGES.INVALID_REQUEST);
    }
    const sample = sampleDamageCases.find((item) => item.id === sampleId);
    if (!sample) throw new ServiceError('INVALID_REQUEST', 'Unknown sample.');
    return sampleAssessment(sample);
  }

  if (!file) {
    throw new ServiceError('INVALID_REQUEST', SAFE_ERROR_MESSAGES.INVALID_REQUEST);
  }
  if (!isFileLike(file)) {
    throw new ServiceError('INVALID_IMAGE', SAFE_ERROR_MESSAGES.INVALID_IMAGE);
  }
  if (!IMAGE_TYPES.includes(normalizeType(file.type))) {
    throw new ServiceError('UNSUPPORTED_MEDIA_TYPE', SAFE_ERROR_MESSAGES.UNSUPPORTED_MEDIA_TYPE);
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new ServiceError('INVALID_IMAGE', SAFE_ERROR_MESSAGES.INVALID_IMAGE);
  }

  const form = new FormData();
  form.append('image', file, typeof file.name === 'string' && file.name ? file.name : 'upload');

  let response;
  try {
    const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(BROWSER_TIMEOUT_MS)
      : undefined;
    response = await fetch('/api/analyze', {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw safeServiceError('TIMEOUT');
    }
    throw safeServiceError('UNAVAILABLE');
  }

  let body;
  try {
    body = await response.json();
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw safeServiceError('TIMEOUT');
    }
    throw safeServiceError(response.ok ? 'INVALID_RESPONSE' : 'UNAVAILABLE');
  }

  if (!response.ok) {
    throw safeServiceError(body?.error?.code, 'UNAVAILABLE');
  }
  if (!isAssessment(body) || body.mode !== 'live') {
    throw safeServiceError('INVALID_RESPONSE');
  }
  return body;
}

export async function getEmergencyResources() {
  return structuredClone(emergencyResources);
}

export async function askCopilot() {
  throw new ServiceError('NOT_CONFIGURED', 'The copilot is not connected yet.');
}
