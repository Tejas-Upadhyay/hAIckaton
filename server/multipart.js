import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '../src/contracts/assessment.js';
import {
  imageTooLarge,
  invalidImage,
  invalidRequest,
  unsupportedMediaType,
} from './errors.js';

export const MAX_MULTIPART_BYTES = 6 * 1024 * 1024;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function normalizeMime(value) {
  const normalized = typeof value === 'string' ? value.split(';')[0].trim().toLowerCase() : '';
  return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

export function sniffImageType(bytes) {
  if (!Buffer.isBuffer(bytes)) return null;
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

// Container checks reject obvious truncation before spending a provider call.
// This is not a full image decoder; corrupt compressed pixels may still fail at
// the provider, and that failure must remain explicit (never a sample fallback).
export function hasCompleteImageContainer(bytes, type) {
  if (type === 'image/png') {
    if (bytes.length < 45 || bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR') return false;
    if (!bytes.readUInt32BE(16) || !bytes.readUInt32BE(20)) return false;
    let imageData = false;
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = bytes.readUInt32BE(offset);
      if (length > bytes.length - offset - 12) return false;
      const chunk = bytes.toString('ascii', offset + 4, offset + 8);
      if (chunk === 'IDAT' && length > 0) imageData = true;
      offset += length + 12;
      if (chunk === 'IEND') return length === 0 && imageData && offset === bytes.length;
    }
    return false;
  }
  if (type === 'image/jpeg') {
    if (bytes.length < 4 || bytes.readUInt16BE(bytes.length - 2) !== 0xffd9) return false;
    let frame = false;
    for (let offset = 2; offset + 3 < bytes.length;) {
      if (bytes[offset++] !== 0xff) return false;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0 || offset + 2 > bytes.length) return false;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || length > bytes.length - offset) return false;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        if (length < 8 || !bytes.readUInt16BE(offset + 3) || !bytes.readUInt16BE(offset + 5)) return false;
        frame = true;
      }
      if (marker === 0xda) return frame && offset + length < bytes.length - 2;
      offset += length;
    }
    return false;
  }
  if (type === 'image/webp') {
    if (bytes.length < 20 || bytes.readUInt32LE(4) + 8 !== bytes.length) return false;
    let imageData = false;
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const chunk = bytes.toString('ascii', offset, offset + 4);
      const length = bytes.readUInt32LE(offset + 4);
      if (length > bytes.length - offset - 8) return false;
      if ((chunk === 'VP8 ' && length >= 10) || (chunk === 'VP8L' && length >= 5) || (chunk === 'ANMF' && length > 16)) imageData = true;
      offset += 8 + length + (length % 2);
    }
    return imageData && offset === bytes.length;
  }
  return false;
}

export async function readBodyWithLimit(request, limit = MAX_MULTIPART_BYTES) {
  const declared = Number(request.headers?.['content-length']);
  if (Number.isFinite(declared) && declared > limit) {
    // Drain without buffering so the client can receive the safe 413 response.
    request.resume?.();
    throw imageTooLarge('The upload is too large. Choose an image up to 5 MiB.');
  }

  // Do not throw out of a Readable async iterator: iterator cleanup destroys
  // IncomingMessage and can close the socket before the 413 response is sent.
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    function fail(error) {
      if (settled) return;
      settled = true;
      chunks.length = 0;
      reject(error);
    }
    function onData(chunk) {
      if (settled) return; // Drain rejected uploads without retaining more bytes.
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > limit) {
        fail(imageTooLarge('The upload is too large. Choose an image up to 5 MiB.'));
        return;
      }
      chunks.push(buffer);
    }
    function cleanup() {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
      request.off('aborted', onAborted);
      request.off('close', onClose);
    }
    function onEnd() {
      cleanup();
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks, total));
    }
    function onError() {
      cleanup();
      fail(invalidRequest('The upload could not be read.'));
    }
    function onAborted() {
      fail(invalidRequest('The upload was interrupted.'));
    }
    function onClose() {
      cleanup();
      fail(invalidRequest('The upload was interrupted.'));
    }
    request.on('data', onData);
    request.once('end', onEnd);
    request.once('error', onError);
    request.once('aborted', onAborted);
    request.once('close', onClose);
  });
}

export async function parseImageUpload(contentType, body) {
  if (typeof contentType !== 'string' || !contentType.trim()) {
    throw unsupportedMediaType();
  }
  const mediaType = contentType.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'multipart/form-data') throw unsupportedMediaType();
  if (!/boundary=(?:"[^"]+"|[^;]+)/i.test(contentType)) {
    throw invalidRequest('The upload is not a valid multipart form.');
  }
  if (!body?.length) throw invalidRequest();

  let form;
  try {
    form = await new Response(body, { headers: { 'content-type': contentType } }).formData();
  } catch {
    throw invalidRequest('The upload is not a valid multipart form.');
  }

  const entries = form.getAll('image');
  if (entries.length !== 1) throw invalidRequest();

  const file = entries[0];
  if (
    !file ||
    typeof file.arrayBuffer !== 'function' ||
    typeof file.size !== 'number' ||
    typeof file.type !== 'string'
  ) {
    throw invalidRequest();
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw imageTooLarge('The image is larger than 5 MiB.');
  }
  if (file.size <= 0) {
    throw invalidImage('The image is empty or unreadable.');
  }

  const declaredType = normalizeMime(file.type);
  if (!IMAGE_TYPES.includes(declaredType)) throw unsupportedMediaType();

  const bytes = Buffer.from(await file.arrayBuffer());
  const actualType = sniffImageType(bytes);
  if (!actualType || actualType !== declaredType || !hasCompleteImageContainer(bytes, actualType)) {
    throw invalidImage('The file content does not match a supported JPEG, PNG, or WebP image.');
  }

  return { bytes, mimeType: actualType, size: bytes.length };
}
