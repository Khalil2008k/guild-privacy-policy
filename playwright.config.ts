
// Advanced Playwright Configuration with BrowserStack
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results/playwright',

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),

  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,
  maxFailures: 10,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/playwright/html' }],
    ['json', { outputFile: 'test-results/playwright/results.json' }],
    ['junit', { outputFile: 'test-results/playwright/junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],

  // Project configurations for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
      },
    },
    // Mobile configurations
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
    },
    // BrowserStack configurations
    {
      name: 'BrowserStack Chrome',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
      testMatch: '**/browserstack/**',
    },
    {
      name: 'BrowserStack Firefox',
      use: {
        browserName: 'firefox',
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
      testMatch: '**/browserstack/**',
    },
    {
      name: 'BrowserStack Safari',
      use: {
        browserName: 'webkit',
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
      testMatch: '**/browserstack/**',
    },
    {
      name: 'BrowserStack Edge',
      use: {
        browserName: 'chromium',
        channel: 'msedge',
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
      testMatch: '**/browserstack/**',
    },
  ],

  // BrowserStack specific configuration
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 0,
    navigationTimeout: 30000,
  },

  // Global test configuration
  globalTestConfig: {
    // Custom test utilities
    utils: {
      async login(email: string, password: string) {
        await this.page.goto('/login');
        await this.page.fill('[data-testid="email"]', email);
        await this.page.fill('[data-testid="password"]', password);
        await this.page.click('[data-testid="login-button"]');
        await this.page.waitForURL('**/dashboard');
      },

      async createJob(title: string, description: string, budget: number) {
        await this.page.goto('/jobs/new');
        await this.page.fill('[data-testid="job-title"]', title);
        await this.page.fill('[data-testid="job-description"]', description);
        await this.page.fill('[data-testid="job-budget"]', budget.toString());
        await this.page.click('[data-testid="create-job"]');
        await this.page.waitForSelector('[data-testid="job-created"]');
      },

      async checkAccessibility() {
        // Run axe-core accessibility tests
        const accessibilityScript = require('fs').readFileSync(require('path').join(__dirname, 'accessibility-script.js'), 'utf8');
        await this.page.addScriptTag({ content: accessibilityScript });

        const violations = await this.page.evaluate(() => {
          return window.axe.run(document, {
            rules: {
              'color-contrast': { enabled: true },
              'image-alt': { enabled: true },
              'heading-order': { enabled: true },
              'link-name': { enabled: true },
            }
          });
        });

        return violations;
      }
    }
  }
});
