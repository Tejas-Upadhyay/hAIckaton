import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { emergencyResources } from '../src/data/swflEmergencyData.js';
import { readProviderChain } from './config.js';
import { requestOpenRouterAssessment } from './openrouter.js';
import {
  ApiError,
  ERROR_MESSAGES,
  methodNotAllowed,
  notConfigured,
  notFound,
  unavailable,
} from './errors.js';
import { readBodyWithLimit, parseImageUpload } from './multipart.js';
import { PROVIDER_TIMEOUT_MS } from './provider-common.js';
import { buildLiveAssessment, validateProviderContent } from './validation.js';

function setCommonHeaders(response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
}

function sendJson(response, status, body, extraHeaders = {}) {
  if (response.writableEnded || response.destroyed) return;
  if (response.headersSent) {
    response.destroy?.();
    return;
  }
  response.statusCode = status;
  setCommonHeaders(response);
  for (const [key, value] of Object.entries(extraHeaders)) response.setHeader(key, value);
  try {
    response.end(JSON.stringify(body));
  } catch {
    // The client may have disconnected while the response was being written.
  }
}

function sendError(response, error) {
  if (response.writableEnded || response.destroyed) return;
  if (error instanceof ApiError) {
    const headers = error.allow ? { Allow: error.allow } : {};
    return sendJson(response, error.status, { error: { code: error.code, message: error.message } }, headers);
  }
  // Unexpected failures stay generic and never expose provider payloads,
  // credentials, stack traces, or image bytes.
  return sendJson(response, 503, {
    error: { code: 'UNAVAILABLE', message: ERROR_MESSAGES.UNAVAILABLE },
  });
}

async function analyzeRequest(request, response, deps) {
  const contentType = request.headers?.['content-type'];
  const body = await readBodyWithLimit(request);
  const image = await parseImageUpload(contentType, body);

  const configs = readProviderChain(deps.env);
  if (!configs.length) throw notConfigured();

  const controller = new AbortController();
  let clientGone = false;
  const onClientClose = () => {
    if (response.writableEnded) return;
    clientGone = true;
    controller.abort();
  };
  request.on('aborted', onClientClose);
  response.on('close', onClientClose);

  try {
    let assessment;
    let lastError;
    const started = Date.now();
    for (let index = 0; index < configs.length; index++) {
      const config = configs[index];
      if (controller.signal.aborted) return;
      const remaining = deps.providerTimeoutMs - (Date.now() - started);
      if (remaining <= 0) break;
      // Reserve time for the backup inside the existing 25s total budget.
      const budget = index < configs.length - 1 ? Math.min(12000, remaining / 2) : remaining;
      try {
        const providerContent = await requestOpenRouterAssessment({ bytes: image.bytes, mimeType: image.mimeType, config, fetchImpl: deps.fetchImpl, signal: controller.signal, timeoutMs: Math.max(1, Math.floor(budget)) });
        const content = validateProviderContent(providerContent);
        if (config.provider !== (deps.env.AI_PROVIDER || 'nim').trim().toLowerCase()) {
          content.limitations.push('Backup live provider used because the primary provider was unavailable or not configured.');
        }
        assessment = buildLiveAssessment({ content, model: `${config.provider}:${config.model}`, now: deps.now, id: deps.idFactory });
        break;
      } catch (error) {
        lastError = error;
        if (controller.signal.aborted) return;
        // A refusal/invalid result is not retried to evade the provider's decision.
        if (error.code === 'INVALID_RESPONSE') throw error;
      }
    }
    if (!assessment) throw lastError || unavailable();
    if (clientGone) return;
    sendJson(response, 200, assessment);
  } catch (error) {
    if (clientGone) return;
    throw error;
  } finally {
    request.off('aborted', onClientClose);
    response.off('close', onClientClose);
  }
}

async function handleRequest(request, response, deps) {
  const path = new URL(request.url || '/', 'http://localhost').pathname;
  const method = request.method || 'GET';

  if (path === '/api/health') {
    if (method !== 'GET') {
      request.resume?.();
      throw methodNotAllowed('GET');
    }
    const configured = readProviderChain(deps.env).length > 0;
    return sendJson(response, 200, {
      status: configured ? 'ready' : 'stub',
      liveAnalysis: configured,
    });
  }

  if (path === '/api/resources') {
    if (method !== 'GET') {
      request.resume?.();
      throw methodNotAllowed('GET');
    }
    return sendJson(response, 200, structuredClone(emergencyResources));
  }

  if (path === '/api/analyze') {
    if (method !== 'POST') {
      request.resume?.();
      throw methodNotAllowed('POST');
    }
    return analyzeRequest(request, response, deps);
  }

  if (path === '/api/chat') {
    if (method !== 'POST') {
      request.resume?.();
      throw methodNotAllowed('POST');
    }
    request.resume?.();
    throw notConfigured('The copilot is not connected yet.');
  }

  request.resume?.();
  throw notFound();
}

export function createApiServer(options = {}) {
  const deps = {
    env: options.env ?? process.env,
    fetchImpl: options.fetchImpl ?? globalThis.fetch,
    now: options.now ?? (() => new Date()),
    idFactory: options.idFactory ?? randomUUID,
    providerTimeoutMs: options.providerTimeoutMs ?? PROVIDER_TIMEOUT_MS,
  };

  return createServer((request, response) => {
    // A client can disconnect while an upload or provider request is in flight.
    // Keep those socket errors from becoming unhandled event-emitter errors.
    request.on('error', () => {});
    response.on('error', () => {});
    handleRequest(request, response, deps).catch((error) => {
      if (error instanceof ApiError) {
        sendError(response, error);
        return;
      }
      // A malformed body can surface as a plain Error from the HTTP layer.
      if (!response.writableEnded && !response.destroyed) {
        sendError(response, unavailable());
      }
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const requestedPort = Number(process.env.PORT || 8787);
  const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort < 65_536
    ? requestedPort
    : 8787;
  createApiServer().listen(port, '127.0.0.1', () => {
    console.log(`StormGuard API listening on http://127.0.0.1:${port}`);
  });
}
