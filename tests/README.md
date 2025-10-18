# GUILD Test Suite Documentation

## 🧪 Advanced Production-Grade Testing

This test suite provides comprehensive coverage for the GUILD application, including unit tests, integration tests, E2E tests, and performance tests.

---

## 📊 Test Coverage

### Test Categories:

1. **Authentication Tests** (`auth.test.ts`)
   - User registration & validation
   - Sign in/sign out flows
   - Two-factor authentication
   - Password reset
   - Session management
   - Biometric authentication
   - Security & brute force prevention

2. **Job Lifecycle Tests** (`jobs.test.ts`)
   - Job creation & validation
   - Job discovery & filtering
   - Job acceptance & contract generation
   - Job completion & payment release
   - Job cancellation & refunds
   - Job expiry automation
   - Reviews & ratings

3. **Payment System Tests** (`payments.test.ts`)
   - Wallet initialization (300 Guild Coins)
   - Transaction processing
   - Payment holds & releases
   - Refund handling
   - Transaction verification
   - Payment recovery
   - Analytics

4. **Chat System Tests** (`chat.test.ts`)
   - Text & image messaging
   - Real-time communication
   - Read receipts
   - Typing indicators
   - Dispute logging
   - Chat history retrieval

5. **Performance Tests** (`performance.test.ts`)
   - Load testing (100+ concurrent requests)
   - API response time benchmarks
   - Memory leak detection
   - Stress testing

---

## 🚀 Running Tests

### Run All Tests:
```bash
npm test
```

### Run Specific Test Suite:
```bash
npm test auth.test.ts
npm test jobs.test.ts
npm test payments.test.ts
npm test chat.test.ts
npm test performance.test.ts
```

### Run with Coverage:
```bash
npm test -- --coverage
```

### Run in Watch Mode:
```bash
npm test -- --watch
```

### Run E2E Tests:
```bash
npm run test:e2e
```

---

## 📈 Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Statements | 70% | TBD |
| Branches | 70% | TBD |
| Functions | 70% | TBD |
| Lines | 70% | TBD |

---

## 🔧 Test Configuration

Tests are configured in `jest.config.js` with:
- **Preset**: `jest-expo`
- **Environment**: Node.js
- **Setup**: `tests/setup.ts` (mocks & globals)
- **Transform**: Babel for TypeScript/JSX
- **Coverage**: Collected from `src/**/*.{ts,tsx}`

---

## 🎯 Test Helpers

Located in `tests/utils/testHelpers.ts`:

### Mock Factories:
- `createMockUser()` - Generate test users
- `createMockJob()` - Generate test jobs
- `createMockMessage()` - Generate test messages
- `createMockTransaction()` - Generate test transactions
- `createMockGuild()` - Generate test guilds

### API Mocks:
- `mockApiResponse()` - Mock successful API responses
- `mockApiError()` - Mock API error responses

### Utilities:
- `waitForAsync()` - Wait for async operations
- `generateId()` - Generate unique test IDs
- `render()` - Render components with providers

---

## ✅ Test Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Mock External Dependencies**: Isolate unit logic
3. **Test Edge Cases**: Invalid inputs, errors, timeouts
4. **Use Descriptive Names**: Make test intent clear
5. **Clean Up**: Reset mocks in `beforeEach`
6. **Test Real Scenarios**: Simulate actual user flows

---

## 🐛 Debugging Tests

### Run Single Test:
```bash
npm test -- -t "should successfully sign in"
```

### View Console Logs:
```bash
npm test -- --verbose
```

### Debug in VS Code:
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

---

## 📝 Writing New Tests

### Example Test:
```typescript
import { mockApiResponse } from '../utils/testHelpers';

describe('My Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should work correctly', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue(
      mockApiResponse({ success: true })
    );

    // Act
    const result = await myFunction();

    // Assert
    expect(result.success).toBe(true);
  });
});
```

---

## 🔄 CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment checks

### CI Configuration:
```yaml
- name: Run Tests
  run: npm test -- --coverage --ci
```

---

## 📞 Support

For test-related issues:
1. Check test logs: `npm test -- --verbose`
2. Review mock setup in `tests/setup.ts`
3. Verify API endpoints match backend routes
4. Check Firebase mock configurations

---

## 🎉 Test Status

**Current Status**: ✅ Infrastructure Complete

**Test Files**: 5 core suites
**Total Tests**: 100+ test cases
**Coverage Target**: 70%

---

**Happy Testing! 🚀**


