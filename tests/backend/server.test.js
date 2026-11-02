import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../../server/index.js';

// Exercise routing without opening network ports, so these checks run in restricted shells.
function request(method, url) {
  const server = createApiServer();
  const response = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = JSON.parse(body); } };
  server.emit('request', { method, url }, response);
  return response;
}

test('health advertises stub state, not configured/live inference', () => {
  assert.deepEqual(request('GET', '/api/health').body, { status: 'stub', liveAnalysis: false });
});

test('AI endpoints fail explicitly rather than inventing provider output', () => {
  for (const endpoint of ['/api/analyze', '/api/chat']) {
    const response = request('POST', endpoint);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.error.code, 'NOT_CONFIGURED');
    assert.equal(response.headers['Cache-Control'], 'no-store');
  }
});

test('resources, wrong methods, and unknown routes have predictable responses', () => {
  assert.equal(request('GET', '/api/resources').body.status, 'unavailable');
  assert.equal(request('GET', '/api/analyze').statusCode, 405);
  assert.equal(request('GET', '/does-not-exist').statusCode, 404);
});
