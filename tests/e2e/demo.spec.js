import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';

const fixture = new URL('../fixtures/pixel.png', import.meta.url).pathname;
const sampleButton = (page, title) => page.getByRole('button', { name: new RegExp(`Synthetic illustration of ${title}`) });
const report = (page) => page.locator('.report');

test.beforeEach(async ({ page }) => {
  // Browser regressions are deterministic and never consume a real API key.
  await page.route('**/api/**', route => route.fulfill({ status: 503, json: { error: { code: 'NOT_CONFIGURED', message: 'Not connected in automated tests.' } } }));
  await page.goto('/');
  await expect(sampleButton(page, 'Cape Coral roof')).toBeVisible();
});

test('all samples produce labeled printable reports and PDFs', async ({ page }) => {
  await mkdir('dogfood-output/pdfs', { recursive: true });
  for (const [name, slug] of [['Cape Coral roof', 'roof'], ['Fort Myers flood', 'flood'], ['Sanibel lanai', 'lanai']]) {
    await sampleButton(page, name).click();
    await expect(report(page)).toContainText('SAMPLE · Pre-written illustrative fixture');
    await expect(report(page)).toContainText('Limitations & Scope');
    await page.emulateMedia({ media: 'print' });
    await expect(report(page)).toBeVisible();
    await expect(page.getByRole('region', { name: 'Emergency Resources & Official Contacts' })).toBeHidden();
    await page.pdf({ path: `dogfood-output/pdfs/sample-${slug}.pdf`, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
    await page.emulateMedia({ media: 'screen' });
  }
});

test('file validation clears stale reports and valid photos can be removed and reselected', async ({ page }) => {
  const input = page.getByLabel('Upload a property damage photo');
  await sampleButton(page, 'Cape Coral roof').click();
  await input.setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') });
  await expect(page.getByRole('alert')).toContainText('Unsupported format');
  await expect(report(page)).toHaveCount(0);
  await input.setInputFiles({ name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) });
  await expect(page.getByRole('alert')).toContainText('empty');
  await input.setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(5242881) });
  await expect(page.getByRole('alert')).toContainText('too large');
  await input.setInputFiles(fixture);
  await expect(page.getByAltText('Selected property damage preview')).toBeVisible();
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(page.getByAltText('Selected property damage preview')).toHaveCount(0);
  await input.setInputFiles(fixture);
  await expect(page.getByAltText('Selected property damage preview')).toBeVisible();
  await sampleButton(page, 'Sanibel lanai').click();
  await expect(page.getByAltText('Selected property damage preview')).toHaveCount(0);
  await expect(report(page)).toContainText('SAMPLE');
});

test('live errors stay explicit and never substitute a sample', async ({ page }) => {
  await page.getByLabel('Upload a property damage photo').setInputFiles(fixture);
  await page.getByRole('button', { name: 'Analyze uploaded photo' }).click();
  await expect(page.getByRole('alert')).toContainText('Live analysis is not configured');
  await expect(report(page)).toHaveCount(0);
});

test('pending requests prevent duplicates and validated live results can be cleared', async ({ page }) => {
  let finish;
  const release = new Promise(resolve => { finish = resolve; });
  await page.route('**/api/analyze', async route => {
    await release;
    await route.fulfill({ json: {
      id: 'qa-live', mode: 'live', sampleId: null, model: 'mock-vision',
      createdAt: new Date().toISOString(), summary: 'Mocked browser test only.', severity: 'unknown',
      observations: ['Insufficient detail.'], hazards: [], nextSteps: ['Seek qualified inspection.'], limitations: ['Mock provider; not a real assessment.'],
    } });
  });
  await page.getByLabel('Upload a property damage photo').setInputFiles(fixture);
  await page.getByRole('button', { name: 'Analyze uploaded photo' }).click();
  await expect(page.getByRole('button', { name: 'Analyzing photo…' })).toBeDisabled();
  await expect(sampleButton(page, 'Cape Coral roof')).toBeDisabled();
  finish();
  await expect(report(page)).toContainText('LIVE AI INFERENCE · Model: mock-vision');
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(report(page)).toHaveCount(0);
});

test('drag/drop accepts a photo and offline analysis fails without a report', async ({ page, context }) => {
  const bytes = [...await readFile(fixture)];
  const data = await page.evaluateHandle(bytes => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(bytes)], 'drop.png', { type: 'image/png' }));
    return transfer;
  }, bytes);
  await page.locator('#damage-image').locator('..').dispatchEvent('drop', { dataTransfer: data });
  await expect(page.getByAltText('Selected property damage preview')).toBeVisible();
  await page.unroute('**/api/**');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Analyze uploaded photo' }).click();
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await expect(report(page)).toHaveCount(0);
  await sampleButton(page, 'Cape Coral roof').click();
  await expect(report(page)).toContainText('SAMPLE');
  await context.setOffline(false);
});

test('secondary controls, keyboard focus and print button work', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Ask a storm documentation or prep question' }).fill('How should I document damage?');
  await page.getByRole('button', { name: 'Ask Copilot' }).click();
  await expect(page.getByRole('alert')).toContainText('copilot is not connected');
  const checkbox = page.getByRole('checkbox').first();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await page.getByLabel('Upload a property damage photo').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Choose a photo' })).toBeFocused();
  await sampleButton(page, 'Cape Coral roof').click();
  await page.evaluate(() => { window.print = () => { window.__printInvoked = true; }; });
  await page.getByRole('button', { name: 'Print report / Save PDF' }).click();
  expect(await page.evaluate(() => window.__printInvoked)).toBe(true);
});

for (const width of [375, 768, 1440]) {
  test(`responsive sample report at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await sampleButton(page, 'Fort Myers flood').click();
    await expect(report(page)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await mkdir('dogfood-output/screenshots', { recursive: true });
    await page.screenshot({ path: `dogfood-output/screenshots/report-${width}.png`, fullPage: true });
  });
}

test('sample page has no serious automated accessibility violations or runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await sampleButton(page, 'Cape Coral roof').click();
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const violations = audit.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  expect(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  expect(errors).toEqual([]);
});
