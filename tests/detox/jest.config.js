module.exports = {
  rootDir: '../..',
  testMatch: ['<rootDir>/tests/detox/**/*.e2e.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    ['jest-html-reporters', {
      publicPath: './test-reports/detox',
      filename: 'detox-report.html',
      expand: true
    }]
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};






