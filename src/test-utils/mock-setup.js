/**
 * Mock Setup for React Native Testing
 */

// Mock React Native Reanimated
require('react-native-reanimated/lib/reanimated2/jestUtils').setUpTests();

// Mock React Native modules that don't work in Jest environment
if (process.env.NODE_ENV === 'test') {
  global.device = {
    launchApp: jest.fn(),
    reloadReactNative: jest.fn(),
    sendToHome: jest.fn(),
    terminateApp: jest.fn(),
  };

  global.element = jest.fn();
  global.by = {
    id: jest.fn(),
    text: jest.fn(),
    label: jest.fn(),
    type: jest.fn(),
  };

  global.expect = require('expect');
}

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: originalConsole.warn,
  error: originalConsole.error,
};
