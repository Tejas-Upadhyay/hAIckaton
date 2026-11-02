import { randomUUID } from 'node:crypto';
import { SEVERITIES, isAssessment } from '../src/contracts/assessment.js';
import { invalidResponse } from './errors.js';

const MAX_SUMMARY_LENGTH = 1_200;
const MAX_ITEM_LENGTH = 600;
const MAX_ITEMS = 16;

// Trusted provenance and limitations are added by the server, never accepted
// from provider text.
export const LIVE_LIMITATIONS = [
  'Provisional observation from a single photo; not an official inspection or structural-safety determination.',
  'Not a FEMA classification, coverage or eligibility determination, or repair quote.',
  'Some damage or hazards may be hidden, out of frame, or misidentified; consult qualified professionals.',
];

function cleanText(value, maxLength) {
  if (typeof value !== 'string') throw invalidResponse();
  const cleaned = value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || cleaned.length > maxLength) throw invalidResponse();
  return cleaned;
}

function cleanList(value) {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) throw invalidResponse();
  return value.map((item) => cleanText(item, MAX_ITEM_LENGTH));
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

export function validateProviderContent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalidResponse();
  if (!SEVERITIES.includes(value.severity)) throw invalidResponse();
  return {
    summary: cleanText(value.summary, MAX_SUMMARY_LENGTH),
    severity: value.severity,
    observations: cleanList(value.observations),
    hazards: cleanList(value.hazards),
    nextSteps: cleanList(value.nextSteps),
    limitations: cleanList(value.limitations),
  };
}

export function buildLiveAssessment({
  content,
  model,
  now = () => new Date(),
  id = randomUUID,
}) {
  const limitations = dedupe([...LIVE_LIMITATIONS, ...content.limitations]);
  const assessment = {
    id: `assessment-${id()}`,
    mode: 'live',
    sampleId: null,
    createdAt: now().toISOString(),
    model,
    summary: content.summary,
    severity: content.severity,
    observations: content.observations,
    hazards: content.hazards,
    nextSteps: content.nextSteps,
    limitations,
  };
  if (!isAssessment(assessment)) throw invalidResponse();
  return assessment;
}
