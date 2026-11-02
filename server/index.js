import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { emergencyResources } from '../src/data/swflEmergencyData.js';

// OpenCode owns the live implementation. Never return credentials or provider errors.
export function createApiServer() {
  return createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method === 'GET' && path === '/api/health') {
      return response.end(JSON.stringify({ status: 'stub', liveAnalysis: false }));
    }
    if (request.method === 'GET' && path === '/api/resources') return response.end(JSON.stringify(emergencyResources));
    const known = ['/api/analyze', '/api/chat'].includes(path);
    response.statusCode = known ? (request.method === 'POST' ? 503 : 405) : 404;
    if (response.statusCode === 405) response.setHeader('Allow', 'POST');
    response.end(JSON.stringify({ error: {
      code: known ? (request.method === 'POST' ? 'NOT_CONFIGURED' : 'METHOD_NOT_ALLOWED') : 'NOT_FOUND',
      message: known ? 'Live AI is not connected. Choose an explicitly labeled sample.' : 'Endpoint not found.',
    } }));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApiServer().listen(Number(process.env.PORT || 8787), '127.0.0.1', () => console.log('StormGuard API listening on http://127.0.0.1:' + (process.env.PORT || 8787)));
}
