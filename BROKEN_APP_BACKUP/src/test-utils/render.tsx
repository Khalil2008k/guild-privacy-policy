// Custom render utilities for testing React Native components

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/I18nProvider';
import AuthProvider from '@/contexts/AuthContext';
import NetworkProvider from '@/contexts/NetworkContext';

// Mock providers for testing
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const MockI18nProvider = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
);

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const MockNetworkProvider = ({ children }: { children: React.ReactNode }) => (
  <NetworkProvider>{children}</NetworkProvider>
);

// All providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockI18nProvider>
      <MockAuthProvider>
        <MockNetworkProvider>
          <MockThemeProvider>
            {children}
          </MockThemeProvider>
        </MockNetworkProvider>
      </MockAuthProvider>
    </MockI18nProvider>
  );
};

// Custom render function with providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Theme-only wrapper for components that only need theme
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => (
  <MockThemeProvider>{children}</MockThemeProvider>
);

const renderWithTheme = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: ThemeWrapper, ...options });

// I18n-only wrapper for components that only need i18n
const I18nWrapper = ({ children }: { children: React.ReactNode }) => (
  <MockI18nProvider>{children}</MockI18nProvider>
);

const renderWithI18n = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: I18nWrapper, ...options });

// Export everything
export * from '@testing-library/react-native';
export { 
  customRender as render,
  renderWithTheme,
  renderWithI18n,
  AllTheProviders,
  ThemeWrapper,
  I18nWrapper
};

// Test utilities for common assertions
export const expectAccessibility = {
  toHaveAccessibilityLabel: (element: any, label: string) => {
    expect(element).toHaveProp('accessibilityLabel', label);
  },
  toHaveAccessibilityRole: (element: any, role: string) => {
    expect(element).toHaveProp('accessibilityRole', role);
  },
  toHaveAccessibilityHint: (element: any, hint: string) => {
    expect(element).toHaveProp('accessibilityHint', hint);
  },
  toBeAccessible: (element: any) => {
    expect(element).toHaveProp('accessible', true);
  },
};

// Mock data generators for tests
export const mockJobData = {
  id: 1,
  title: 'Senior React Native Developer',
  company: 'TechCorp Inc.',
  location: 'New York, NY',
  salary: '$120k - $150k',
  skills: ['React Native', 'TypeScript', 'Node.js', 'GraphQL'],
  category: 'Development',
  description: 'Looking for an experienced React Native developer to join our mobile team.',
  featured: true,
};

export const mockJobsData = [
  mockJobData,
  {
    id: 2,
    title: 'UX/UI Designer',
    company: 'DesignStudio',
    location: 'San Francisco, CA',
    salary: '$90k - $120k',
    skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping'],
    category: 'Design',
    description: 'Creative UX/UI designer needed for innovative mobile app projects.',
    featured: true,
  },
];

export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

// Helper functions for testing
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 100));

export const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  await waitForLoadingToFinish();
  const end = performance.now();
  return end - start;
};

// Accessibility testing utilities
export const checkAccessibilityCompliance = (element: any) => {
  const warnings: string[] = [];
  
  // Check for accessibility label
  if (element.props.accessible && !element.props.accessibilityLabel) {
    warnings.push('Accessible element missing accessibilityLabel');
  }
  
  // Check for button role without onPress
  if (element.props.accessibilityRole === 'button' && !element.props.onPress) {
    warnings.push('Button role without onPress handler');
  }
  
  return warnings;
};
