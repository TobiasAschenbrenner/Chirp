import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:4201',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      name: 'E2E backend',
      command: 'npm run start:e2e',
      cwd: '../server',
      url: 'http://127.0.0.1:3001/api/posts',
      reuseExistingServer: false,
      gracefulShutdown: {
        signal: 'SIGTERM',
        timeout: 5_000,
      },
      timeout: 120_000,
    },
    {
      name: 'Angular frontend',
      command: 'npm run start:e2e',
      url: 'http://localhost:4201',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
