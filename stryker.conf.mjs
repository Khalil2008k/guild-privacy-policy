/**
 * Stryker Mutation Testing Configuration
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'jest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  coverageAnalysis: 'perTest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  mutate: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/src/**/*.{js,ts}',
    '!src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '!backend/src/**/*.{test,spec}.{js,ts}',
    '!src/test-utils/**',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts,mjs}',
    '!**/dist/**'
  ],
  thresholds: {
    high: 80,
    low: 70,
    break: 60
  },
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  maxConcurrentTestRunners: 2,
  tempDirName: 'stryker-tmp',
  cleanTempDir: true,
  logLevel: 'info',
  fileLogLevel: 'trace',
  allowConsoleColors: true,
  dashboard: {
    reportType: 'full'
  },
  htmlReporter: {
    fileName: 'mutation-report.html'
  },
  jsonReporter: {
    fileName: 'mutation-report.json'
  }
};
