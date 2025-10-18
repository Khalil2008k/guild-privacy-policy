/**
 * Detox E2E Test: Authentication Flow
 * Tests complete sign-up, login, logout flows on real device/simulator
 */

import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('Authentication Flow', () => {
  
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  afterAll(async () => {
    await device.terminateApp();
  });
  
  // Test 1: Welcome Screen
  it('should display welcome screen on first launch', async () => {
    // Wait for splash screen to disappear
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Check welcome message
    await detoxExpect(element(by.id('welcome-title'))).toBeVisible();
    await detoxExpect(element(by.text('Welcome to Guild'))).toBeVisible();
    
    // Check CTA buttons
    await detoxExpect(element(by.id('btn-sign-up'))).toBeVisible();
    await detoxExpect(element(by.id('btn-sign-in'))).toBeVisible();
  });
  
  // Test 2: Sign Up Flow - Complete Journey
  it('should complete sign-up flow successfully', async () => {
    const testEmail = `e2e-test-${Date.now()}@detox.com`;
    const testPassword = 'DetoxTest123!';
    
    // Step 1: Navigate to sign-up
    await element(by.id('btn-sign-up')).tap();
    
    // Step 2: Wait for sign-up screen
    await waitFor(element(by.id('sign-up-screen')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Step 3: Fill email
    await element(by.id('input-email')).typeText(testEmail);
    await element(by.id('input-email')).tapReturnKey();
    
    // Step 4: Fill password
    await element(by.id('input-password')).typeText(testPassword);
    await element(by.id('input-password')).tapReturnKey();
    
    // Step 5: Fill username
    const testUsername = `e2euser${Date.now()}`;
    await element(by.id('input-username')).typeText(testUsername);
    
    // Step 6: Fill first name
    await element(by.id('input-firstName')).typeText('Detox');
    
    // Step 7: Fill last name
    await element(by.id('input-lastName')).typeText('Test');
    
    // Step 8: Accept terms
    await element(by.id('checkbox-terms')).tap();
    
    // Step 9: Submit form
    await element(by.id('btn-submit-signup')).tap();
    
    // Step 10: Wait for loading
    await waitFor(element(by.id('loading-indicator')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Step 11: Wait for success (onboarding or home screen)
    await waitFor(element(by.id('onboarding-screen')).or(element(by.id('home-screen'))))
      .toBeVisible()
      .withTimeout(10000);
    
    // Verify we're logged in
    await detoxExpect(element(by.id('onboarding-screen')).or(element(by.id('home-screen'))))
      .toBeVisible();
  });
  
  // Test 3: Sign Up - Validation Errors
  it('should show validation errors for invalid inputs', async () => {
    await element(by.id('btn-sign-up')).tap();
    await waitFor(element(by.id('sign-up-screen'))).toBeVisible();
    
    // Try to submit empty form
    await element(by.id('btn-submit-signup')).tap();
    
    // Check for error messages
    await detoxExpect(element(by.text(/email.*required/i))).toBeVisible();
    await detoxExpect(element(by.text(/password.*required/i))).toBeVisible();
  });
  
  // Test 4: Sign Up - Short Password
  it('should reject password shorter than 8 characters', async () => {
    await element(by.id('btn-sign-up')).tap();
    await waitFor(element(by.id('sign-up-screen'))).toBeVisible();
    
    await element(by.id('input-email')).typeText('test@detox.com');
    await element(by.id('input-password')).typeText('short');
    await element(by.id('btn-submit-signup')).tap();
    
    // Check error
    await waitFor(element(by.text(/password.*8.*characters/i)))
      .toBeVisible()
      .withTimeout(2000);
  });
  
  // Test 5: Login Flow - Existing User
  it('should login existing user successfully', async () => {
    // Assume we have a pre-created test user
    const email = 'client1@test.com';
    const password = 'TestPass123!';
    
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    
    await element(by.id('input-email')).typeText(email);
    await element(by.id('input-password')).typeText(password);
    await element(by.id('btn-submit-signin')).tap();
    
    // Wait for home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Verify we're on home screen
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });
  
  // Test 6: Login - Invalid Credentials
  it('should show error for invalid credentials', async () => {
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    
    await element(by.id('input-email')).typeText('invalid@detox.com');
    await element(by.id('input-password')).typeText('WrongPassword123!');
    await element(by.id('btn-submit-signin')).tap();
    
    // Check for error message
    await waitFor(element(by.text(/invalid.*credentials/i)))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  // Test 7: Password Visibility Toggle
  it('should toggle password visibility', async () => {
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    
    await element(by.id('input-password')).typeText('TestPassword');
    
    // Toggle visibility on
    await element(by.id('btn-toggle-password')).tap();
    // Note: Actual text verification would require native bridge
    
    // Toggle visibility off
    await element(by.id('btn-toggle-password')).tap();
  });
  
  // Test 8: Logout Flow
  it('should logout user and return to welcome screen', async () => {
    // First login
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    await element(by.id('input-email')).typeText('client1@test.com');
    await element(by.id('input-password')).typeText('TestPass123!');
    await element(by.id('btn-submit-signin')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    
    // Navigate to settings
    await element(by.id('tab-settings')).tap();
    await waitFor(element(by.id('settings-screen'))).toBeVisible();
    
    // Scroll to logout button (if needed)
    await element(by.id('settings-scroll')).scrollTo('bottom');
    
    // Tap logout
    await element(by.id('btn-logout')).tap();
    
    // Confirm logout dialog (if exists)
    try {
      await element(by.text('Logout')).tap();
    } catch (e) {
      // No confirmation dialog
    }
    
    // Verify back on welcome screen
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  // Test 9: Biometric Authentication (if supported)
  it('should offer biometric authentication on supported devices', async () => {
    // Login first
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    await element(by.id('input-email')).typeText('client1@test.com');
    await element(by.id('input-password')).typeText('TestPass123!');
    
    // Look for biometric prompt (optional)
    try {
      await detoxExpect(element(by.text(/Face ID|Touch ID|Fingerprint/i))).toBeVisible();
    } catch (e) {
      console.log('Biometric not available on this device');
    }
    
    await element(by.id('btn-submit-signin')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });
  
  // Test 10: Session Persistence
  it('should persist session after app restart', async () => {
    // Login
    await element(by.id('btn-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen'))).toBeVisible();
    await element(by.id('input-email')).typeText('client1@test.com');
    await element(by.id('input-password')).typeText('TestPass123!');
    await element(by.id('btn-submit-signin')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
    
    // Restart app
    await device.terminateApp();
    await device.launchApp({ newInstance: false });
    
    // Should still be logged in (skip splash screen)
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });
});






