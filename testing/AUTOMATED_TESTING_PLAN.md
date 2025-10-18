# Automated Testing Plan for GUILD App
## Non-Destructive Testing Strategy

### Overview
This testing framework will run alongside your existing app without modifying any source code. All tests are isolated and can be stopped/started independently.

## 1. Testing Architecture

### Tools Selection
- **UI/Functional Testing**: Detox (for React Native)
- **Load Testing**: Artillery.io
- **Monitoring**: Winston + Custom reporters
- **AI Analysis**: OpenAI API for report generation
- **Continuous Testing**: GitHub Actions / Local Node scripts

### Directory Structure
```
GUILD/
├── src/                    # Your existing app (untouched)
├── backend/                # Your existing backend (untouched)
└── testing/               # New testing directory
    ├── detox/
    │   ├── e2e/           # UI test scripts
    │   ├── config.json    # Detox configuration
    │   └── helpers/       # Test utilities
    ├── load/
    │   ├── scenarios/     # Load test scenarios
    │   ├── config/        # Artillery configs
    │   └── data/          # Test data
    ├── reports/
    │   ├── functional/    # UI test reports
    │   ├── load/          # Load test reports
    │   └── analysis/      # AI-generated insights
    ├── scripts/
    │   ├── run-tests.js   # Main test runner
    │   ├── analyze.js     # AI report generator
    │   └── monitor.js     # Continuous monitoring
    └── config/
        ├── test.env       # Test environment vars
        └── firebase-test.json # Test Firebase config
```

## 2. Setup Instructions

### Step 1: Install Testing Dependencies
```bash
# Navigate to testing directory
cd testing

# Initialize package.json
npm init -y

# Install Detox for UI testing
npm install --save-dev detox @types/detox jest

# Install Artillery for load testing
npm install --save-dev artillery artillery-plugin-expect

# Install utilities
npm install --save-dev winston dotenv openai axios
```

### Step 2: Configure Detox
Create `testing/detox/config.json`:
```json
{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "apps": {
    "ios": {
      "type": "ios.app",
      "binaryPath": "../ios/build/Build/Products/Debug-iphonesimulator/GUILD.app"
    },
    "android": {
      "type": "android.apk",
      "binaryPath": "../android/app/build/outputs/apk/debug/app-debug.apk"
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 14"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_5_API_31"
      }
    }
  },
  "configurations": {
    "ios": {
      "device": "simulator",
      "app": "ios"
    },
    "android": {
      "device": "emulator",
      "app": "android"
    }
  }
}
```

## 3. Sample Test Scripts

### UI Test Example (Login Screen)
`testing/detox/e2e/auth/login.test.js`:
```javascript
describe('Login Screen Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen elements', async () => {
    // Check if login screen is visible
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    // Type credentials
    await element(by.id('email-input')).typeText('test@guild.app');
    await element(by.id('password-input')).typeText('Test123!');
    
    // Tap login button
    await element(by.id('login-button')).tap();
    
    // Wait for navigation
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Verify Firebase auth state
    await expect(element(by.text('Welcome back!'))).toBeVisible();
  });

  it('should show error on invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@email.com');
    await element(by.id('password-input')).typeText('wrongpass');
    await element(by.id('login-button')).tap();
    
    // Check for error message
    await waitFor(element(by.text('Invalid credentials')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

### Load Test Example
`testing/load/scenarios/user-journey.yml`:
```yaml
config:
  target: "http://192.168.1.36:4000"
  phases:
    - duration: 60
      arrivalRate: 1
      name: "Single user warm-up"
    - duration: 300
      arrivalRate: 10
      rampTo: 100
      name: "Ramp to 100 users"
    - duration: 600
      arrivalRate: 100
      rampTo: 1000
      name: "Scale to 1000 users"
  processor: "./processors/auth.js"
  payload:
    path: "./data/users.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "Complete User Journey"
    weight: 70
    flow:
      # Login
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.token"
              as: "authToken"
      
      # Get profile
      - get:
          url: "/api/v1/user/profile"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      # Browse jobs
      - get:
          url: "/api/v1/jobs?limit=10"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      # Submit application
      - post:
          url: "/api/v1/jobs/apply"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            jobId: "test-job-{{ $randomNumber(1, 100) }}"
            coverLetter: "I am interested in this position"
      
      # Firebase interaction
      - think: 2
      - get:
          url: "/api/v1/chat/messages"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Heavy Firebase Load"
    weight: 30
    flow:
      - loop:
        - post:
            url: "/api/v1/auth/login"
            json:
              email: "load{{ $randomNumber(1, 1000) }}@test.com"
              password: "testpass123"
        - think: 1
        count: 5
```

## 4. Cursor Prompts for Test Generation

### Prompt 1: Generate UI Test
```
"Write a Detox test for the GUILD app's job posting screen that:
1. Navigates from home to job posting
2. Fills in job title, description, and price
3. Selects a category
4. Taps submit button
5. Verifies the job appears in Firebase and redirects to job list
Include proper waits and error handling"
```

### Prompt 2: Generate Load Test
```
"Create an Artillery load test script that simulates 1000 concurrent users on the GUILD app:
1. Each user logs in with Firebase auth
2. Browses 3-5 job listings
3. Opens 2 chat conversations
4. Sends 1-3 messages
5. Updates their profile
Include gradual ramp-up from 1 to 1000 users over 15 minutes"
```

### Prompt 3: Fix Failed Test
```
"Analyze this Detox test failure:
[paste error log]
The test is trying to tap a button that's not visible. Update the test to:
1. Scroll to the element if needed
2. Wait for animations to complete
3. Add retry logic
4. Include better error messages"
```

## 5. Continuous Test Runner
`testing/scripts/run-tests.js`:
```javascript
const { spawn } = require('child_process');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

class ContinuousTestRunner {
  constructor() {
    this.isRunning = true;
    this.cycle = 1;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'test-runner.log' }),
        new winston.transports.Console()
      ]
    });
  }

  async runUITests() {
    return new Promise((resolve) => {
      const detox = spawn('detox', ['test', '-c', 'android'], {
        cwd: path.join(__dirname, '../detox')
      });

      let output = '';
      detox.stdout.on('data', (data) => {
        output += data.toString();
      });

      detox.on('close', (code) => {
        resolve({ success: code === 0, output });
      });
    });
  }

  async runLoadTests() {
    return new Promise((resolve) => {
      const artillery = spawn('artillery', [
        'run',
        'scenarios/user-journey.yml',
        '-o',
        `reports/load/cycle-${this.cycle}.json`
      ], {
        cwd: path.join(__dirname, '../load')
      });

      artillery.on('close', (code) => {
        resolve({ success: code === 0 });
      });
    });
  }

  async generateReport() {
    // Call AI analysis script
    const analyze = spawn('node', ['analyze.js', this.cycle], {
      cwd: path.join(__dirname)
    });

    return new Promise((resolve) => {
      analyze.on('close', () => resolve());
    });
  }

  async runCycle() {
    this.logger.info(`Starting test cycle ${this.cycle}`);

    // Run UI tests
    const uiResults = await this.runUITests();
    this.logger.info(`UI tests completed: ${uiResults.success ? 'PASSED' : 'FAILED'}`);

    // Run load tests
    const loadResults = await this.runLoadTests();
    this.logger.info(`Load tests completed: ${loadResults.success ? 'PASSED' : 'FAILED'}`);

    // Generate report
    await this.generateReport();
    this.logger.info(`Report generated for cycle ${this.cycle}`);

    this.cycle++;
  }

  async start() {
    while (this.isRunning) {
      await this.runCycle();
      
      // Wait 5 minutes before next cycle
      await new Promise(resolve => setTimeout(resolve, 300000));
    }
  }

  stop() {
    this.isRunning = false;
    this.logger.info('Test runner stopped');
  }
}

// Start continuous testing
const runner = new ContinuousTestRunner();
runner.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  runner.stop();
  process.exit(0);
});
```

## 6. Sample Report Template

`testing/reports/template.md`:
```markdown
# User Testing Report - Cycle [N]
**Generated**: [timestamp]
**Duration**: [duration]

## Overview
- **Total Screens Tested**: 60/60
- **Passed**: 52 (86.7%)
- **Failed**: 8 (13.3%)
- **Load Test Peak**: 1000 concurrent users
- **Average Response Time**: 342ms

## Detailed Results

### ✅ Working Features

#### Screen 1: Login Screen
- **Test**: Tapped email field → Keyboard appeared ✓
- **Test**: Entered "test@guild.app" → Text displayed correctly ✓
- **Test**: Tapped login button → Firebase auth successful ✓
- **Navigation**: Redirected to home screen in 1.2s ✓

#### Screen 3: Job Listing
- **Test**: Scrolled through 50 jobs → Smooth performance ✓
- **Test**: Tapped job card → Details loaded from Firebase ✓
- **Test**: Applied filters → Results updated in 0.8s ✓

### ❌ Failed Tests

#### Screen 42: Chat Screen
- **Test**: Tapped send button → App crashed
- **Error**: `TypeError: Cannot read property 'uid' of null`
- **Recommendation**: Check Firebase auth state before sending message
- **Suggested Fix**: Add null check in `ChatService.sendMessage()`

#### Screen 15: Search Function
- **Test**: Searched for "developer" → Timeout after 30s
- **Error**: Firebase query took too long (>30s)
- **Recommendation**: 
  - Add pagination to search results
  - Create Firebase index for 'title' field
  - Implement client-side caching

## Load Test Metrics

### User Scaling Results
| Users | Success Rate | Avg Response | 95th Percentile | Errors |
|-------|-------------|--------------|-----------------|--------|
| 1     | 100%        | 125ms        | 150ms           | 0      |
| 100   | 99.2%       | 342ms        | 580ms           | 12     |
| 1000  | 94.5%       | 1250ms       | 3200ms          | 234    |

### Bottlenecks Identified
1. **Firebase Cold Starts**: 18% of requests >2s when scaling
2. **Express.js Memory**: RSS exceeded 1GB at 800 users
3. **Chat WebSocket**: Connection drops at >500 concurrent

## Recommendations

### Immediate Fixes
1. **Chat Crash**: Add auth validation before message operations
2. **Search Timeout**: Implement Firebase composite indexes
3. **Memory Leak**: Review Express middleware for request cleanup

### Performance Optimizations
1. **Firebase**: Enable offline persistence for frequently accessed data
2. **API Gateway**: Implement Redis caching for job listings
3. **Load Balancer**: Consider horizontal scaling at >500 users

### Next Test Cycle
- Focus on payment flow (high failure rate)
- Add geolocation permission tests
- Stress test image upload with 100MB files

---
*This report was generated automatically. Do not stop testing.*
```

## 7. Running Instructions

### Start Testing
```bash
cd testing
npm install
node scripts/run-tests.js
```

### Monitor Progress
```bash
tail -f testing/test-runner.log
```

### Stop Testing
Press `Ctrl+C` in the terminal running tests

### View Reports
Reports are generated in `testing/reports/` every 5 minutes
