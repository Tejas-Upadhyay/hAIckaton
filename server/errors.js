// Safe, client-facing error vocabulary for the API.
// Provider payloads, credentials, stack traces, and image bytes never belong here.

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const ERROR_MESSAGES = Object.freeze({
  INVALID_REQUEST: 'Send exactly one image file in the image field.',
  INVALID_IMAGE: 'The uploaded file is not a valid JPEG, PNG, or WebP image.',
  IMAGE_TOO_LARGE: 'The image is too large. Choose a JPEG, PNG, or WebP up to 5 MiB.',
  UNSUPPORTED_MEDIA_TYPE: 'Only JPEG, PNG, and WebP images are supported.',
  NOT_CONFIGURED: 'Live image analysis is not configured. Choose a labeled sample instead.',
  UNAVAILABLE: 'Live image analysis is unavailable. Choose a labeled sample or try again.',
  INVALID_RESPONSE: 'The analysis service returned an invalid assessment. Choose a labeled sample or try again.',
  TIMEOUT: 'Live image analysis timed out. Choose a labeled sample or try again.',
  METHOD_NOT_ALLOWED: 'Method not allowed.',
  NOT_FOUND: 'Endpoint not found.',
});

export function invalidRequest(message = ERROR_MESSAGES.INVALID_REQUEST) {
  return new ApiError(400, 'INVALID_REQUEST', message);
}

export function invalidImage(message = ERROR_MESSAGES.INVALID_IMAGE) {
  return new ApiError(400, 'INVALID_IMAGE', message);
}

export function unsupportedMediaType(message = ERROR_MESSAGES.UNSUPPORTED_MEDIA_TYPE) {
  return new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', message);
}

export function imageTooLarge(message = ERROR_MESSAGES.IMAGE_TOO_LARGE) {
  return new ApiError(413, 'IMAGE_TOO_LARGE', message);
}

export function notConfigured(message = ERROR_MESSAGES.NOT_CONFIGURED) {
  return new ApiError(503, 'NOT_CONFIGURED', message);
}

export function unavailable(message = ERROR_MESSAGES.UNAVAILABLE) {
  return new ApiError(503, 'UNAVAILABLE', message);
}

export function invalidResponse(message = ERROR_MESSAGES.INVALID_RESPONSE) {
  return new ApiError(502, 'INVALID_RESPONSE', message);
}

export function timeout(message = ERROR_MESSAGES.TIMEOUT) {
  return new ApiError(504, 'TIMEOUT', message);
}

export function methodNotAllowed(allow) {
  const error = new ApiError(405, 'METHOD_NOT_ALLOWED', ERROR_MESSAGES.METHOD_NOT_ALLOWED);
  error.allow = allow;
  return error;
}

export function notFound() {
  return new ApiError(404, 'NOT_FOUND', ERROR_MESSAGES.NOT_FOUND);
}
