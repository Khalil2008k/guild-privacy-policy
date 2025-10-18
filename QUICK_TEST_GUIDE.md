# 🚀 Quick Test Guide - Guild Platform

**Last Updated:** October 4, 2025  
**Status:** Configuration fixes needed before full test execution

---

## ⚡ Quick Start (5 Minutes)

### 1. Fix Configurations (Required First)

```bash
# Navigate to project root
cd GUILD-3

# Fix Frontend
npm install --save-dev jest-expo react-test-renderer @testing-library/react-native

# Fix Backend
cd backend
# Edit jest.config.js and remove/comment out the globalSetup line
npm install

# Fix Admin Portal
cd ../admin-portal
npm install --save-dev typescript
npm install

# Return to root
cd ..
```

### 2. Run All Tests

```bash
# Run comprehensive Firebase-integrated tests
node run-comprehensive-firebase-tests.js

# Or run individual component tests
npm run test:mobile    # Frontend tests
npm run test:backend   # Backend tests
npm run test:admin     # Admin portal tests
```

### 3. View Results

```bash
# Test report location
cat test-reports/firebase-test-report-*.md

# Or open in browser
start test-reports/firebase-test-report-*.md
```

---

## 📋 Test Commands Reference

### Frontend (Mobile App)
```bash
cd GUILD-3

# Run all frontend tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx jest src/app/(auth)/__tests__/sign-in.test.tsx

# Run in watch mode
npm run test:watch
```

### Backend
```bash
cd GUILD-3/backend

# Run all backend tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npx jest src/services/__tests__/UserService.test.ts
```

### Admin Portal
```bash
cd GUILD-3/admin-portal

# Run all admin tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- BackendMonitor.test.tsx
```

### E2E Tests
```bash
cd GUILD-3

# Run Cypress E2E tests
npm run cypress:run

# Open Cypress UI
npm run cypress:open

# Run Playwright tests
npm run test:playwright
```

---

## 🔥 Firebase-Specific Tests

### Test Firebase Auth
```bash
# Frontend Auth tests
npx jest src/app/(auth)/__tests__/

# Backend Auth tests
cd backend && npx jest src/routes/__tests__/auth.test.ts
```

### Test Firestore Integration
```bash
# Test Firestore real-time listeners
npx jest --testNamePattern="Firestore"

# Test Firestore security rules
firebase emulators:exec --only firestore "npm test"
```

### Test Firebase Storage
```bash
# Test file uploads
npx jest --testNamePattern="Storage"

# Test with Firebase emulator
firebase emulators:exec --only storage "npm test"
```

### Test Cloud Functions
```bash
cd backend

# Test Cloud Functions locally
npm run test:functions

# Deploy and test
firebase deploy --only functions
```

---

## 📊 Test Reports

### Generated Reports
- **Location:** `GUILD-3/test-reports/`
- **Format:** Markdown (.md)
- **Naming:** `firebase-test-report-[timestamp].md`

### View Latest Report
```bash
# Windows
start test-reports\firebase-test-report-*.md

# Mac/Linux
open test-reports/firebase-test-report-*.md

# Or use cat
cat test-reports/firebase-test-report-*.md
```

---

## 🐛 Troubleshooting

### Issue: "jest not found"
```bash
npm install --save-dev jest
```

### Issue: "react-native preset not found"
```bash
npm install --save-dev jest-expo
```

### Issue: "Cannot find module 'typescript'"
```bash
cd admin-portal
npm install --save-dev typescript
```

### Issue: "Firebase not initialized"
```bash
# Check Firebase config
cat src/config/firebase.tsx

# Verify environment variables
cat .env
```

### Issue: "Tests timing out"
```bash
# Increase timeout in jest.config.js
testTimeout: 30000  # 30 seconds
```

---

## 📈 Coverage Reports

### Generate Coverage
```bash
# Frontend
npm run test:coverage

# Backend
cd backend && npm run test:coverage

# Admin Portal
cd admin-portal && npm test -- --coverage
```

### View Coverage
```bash
# Open HTML report
start coverage/lcov-report/index.html

# Or view summary
cat coverage/coverage-summary.json
```

### Coverage Targets
- **Lines:** 90%
- **Functions:** 85%
- **Branches:** 85%
- **Statements:** 90%

---

## 🔍 Test Debugging

### Run Single Test
```bash
# Frontend
npx jest src/app/(auth)/__tests__/sign-in.test.tsx

# Backend
cd backend && npx jest src/services/__tests__/UserService.test.ts

# Admin Portal
cd admin-portal && npm test -- BackendMonitor.test.tsx
```

### Debug with VS Code
1. Add breakpoint in test file
2. Press F5 or Run > Start Debugging
3. Select "Jest" configuration

### Debug with Chrome DevTools
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```
Then open `chrome://inspect` in Chrome

---

## 🚀 CI/CD Integration

### Run in CI Mode
```bash
npm run test:ci
```

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:ci
```

### GitLab CI
```yaml
test:
  script:
    - npm install
    - npm run test:ci
```

---

## 📝 Test File Locations

### Frontend Tests
```
src/
├── app/
│   ├── (auth)/__tests__/
│   │   └── sign-in.test.tsx
│   └── (main)/__tests__/
│       └── home.test.tsx
├── components/__tests__/
│   └── Button.test.tsx
├── services/__tests__/
│   └── apiGateway.test.ts
└── utils/__tests__/
    └── validation.test.ts
```

### Backend Tests
```
backend/src/
├── services/__tests__/
│   ├── UserService.test.ts
│   └── JobService.test.ts
├── routes/__tests__/
│   └── auth.test.ts
└── __tests__/
    └── middleware/
        └── auth.test.ts
```

### Admin Portal Tests
```
admin-portal/src/
├── pages/__tests__/
│   └── BackendMonitor.test.tsx
└── e2e/
    └── backend-monitor.spec.ts
```

---

## 🎯 Test Checklist

### Before Running Tests
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase config set up (`.env` file)
- [ ] Jest configuration fixed
- [ ] TypeScript dependencies installed

### After Running Tests
- [ ] All tests passing
- [ ] Coverage meets thresholds (90% lines, 85% functions)
- [ ] No console errors or warnings
- [ ] Test report generated

### Before Production
- [ ] All tests passing in CI/CD
- [ ] Firebase security rules tested
- [ ] Load testing completed (1k+ RPS)
- [ ] E2E tests passing
- [ ] Accessibility tests passing (WCAG 2.2 AA)

---

## 📞 Quick Help

### Test Not Running?
1. Check dependencies: `npm install`
2. Check Jest config: `cat jest.config.js`
3. Check test file exists: `ls -la src/**/*.test.*`

### Test Failing?
1. Read error message carefully
2. Check Firebase connection
3. Verify test data/mocks
4. Check for async issues (add `await`)

### Need More Info?
- **Full Testing Guide:** `COMPREHENSIVE_UI_UX_DOCUMENTATION.md` (Lines 506-1064)
- **Execution Summary:** `FIREBASE_TESTING_EXECUTION_SUMMARY.md`
- **Test Report:** `test-reports/firebase-test-report-*.md`

---

## 🔗 Useful Links

- **Firebase Console:** https://console.firebase.google.com
- **Firebase Documentation:** https://firebase.google.com/docs
- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **Testing Library:** https://testing-library.com/docs/react-native-testing-library/intro

---

**Quick Reference Card - Keep this handy for daily testing!** 📌





