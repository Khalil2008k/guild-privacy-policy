
// Advanced Vitest Configuration with Parallel Execution
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/vitest-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'admin-portal/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/android/**',
      '**/ios/**',
      '**/*.d.ts',
      '**/cypress/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{ts,tsx}',
        'backend/src/**/*.{ts,tsx}',
        'admin-portal/src/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.d.ts',
        '**/test-utils/**',
        '**/mocks/**',
        '**/fixtures/**',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 90,
          statements: 90
        }
      },
      all: true,
      src: ['.']
    },
    pool: 'threads', // Use threads for parallel execution
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        useAtomics: true
      }
    },
    maxThreads: 8, // Limit threads for stability
    minThreads: 2,
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    bail: 1, // Stop on first failure
    retry: 2, // Retry failed tests
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    sequence: {
      concurrent: true, // Allow concurrent test execution
      shuffle: true // Shuffle test order for better parallel distribution
    },
    reporters: [
      'verbose',
      'json',
      'html',
      ['junit', { outputFile: 'test-results/vitest-junit.xml' }],
      ['github-actions', { outputFile: 'test-results/vitest-github.xml' }]
    ],
    outputFile: {
      junit: 'test-results/vitest-junit.xml',
      json: 'test-results/vitest-results.json',
      html: 'test-results/vitest-report.html'
    },
    benchmark: {
      include: ['**/*.bench.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['**/node_modules/**'],
      reporters: ['verbose', 'json']
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        html: '<!DOCTYPE html><html><body></body></html>'
      }
    },
    testNamePattern: undefined,
    passWithNoTests: false,
    allowOnly: true,
    dangerouslyIgnoreUnhandledErrors: false,
    isolate: true,
    maxConcurrency: 10,
    useAtomics: true,
    update: false,
    watch: false,
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*', '**/jest.config.*'],
    onConsoleLog: 'warn',
    slowTestThreshold: 5000,
    chaiConfig: {
      truncateThreshold: 0,
      includeStack: true
    },
    resolveSnapshotPath: (testPath, snapExtension) => {
      return path.join(
        path.dirname(testPath),
        '__snapshots__',
        path.basename(testPath, path.extname(testPath)) + snapExtension
      );
    },
    // Custom test environment options
    environmentMatchGlobs: [
      ['**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'jsdom'],
      ['**/*.spec.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'jsdom'],
      ['**/*.bench.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'node']
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@backend': path.resolve(__dirname, './backend/src'),
      '@testing': path.resolve(__dirname, './testing')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@testing-library/react']
  },
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __TEST__: true
  }
});
