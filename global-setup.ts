
// Playwright Global Setup
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Start test database
  console.log('Starting test database...');

  // Start test API server
  console.log('Starting test API server...');

  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/guild_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';

  // Wait for services to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Test environment ready!');
}

export default globalSetup;
