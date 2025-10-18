# GUILD App - Automated Testing Framework

## Overview
This is a comprehensive, non-destructive testing framework for the GUILD mobile app. It continuously tests all 60+ screens, API endpoints, and handles load testing from 1 to 1000+ concurrent users without modifying any existing app code.

## Features

### ✅ Non-Destructive Testing
- **No code changes required** to your Expo/React Native app
- **Isolated test environment** using mock data and test accounts
- **Firebase testing** with separate test project
- **Safe load testing** that won't impact production users

### ✅ Comprehensive Coverage
- **60+ screen tests** covering all app functionality
- **UI interaction testing** with Detox (taps, swipes, forms)
- **API endpoint testing** with Artillery
- **Firebase integration testing** (auth, firestore, real-time)
- **Load testing** from 1 to 1000+ concurrent users

### ✅ AI-Powered Analysis
- **Automated report generation** using OpenAI GPT-4
- **User-friendly reports** written from a user's perspective
- **Intelligent issue detection** and fix recommendations
- **Performance insights** and bottleneck identification

### ✅ Continuous Testing
- **Runs automatically** every 5 minutes
- **Generates reports** in Markdown format
- **Scalable load testing** with gradual ramp-up
- **Can be stopped/started** independently

## Quick Start

### 1. Navigate to Testing Directory
```bash
cd testing
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional)
Copy `config/test.env` and update with your API keys:
```bash
cp config/test.env .env
# Edit .env with your OpenAI API key and Firebase config
```

### 4. Run Setup (First Time Only)
```bash
node scripts/setup.js
```

### 5. Start Continuous Testing
```bash
# Start all tests (UI + Load + Reports)
node scripts/run-tests.js

# Run only UI tests
npm run test:ui

# Run only load tests
npm run test:load

# Run single user baseline test
npm run test:single-user
```

## Directory Structure

```
testing/
├── detox/                 # UI Testing with Detox
│   ├── e2e/              # Test scripts
│   │   ├── screens/      # Individual screen tests
│   │   └── config.json   # Detox configuration
│   └── helpers/          # Test utilities
├── load/                 # Load Testing with Artillery
│   ├── scenarios/        # Load test scenarios
│   ├── config/          # Artillery configurations
│   ├── data/            # Test data (users, jobs)
│   └── processors/      # Custom processors
├── scripts/             # Main scripts
│   ├── run-tests.js     # Continuous test runner
│   ├── analyze.js       # AI report generator
│   └── setup.js         # One-time setup
├── reports/             # Generated reports
│   ├── functional/      # UI test results
│   ├── load/           # Load test metrics
│   └── analysis/       # AI-generated insights
└── config/             # Configuration files
```

## Test Scenarios

### UI Tests (Detox)
- **Authentication**: Login, signup, phone verification
- **Navigation**: All 60+ screens, tab navigation, modals
- **Forms**: Job posting, applications, profile editing
- **Interactions**: Chat, notifications, settings
- **Edge Cases**: Offline mode, error handling, permissions

### Load Tests (Artillery)
- **Single User**: Baseline performance testing
- **Gradual Load**: 1 → 100 → 1000 users over time
- **Stress Testing**: High load on specific features
- **API Performance**: Direct API endpoint testing

### Test Data
- **1000+ test users** with realistic profiles
- **100 test jobs** across different categories
- **Mock Firebase tokens** for isolated testing
- **Realistic user journeys** for load testing

## Reports

Reports are generated automatically every 5 minutes in `reports/analysis/`

### Report Format
```markdown
# User Testing Report - Cycle 1
**Generated**: 2024-01-15 10:30:00
**Duration**: 5 minutes

## Overview
- Total Screens Tested: 60/60
- Passed: 52 (86.7%)
- Failed: 8 (13.3%)
- Load Test Peak: 1000 concurrent users
- Average Response Time: 342ms

## AI Analysis Summary
The app performed well overall with good user experience...

## Recommendations
- Fix chat screen crash (priority: high)
- Optimize search performance (priority: medium)
- Add error handling for network timeouts
```

## Monitoring

### Real-time Logs
```bash
# View live test logs
tail -f logs/test-runner.log

# View AI analysis logs
tail -f logs/analysis.log
```

### Report Monitoring
```bash
# Check latest reports
ls -la reports/analysis/

# View latest report
cat reports/analysis/cycle-$(ls reports/analysis/ | tail -1)
```

## Troubleshooting

### Common Issues

**UI Tests Failing**
- Check if Android emulator is running
- Ensure app is built: `cd ../src && npx expo run:android`
- Verify test IDs match your app components

**Load Tests Failing**
- Check backend server is running: `cd ../backend && npm run dev`
- Verify API endpoints are accessible
- Check Firebase configuration

**AI Analysis Failing**
- Verify OpenAI API key is set
- Check internet connection
- Review analysis logs: `cat logs/analysis.log`

### Manual Testing

If automated tests fail, you can run individual tests:

```bash
# Test specific scenario
npx artillery run load/scenarios/single-user.yml

# Test specific UI components
npx detox test detox/e2e/screens/auth/login.test.js
```

## Performance Benchmarks

### Target Metrics
- **UI Test Success Rate**: >95%
- **Load Test Response Time**: <500ms (average)
- **Error Rate**: <5% at peak load
- **Firebase Cold Start**: <2 seconds

### Current Performance
- Reports show real-time performance metrics
- AI analysis provides optimization recommendations
- Load testing identifies bottlenecks automatically

## Security

- **Test accounts** use separate Firebase project
- **No production data** accessed during testing
- **Isolated environment** prevents interference
- **Mock tokens** for secure authentication testing

## Stopping Tests

Tests run continuously until stopped:

```bash
# Stop gracefully (recommended)
# Press Ctrl+C in the terminal

# Force stop
killall node
```

## Contributing

To add new tests:

1. **UI Tests**: Add to `detox/e2e/screens/`
2. **Load Tests**: Add to `load/scenarios/`
3. **Test Data**: Add to `load/data/`
4. **Update this README** with new test coverage

## Support

- Check logs: `tail -f logs/test-runner.log`
- Review latest report in `reports/analysis/`
- Manual testing for debugging
- Contact development team for app-specific issues

---
**Note**: This testing framework is completely non-destructive and can be safely removed by deleting the `testing/` directory. All tests run independently of your app code.
