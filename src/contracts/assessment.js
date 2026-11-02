export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const SEVERITIES = ['minor', 'moderate', 'major', 'unknown'];

// Shared wire schema. Provider output must be validated before adding trusted metadata.
export const assessmentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'mode', 'sampleId', 'createdAt', 'model', 'summary', 'severity', 'observations', 'hazards', 'nextSteps', 'limitations'],
  properties: {
    id: { type: 'string', minLength: 1 },
    mode: { type: 'string', enum: ['sample', 'live'] },
    sampleId: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
    model: { type: ['string', 'null'] },
    summary: { type: 'string', minLength: 1 },
    severity: { type: 'string', enum: SEVERITIES },
    observations: { type: 'array', items: { type: 'string' } },
    hazards: { type: 'array', items: { type: 'string' } },
    nextSteps: { type: 'array', items: { type: 'string' } },
    limitations: { type: 'array', items: { type: 'string' }, minItems: 1 },
  },
};

export function isAssessment(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.keys(value).some((key) => !Object.hasOwn(assessmentSchema.properties, key))) return false;
  if (!['id', 'summary'].every((key) => typeof value[key] === 'string' && value[key].trim())) return false;
  if (!SEVERITIES.includes(value.severity) || !['sample', 'live'].includes(value.mode)) return false;
  if (typeof value.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.createdAt) || !Number.isFinite(Date.parse(value.createdAt))) return false;
  if (!['observations', 'hazards', 'nextSteps', 'limitations'].every((key) => Array.isArray(value[key]) && value[key].every((item) => typeof item === 'string'))) return false;
  if (!value.limitations.length) return false;
  return value.mode === 'sample'
    ? typeof value.sampleId === 'string' && value.sampleId.length > 0 && value.model === null
    : value.sampleId === null && typeof value.model === 'string' && value.model.length > 0;
}
