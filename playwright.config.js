import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [['list'], ['json', { outputFile: 'dogfood-output/browser-results.json' }]],
  use: { channel: 'chrome', baseURL: 'http://127.0.0.1:5175', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --port 5175', url: 'http://127.0.0.1:5175', reuseExistingServer: false },
});
