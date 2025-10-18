
// Vitest Setup with Advanced Testing Utilities
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Setup and teardown
beforeAll(async () => {
  // Start MSW server for API mocking
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(async () => {
  // Clean up MSW server
  server.close();
});

beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Clear local storage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset fetch mock
  global.fetch = vi.fn();
});

afterEach(() => {
  // Clean up after each test
  cleanup();

  // Reset local storage
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Custom test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date(),
  ...overrides,
});

export const createMockJob = (overrides = {}) => ({
  id: 'job-123',
  title: 'Test Job',
  description: 'Test job description',
  budget: 5000,
  skills: ['JavaScript', 'React'],
  status: 'open',
  createdAt: new Date(),
  ...overrides,
});

export const waitForLoading = async () => {
  // Wait for loading states to complete
  await new Promise(resolve => setTimeout(resolve, 100));
};

export const mockAPIResponse = (data: any, delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<any> | any) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  return {
    result,
    duration: end - start,
    memory: (performance as any).memory?.usedJSHeapSize || 0
  };
};

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  // Basic accessibility checks
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const images = container.querySelectorAll('img');
  const buttons = container.querySelectorAll('button, [role="button"]');
  const links = container.querySelectorAll('a');
  const forms = container.querySelectorAll('form');
  const inputs = container.querySelectorAll('input, textarea, select');

  return {
    headings: headings.length,
    images: images.length,
    imagesWithAlt: Array.from(images).filter(img => img.hasAttribute('alt')).length,
    buttons: buttons.length,
    links: links.length,
    forms: forms.length,
    inputs: inputs.length,
    inputsWithLabels: Array.from(inputs).filter(input => {
      const label = container.querySelector(`label[for="${input.id}"]`);
      return label || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    }).length
  };
};

// Custom matchers
expect.extend({
  toBeAccessible(received) {
    const accessibility = checkAccessibility(received);
    const pass = accessibility.images === accessibility.imagesWithAlt &&
                 accessibility.inputs === accessibility.inputsWithLabels;

    if (pass) {
      return {
        message: () => 'Expected component to be accessible',
        pass: true,
      };
    } else {
      return {
        message: () => `Expected component to be accessible, but found issues: ${JSON.stringify(accessibility)}`,
        pass: false,
      };
    }
  },
});

// Global test configuration
global.testUtils = {
  createMockUser,
  createMockJob,
  waitForLoading,
  mockAPIResponse,
  measurePerformance,
  checkAccessibility,
};
