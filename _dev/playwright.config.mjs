import { defineConfig, devices } from '@playwright/test';

// Serves the repository root (the published site) on port 4174 only.
// Never reuses a server already on 4174: it could be serving another checkout or branch (step 8, N14).
export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.mjs',
  outputDir: 'test-results',
  reporter: [['list']],
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4174/' },
  // The contract's three test engines (step 8, M3).
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npx serve -l 4174 ..',
    url: 'http://localhost:4174/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
