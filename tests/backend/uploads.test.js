import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import { once } from 'node:events';
import { hasCompleteImageContainer, sniffImageType, parseImageUpload, readBodyWithLimit } from '../../server/multipart.js';

test('complete QA containers are accepted and truncated versions rejected', async () => {
  for (const [extension, type] of [['png', 'image/png'], ['jpg', 'image/jpeg'], ['webp', 'image/webp']]) {
    const bytes = await readFile(new URL(`../fixtures/pixel.${extension}`, import.meta.url));
    assert.equal(sniffImageType(bytes), type);
    assert.equal(hasCompleteImageContainer(bytes, type), true, extension);
    assert.equal(hasCompleteImageContainer(bytes.subarray(0, 12), type), false, extension);
    assert.equal(hasCompleteImageContainer(bytes.subarray(0, bytes.length - 1), type), false, extension);
    const form = new FormData();
    form.append('image', new File([bytes], `pixel.${extension}`, { type }));
    const request = new Request('http://localhost/api/analyze', { method: 'POST', body: form });
    const parsed = await parseImageUpload(request.headers.get('content-type'), Buffer.from(await request.arrayBuffer()));
    assert.equal(parsed.mimeType, type);
  }
});

test('PNG signature alone cannot be forwarded for analysis', async () => {
  const form = new FormData();
  form.append('image', new File([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])], 'fake.png', { type: 'image/png' }));
  const request = new Request('http://localhost/api/analyze', { method: 'POST', body: form });
  await assert.rejects(parseImageUpload(request.headers.get('content-type'), Buffer.from(await request.arrayBuffer())), { code: 'INVALID_IMAGE' });
});

test('chunked overflow rejects without destroying the request before error response', async () => {
  const stream = new PassThrough({ autoDestroy: false });
  stream.headers = {};
  const result = readBodyWithLimit(stream, 4);
  stream.write(Buffer.from('12345'));
  await assert.rejects(result, { code: 'IMAGE_TOO_LARGE' });
  assert.equal(stream.destroyed, false);
  stream.end(Buffer.from('remaining bytes must drain'));
  if (!stream.readableEnded) await once(stream, 'end');
  assert.equal(stream.destroyed, false);
  assert.equal(stream.listenerCount('data'), 0);
  stream.destroy();
});

test('interrupted uploads reject and normal bodies preserve all bytes', async () => {
  const interrupted = new PassThrough();
  interrupted.headers = {};
  const failure = readBodyWithLimit(interrupted);
  interrupted.emit('aborted');
  await assert.rejects(failure, { code: 'INVALID_REQUEST' });
  interrupted.destroy();
  const normal = new PassThrough();
  normal.headers = {};
  const result = readBodyWithLimit(normal);
  normal.write(Buffer.from('first'));
  normal.end(Buffer.from('second'));
  assert.equal((await result).toString(), 'firstsecond');
});
