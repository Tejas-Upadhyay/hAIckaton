import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DocumentationReport from '../../src/components/DocumentationReport.jsx';
import DamageAuditor from '../../src/components/DamageAuditor.jsx';
import * as services from '../../src/services/aiService.js';

test('all sample reports retain provenance, generation time and limitations', async () => {
  for (const sample of await services.listSampleCases()) {
    const assessment = await services.analyzeDamage({ sampleId: sample.id });
    const html = renderToStaticMarkup(<DocumentationReport assessment={assessment} />);
    assert.match(html, /SAMPLE · Pre-written illustrative fixture/);
    assert.match(html, /Property Documentation Draft/);
    assert.ok(html.includes(`dateTime="${assessment.createdAt}"`));
    assert.match(html, /Limitations &amp; Scope/);
    assert.doesNotMatch(html, /LIVE AI INFERENCE/);
  }
});
test('live report retains model provenance and escapes provider text', async () => {
  const sample = await services.analyzeDamage({ sampleId: 'cape-coral-roof' });
  const html = renderToStaticMarkup(<DocumentationReport assessment={{ ...sample, mode: 'live', sampleId: null, model: 'mock-vision', summary: '<script>alert(1)</script>' }} />);
  assert.match(html, /LIVE AI INFERENCE · Model: mock-vision/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
test('sample cards show synthetic illustrations', async () => {
  const html = renderToStaticMarkup(<DamageAuditor samples={await services.listSampleCases()} />);
  assert.equal((html.match(/not a real photo/g) || []).length, 3);
});
test('failed upload shows a notice and no assessment', () => {
  const html = renderToStaticMarkup(<><DamageAuditor samples={[]} error="Live analysis is not configured." /><DocumentationReport assessment={null} /></>);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /Property Documentation Draft/);
});
