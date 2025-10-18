import { render as rtlRender } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import { I18nProvider } from '../../src/contexts/I18nProvider';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { UserProfileProvider } from '../../src/contexts/UserProfileContext';

// Custom render with all providers
export function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <UserProfileProvider>
              {children}
            </UserProfileProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    ),
    ...options,
  });
}

// Mock user factory
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@guild.com',
  displayName: 'Test User',
  phoneNumber: '+97412345678',
  emailVerified: true,
  photoURL: null,
  ...overrides,
});

// Mock job factory
export const createMockJob = (overrides = {}) => ({
  id: 'job-123',
  title: 'Test Job',
  description: 'This is a test job',
  category: 'Development',
  budget: 500,
  currency: 'QR',
  location: 'Doha, Qatar',
  latitude: 25.2854,
  longitude: 51.5310,
  status: 'open',
  postedBy: 'user-123',
  postedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  requiredSkills: ['JavaScript', 'React Native'],
  urgent: false,
  ...overrides,
});

// Mock chat message factory
export const createMockMessage = (overrides = {}) => ({
  id: 'msg-123',
  jobId: 'job-123',
  senderId: 'user-123',
  senderName: 'Test User',
  text: 'Hello, this is a test message',
  timestamp: new Date(),
  read: false,
  type: 'text',
  ...overrides,
});

// Mock transaction factory
export const createMockTransaction = (overrides = {}) => ({
  id: 'txn-123',
  userId: 'user-123',
  amount: 100,
  currency: 'QR',
  type: 'credit',
  status: 'completed',
  description: 'Test transaction',
  timestamp: new Date(),
  jobId: 'job-123',
  ...overrides,
});

// Mock guild factory
export const createMockGuild = (overrides = {}) => ({
  id: 'guild-123',
  name: 'Test Guild',
  description: 'A test guild',
  members: ['user-123'],
  masterId: 'user-123',
  createdAt: new Date(),
  location: 'Doha, Qatar',
  memberCount: 1,
  rating: 4.5,
  ...overrides,
});

// Wait for async operations
export const waitForAsync = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock API response
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Mock API error
export const mockApiError = (message: string, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ message }),
  text: async () => JSON.stringify({ message }),
});

// Generate random ID
export const generateId = () => 
  `test-${Math.random().toString(36).substring(2, 15)}`;

// Re-export everything from testing library
export * from '@testing-library/react-native';



