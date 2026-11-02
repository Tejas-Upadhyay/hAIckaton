import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createApiServer } from '../../server/index.js';
import { isAssessment, MAX_IMAGE_BYTES } from '../../src/contracts/assessment.js';

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXQAAAAASUVORK5CYII=',
  'base64',
);

function pngFile(name = 'test.png') {
  return new File([PNG_BYTES], name, { type: 'image/png' });
}

function providerPayload(content, extra = {}) {
  return { choices: [{ message: { content: JSON.stringify(content) }, finish_reason: 'stop' }], ...extra };
}

const VALID_CONTENT = {
  summary: 'Visible roof covering displacement is suggested, but concealed damage is not visible.',
  severity: 'moderate',
  observations: ['Roof covering appears displaced.', 'An area of underlayment is exposed.'],
  hazards: ['Loose material could become a falling hazard.', 'Concealed water intrusion is possible.'],
  nextSteps: ['Document visible damage from a safe location.', 'Arrange a qualified inspection.'],
  limitations: ['This is a provisional single-photo observation.'],
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function withServer(options, fn) {
  const server = createApiServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections?.();
    });
  }
}

function analyze(baseUrl, form) {
  return fetch(`${baseUrl}/api/analyze`, { method: 'POST', body: form });
}

function formWith(file, field = 'image') {
  const form = new FormData();
  form.append(field, file);
  return form;
}

function configuredEnv(overrides = {}) {
  return {
    AI_PROVIDER: 'openrouter',
    OPENROUTER_API_KEY: 'super-secret-test-key',
    OPENROUTER_MODEL: 'test-vision',
    ...overrides,
  };
}

test('health reports configured state without exposing credentials', async () => {
  await withServer({ env: {} }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'stub', liveAnalysis: false });
  });

  await withServer({ env: configuredEnv() }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.deepEqual(JSON.parse(text), { status: 'ready', liveAnalysis: true });
    assert.ok(!text.includes('super-secret-test-key'));
  });

  for (const env of [
    { OPENROUTER_API_KEY: 'key' },
    { OPENROUTER_MODEL: 'test-vision' },
    { OPENROUTER_API_KEY: 'key', OPENROUTER_MODEL: '../../evil' },
  ]) {
    await withServer({ env }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`);
      assert.deepEqual(await response.json(), { status: 'stub', liveAnalysis: false });
    });
  }
});

test('valid uploads produce a live assessment with server-owned provenance', async () => {
  const calls = [];
  const providerContent = {
    ...VALID_CONTENT,
    // Provider text must not be able to spoof provenance or add unknown fields.
    id: 'provider-id',
    mode: 'sample',
    sampleId: 'cape-coral-roof',
    model: 'provider-model',
    createdAt: '1999-01-01T00:00:00.000Z',
    extra: 'ignored',
  };
  const options = {
    env: configuredEnv(),
    now: () => new Date('2026-11-02T12:00:00.000Z'),
    idFactory: () => 'test-assessment-id',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse(providerPayload(providerContent));
    },
  };

  await withServer(options, async (baseUrl) => {
    const response = await analyze(baseUrl, formWith(pngFile()));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('content-type'), /application\/json/);
    const assessment = await response.json();
    assert.ok(isAssessment(assessment));
    assert.equal(assessment.id, 'assessment-test-assessment-id');
    assert.equal(assessment.mode, 'live');
    assert.equal(assessment.sampleId, null);
    assert.equal(assessment.model, 'openrouter:test-vision');
    assert.equal(assessment.createdAt, '2026-11-02T12:00:00.000Z');
    assert.equal(assessment.summary, VALID_CONTENT.summary);
    assert.deepEqual(assessment.observations, VALID_CONTENT.observations);
    assert.ok(assessment.limitations.some((item) => /official inspection/.test(item)));
    assert.ok(assessment.limitations.includes('This is a provisional single-photo observation.'));
  });

  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, 'Bearer super-secret-test-key');
  const requestBody = JSON.parse(init.body);
  assert.equal(requestBody.response_format.type, 'json_schema');
  assert.equal(requestBody.response_format.json_schema.schema.type, 'object');
  assert.equal(requestBody.messages[1].content[1].type, 'image_url');
  assert.equal(requestBody.messages[1].content[1].image_url.url, 'data:image/png;base64,' + PNG_BYTES.toString('base64'));
  assert.ok(requestBody.messages[0].content.includes('FEMA'));

});

test('complete JPEG and WebP containers are accepted and forwarded with their MIME type', async () => {
  const jpeg = readFileSync(new URL('../fixtures/pixel.jpg', import.meta.url));
  const webp = readFileSync(new URL('../fixtures/pixel.webp', import.meta.url));

  for (const [bytes, type] of [
    [jpeg, 'image/jpeg'],
    [webp, 'image/webp'],
  ]) {
    const calls = [];
    await withServer(
      {
        env: configuredEnv(),
        fetchImpl: async (url, init) => {
          calls.push(init);
          return jsonResponse(providerPayload(VALID_CONTENT));
        },
      },
      async (baseUrl) => {
        const extension = type === 'image/jpeg' ? 'jpg' : 'webp';
        const response = await analyze(baseUrl, formWith(new File([bytes], `test.${extension}`, { type })));
        assert.equal(response.status, 200);
        assert.equal(JSON.parse(calls[0].body).messages[1].content[1].image_url.url.startsWith(`data:${type};base64,`), true);
      },
    );
  }
});

test('server-owned limitations are present even when the provider returns none', async () => {
  await withServer(
    {
      env: configuredEnv(),
      fetchImpl: async () => jsonResponse(providerPayload({ ...VALID_CONTENT, limitations: [] })),
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 200);
      const assessment = await response.json();
      assert.ok(isAssessment(assessment));
      assert.ok(assessment.limitations.length >= 3);
    },
  );
});

test('configured-looking requests without credentials return NOT_CONFIGURED', async () => {
  await withServer({ env: {}, fetchImpl: async () => assert.fail('provider must not be called') }, async (baseUrl) => {
    const response = await analyze(baseUrl, formWith(pngFile()));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error.code, 'NOT_CONFIGURED');
    assert.ok(!JSON.stringify(body).includes('super-secret-test-key'));
  });

  await withServer(
    { env: { OPENROUTER_API_KEY: 'key' }, fetchImpl: async () => assert.fail('provider must not be called') },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error.code, 'NOT_CONFIGURED');
    },
  );
});

test('upload validation rejects wrong methods, missing files, malformed multipart, wrong types, and mismatched content', async () => {
  const fetchImpl = async () => assert.fail('provider must not be called for invalid input');
  await withServer({ env: configuredEnv(), fetchImpl }, async (baseUrl) => {
    const method = await fetch(`${baseUrl}/api/analyze`);
    assert.equal(method.status, 405);
    assert.equal(method.headers.get('allow'), 'POST');
    assert.equal((await method.json()).error.code, 'METHOD_NOT_ALLOWED');

    const json = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(json.status, 415);
    assert.equal((await json.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');

    const missing = await analyze(baseUrl, formWith(pngFile(), 'photo'));
    assert.equal(missing.status, 400);
    assert.equal((await missing.json()).error.code, 'INVALID_REQUEST');

    const twoImages = new FormData();
    twoImages.append('image', pngFile('a.png'));
    twoImages.append('image', pngFile('b.png'));
    const two = await analyze(baseUrl, twoImages);
    assert.equal(two.status, 400);
    assert.equal((await two.json()).error.code, 'INVALID_REQUEST');

    const empty = await analyze(baseUrl, formWith(new File([], 'empty.png', { type: 'image/png' })));
    assert.equal(empty.status, 400);
    assert.equal((await empty.json()).error.code, 'INVALID_IMAGE');

    const gif = await analyze(baseUrl, formWith(new File(['GIF89a'], 'x.gif', { type: 'image/gif' })));
    assert.equal(gif.status, 415);
    assert.equal((await gif.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');

    const mismatch = await analyze(baseUrl, formWith(new File(['not a png'], 'fake.png', { type: 'image/png' })));
    assert.equal(mismatch.status, 400);
    assert.equal((await mismatch.json()).error.code, 'INVALID_IMAGE');

    const noBoundary = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: 'x',
    });
    assert.equal(noBoundary.status, 400);
    assert.equal((await noBoundary.json()).error.code, 'INVALID_REQUEST');

    const malformed = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary' },
      body: 'not a multipart body',
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error.code, 'INVALID_REQUEST');
  });
});

test('file and multipart size caps return 413 without calling the provider', async () => {
  const fetchImpl = async () => assert.fail('provider must not be called for oversized uploads');
  await withServer({ env: configuredEnv(), fetchImpl }, async (baseUrl) => {
    const tooLarge = Buffer.alloc(MAX_IMAGE_BYTES + 1, 1);
    PNG_BYTES.copy(tooLarge, 0);
    const response = await analyze(baseUrl, formWith(new File([tooLarge], 'large.png', { type: 'image/png' })));
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, 'IMAGE_TOO_LARGE');

    const boundary = 'test-boundary';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="big.png"\r\nContent-Type: image/png\r\n\r\n`),
      Buffer.alloc(6 * 1024 * 1024 + 1, 1),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const oversizedBody = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });
    assert.equal(oversizedBody.status, 413);
    assert.equal((await oversizedBody.json()).error.code, 'IMAGE_TOO_LARGE');
  });
});

test('provider failures map to safe errors without provider payloads or credentials', async () => {
  const cases = [
    { status: 401, code: 'NOT_CONFIGURED' },
    { status: 403, code: 'NOT_CONFIGURED' },
    { status: 404, code: 'NOT_CONFIGURED' },
    { status: 429, code: 'UNAVAILABLE' },
    { status: 500, code: 'UNAVAILABLE' },
  ];

  for (const item of cases) {
    await withServer(
      {
        env: configuredEnv(),
        fetchImpl: async () =>
          new Response('provider-secret-payload that must not leak', {
            status: item.status,
            headers: { 'Content-Type': 'text/plain' },
          }),
      },
      async (baseUrl) => {
        const response = await analyze(baseUrl, formWith(pngFile()));
        assert.equal(response.status, 503);
        const text = await response.text();
        assert.ok(!text.includes('provider-secret-payload'));
        assert.ok(!text.includes('super-secret-test-key'));
        assert.ok(!text.includes(PNG_BYTES.toString('base64')));
        assert.equal(JSON.parse(text).error.code, item.code);
      },
    );
  }

  await withServer(
    {
      env: configuredEnv(),
      fetchImpl: async () => {
        throw new Error('network down');
      },
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error.code, 'UNAVAILABLE');
    },
  );
});

test('provider timeouts return 504 and do not fabricate a sample', async () => {
  await withServer(
    {
      env: configuredEnv(),
      providerTimeoutMs: 10,
      fetchImpl: async (url, init) =>
        new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(init.signal.reason));
        }),
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 504);
      assert.equal((await response.json()).error.code, 'TIMEOUT');
    },
  );
});

test('malformed or incomplete provider content returns INVALID_RESPONSE', async () => {
  const invalidContents = [
    null,
    {},
    { ...VALID_CONTENT, severity: 'catastrophic' },
    { ...VALID_CONTENT, summary: '' },
    { ...VALID_CONTENT, observations: 'not an array' },
    { ...VALID_CONTENT, nextSteps: [1, 2] },
    { ...VALID_CONTENT, limitations: Array.from({ length: 17 }, (_, index) => `item ${index}`) },
    { ...VALID_CONTENT, summary: 'x'.repeat(1_201) },
  ];

  for (const content of invalidContents) {
    await withServer(
      {
        env: configuredEnv(),
        fetchImpl: async () => jsonResponse(providerPayload(content)),
      },
      async (baseUrl) => {
        const response = await analyze(baseUrl, formWith(pngFile()));
        assert.equal(response.status, 502, JSON.stringify(content));
        assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
      },
    );
  }

  await withServer(
    {
      env: configuredEnv(),
      fetchImpl: async () => new Response('not json', { status: 200 }),
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 502);
      assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
    },
  );

  await withServer(
    {
      env: configuredEnv(),
      fetchImpl: async () =>
        jsonResponse({ choices: [{ message: { refusal: 'refused' }, finish_reason: 'content_filter' }] }),
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 502);
      assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
    },
  );

  await withServer(
    {
      env: configuredEnv(),
      fetchImpl: async () => jsonResponse({ choices: [] }),
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 502);
      assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
    },
  );

  await withServer(
    {
      env: configuredEnv(),
      fetchImpl: async () =>
        jsonResponse({ choices: [{ message: { content: JSON.stringify(VALID_CONTENT) }, finish_reason: 'length' }] }),
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 502);
      assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
    },
  );
});

test('client disconnect cancels in-flight provider work', async () => {
  let providerSignal;
  let signalProviderStarted;
  const providerStarted = new Promise((resolve) => {
    signalProviderStarted = resolve;
  });
  const options = {
    env: configuredEnv(),
    fetchImpl: async (url, init) => {
      providerSignal = init.signal;
      signalProviderStarted();
      return new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
      });
    },
  };

  await withServer(options, async (baseUrl) => {
    const client = new AbortController();
    const cancellable = fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      body: formWith(pngFile()),
      signal: client.signal,
    }).catch((error) => error);
    await providerStarted;
    client.abort();
    await cancellable;
    for (let index = 0; index < 200 && !providerSignal?.aborted; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(providerSignal?.aborted, true);
  });
});

test('model ID comes from runtime configuration', async () => {
  const calls = [];
  await withServer(
    {
      env: configuredEnv({ OPENROUTER_MODEL: 'example-vision-model' }),
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return jsonResponse(providerPayload(VALID_CONTENT));
      },
    },
    async (baseUrl) => {
      const response = await analyze(baseUrl, formWith(pngFile()));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).model, 'openrouter:example-vision-model');
    },
  );
  assert.equal(JSON.parse(calls[0].init.body).model, 'example-vision-model');
});

test('other routes keep explicit unavailable/stub behavior and safe headers', async () => {
  await withServer({ env: configuredEnv() }, async (baseUrl) => {
    const resources = await fetch(`${baseUrl}/api/resources`);
    assert.equal(resources.status, 200);
    assert.equal(resources.headers.get('cache-control'), 'no-store');
    const data = await resources.json();
    assert.equal(data.status, 'unavailable');
    assert.equal(data.updatedAt, null);
    assert.equal(data.sourceUrl, null);
    assert.deepEqual(data.shelters, []);
    assert.deepEqual(data.advisories, []);

    const chat = await fetch(`${baseUrl}/api/chat`, { method: 'POST' });
    assert.equal(chat.status, 503);
    assert.equal((await chat.json()).error.code, 'NOT_CONFIGURED');

    const healthPost = await fetch(`${baseUrl}/api/health`, { method: 'POST' });
    assert.equal(healthPost.status, 405);
    assert.equal(healthPost.headers.get('allow'), 'GET');

    const resourcesPost = await fetch(`${baseUrl}/api/resources`, { method: 'POST' });
    assert.equal(resourcesPost.status, 405);
    assert.equal(resourcesPost.headers.get('allow'), 'GET');

    const missing = await fetch(`${baseUrl}/api/missing`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'NOT_FOUND');
    assert.equal(missing.headers.get('cache-control'), 'no-store');
  });
});
