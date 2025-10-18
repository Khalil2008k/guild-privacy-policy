
// Cypress Support with Advanced Commands and Utilities
import '@testing-library/cypress/add-commands';
import 'cypress-real-events/support';

// Custom command for mobile viewport
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport('iphone-6');
});

// Custom command for desktop viewport
Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720);
});

// Custom command for waiting for API response
Cypress.Commands.add('waitForAPI', (url, method = 'GET') => {
  cy.intercept(method, url).as('apiCall');
  cy.wait('@apiCall');
});

// Custom command for authentication
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
  });
});

// Custom command for accessibility testing
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Custom command for performance testing
Cypress.Commands.add('measurePerformance', (label) => {
  cy.window().then((win) => {
    const perfData = win.performance.getEntriesByType('navigation')[0];
    cy.task('log', `${label} Performance: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
  });
});

// Global error handler
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false;
});

// Before each test
beforeEach(() => {
  // Clear local storage and cookies
  cy.clearLocalStorage();
  cy.clearCookies();

  // Set up viewport for mobile-first testing
  cy.setMobileViewport();
});
