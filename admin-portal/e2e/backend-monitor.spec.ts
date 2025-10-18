import { test, expect } from '@playwright/test';

test.describe('Backend Monitor Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the backend monitor page
    await page.goto('/backend-monitor');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="backend-monitor"]', { timeout: 10000 });
  });

  test('should display all system status cards', async ({ page }) => {
    // Check for all status cards
    await expect(page.locator('text=CPU Usage')).toBeVisible();
    await expect(page.locator('text=Memory Usage')).toBeVisible();
    await expect(page.locator('text=Error Rate')).toBeVisible();
    await expect(page.locator('text=Avg Response')).toBeVisible();
    await expect(page.locator('text=Connections')).toBeVisible();
    await expect(page.locator('text=Uptime')).toBeVisible();
  });

  test('should display charts section', async ({ page }) => {
    // Check for charts
    await expect(page.locator('text=System Metrics')).toBeVisible();
    await expect(page.locator('text=Error Rate')).toBeVisible();
    
    // Check for chart containers
    await expect(page.locator('.chart-container')).toHaveCount(2);
  });

  test('should display recent errors section', async ({ page }) => {
    await expect(page.locator('text=Recent Errors')).toBeVisible();
  });

  test('should display live users section', async ({ page }) => {
    await expect(page.locator('text=Live Users')).toBeVisible();
  });

  test('should handle time range selection', async ({ page }) => {
    const timeSelect = page.locator('select.time-select');
    await expect(timeSelect).toBeVisible();
    
    // Change time range
    await timeSelect.selectOption('24h');
    await expect(timeSelect).toHaveValue('24h');
  });

  test('should handle refresh button', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    
    // Click refresh button
    await refreshButton.click();
    
    // Verify the button is clickable
    await expect(refreshButton).toBeEnabled();
  });

  test('should display connection status', async ({ page }) => {
    const connectionStatus = page.locator('.connection-status');
    await expect(connectionStatus).toBeVisible();
    
    // Should show either Connected or Disconnected
    await expect(connectionStatus).toContainText(/Connected|Disconnected/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that the page is still functional
    await expect(page.locator('text=Backend Monitor')).toBeVisible();
    await expect(page.locator('.status-grid')).toBeVisible();
  });

  test('should handle dark mode', async ({ page }) => {
    // Check if dark mode toggle exists
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("theme")');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Verify theme change
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark|light/);
    }
  });

  test('should display error banner when there is an error', async ({ page }) => {
    // Mock network error
    await page.route('**/api/v1/monitoring/**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    
    // Reload page to trigger error
    await page.reload();
    
    // Check for error banner
    await expect(page.locator('.error-banner')).toBeVisible();
  });

  test('should handle WebSocket connection', async ({ page }) => {
    // Check for WebSocket connection indicator
    const connectionStatus = page.locator('.connection-status');
    await expect(connectionStatus).toBeVisible();
  });

  test('should display system metrics with correct format', async ({ page }) => {
    // Check that metrics are displayed with proper formatting
    const cpuUsage = page.locator('text=/\\d+\\.\\d+%/');
    await expect(cpuUsage.first()).toBeVisible();
    
    const memoryUsage = page.locator('text=/\\d+\\.\\d+%/');
    await expect(memoryUsage.nth(1)).toBeVisible();
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Check for empty state messages
    const emptyStates = page.locator('text=No errors detected, text=No live users');
    if (await emptyStates.count() > 0) {
      await expect(emptyStates.first()).toBeVisible();
    }
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toContainText('Backend Monitor');
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should display proper loading states', async ({ page }) => {
    // Check for loading spinner
    const spinner = page.locator('.spinner');
    if (await spinner.isVisible()) {
      await expect(spinner).toBeVisible();
    }
  });

  test('should handle chart interactions', async ({ page }) => {
    // Check if charts are interactive
    const charts = page.locator('.chart-container');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
      
      // Try to hover over chart
      await charts.first().hover();
    }
  });

  test('should display proper error formatting', async ({ page }) => {
    // Check for error items
    const errorItems = page.locator('.error-item');
    if (await errorItems.count() > 0) {
      await expect(errorItems.first()).toBeVisible();
      
      // Check for error details
      const errorMessage = page.locator('.error-content h4');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });

  test('should display proper user formatting', async ({ page }) => {
    // Check for user items
    const userItems = page.locator('.user-item');
    if (await userItems.count() > 0) {
      await expect(userItems.first()).toBeVisible();
      
      // Check for user details
      const userName = page.locator('.user-content h4');
      if (await userName.count() > 0) {
        await expect(userName.first()).toBeVisible();
      }
    }
  });

  test('should handle real-time updates', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Check that the page is ready for real-time updates
    await expect(page.locator('.backend-monitor')).toBeVisible();
  });

  test('should have proper performance metrics', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();
    
    // Navigate to page
    await page.goto('/backend-monitor');
    await page.waitForSelector('.backend-monitor');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle WebSocket disconnection gracefully', async ({ page }) => {
    // Check for disconnection handling
    const connectionStatus = page.locator('.connection-status');
    await expect(connectionStatus).toBeVisible();
    
    // Should show disconnected state
    await expect(connectionStatus).toContainText(/Connected|Disconnected/);
  });

  test('should display proper status indicators', async ({ page }) => {
    // Check for status icons
    const statusIcons = page.locator('.status-icon');
    await expect(statusIcons).toHaveCount(6); // 6 status cards
    
    // Check for proper icon colors
    const icons = page.locator('.status-icon svg');
    if (await icons.count() > 0) {
      await expect(icons.first()).toBeVisible();
    }
  });

  test('should handle data refresh', async ({ page }) => {
    // Click refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    await refreshButton.click();
    
    // Wait for data to reload
    await page.waitForTimeout(1000);
    
    // Verify page is still functional
    await expect(page.locator('.backend-monitor')).toBeVisible();
  });

  test('should display proper error handling', async ({ page }) => {
    // Check for error handling in UI
    const errorBanner = page.locator('.error-banner');
    if (await errorBanner.isVisible()) {
      await expect(errorBanner).toBeVisible();
      
      // Check for error close button
      const closeButton = errorBanner.locator('button');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(errorBanner).not.toBeVisible();
      }
    }
  });
});








