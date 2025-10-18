
// Advanced Cypress Configuration with Parallel Execution and Cloud Recording
module.exports = {
  projectId: process.env.CYPRESS_PROJECT_ID || 'guild-testing',
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 15000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  video: true,
  videoCompression: 32,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  fixturesFolder: 'cypress/fixtures',
  supportFile: 'cypress/support/e2e.ts',
  specPattern: [
    'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    'cypress/integration/**/*.cy.{js,jsx,ts,tsx}'
  ],
  retries: {
    runMode: 2,
    openMode: 0
  },
  env: {
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
    mobileUrl: process.env.MOBILE_URL || 'http://localhost:3002'
  },
  e2e: {
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push('--disable-web-security');
          launchOptions.args.push('--disable-features=VizDisplayCompositor');
        }

        return launchOptions;
      });

      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });
    },
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    experimentalStudio: true,
    experimentalSessionAndOrigin: true
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack'
    },
    setupNodeEvents(on, config) {
      // Component testing setup
    }
  }
};
