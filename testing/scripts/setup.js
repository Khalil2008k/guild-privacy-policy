/**
 * One-time setup script for GUILD app testing
 * Configures testing environment without modifying app code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '../../');
    this.testingDir = path.join(__dirname, '../');
  }

  async runSetup() {
    console.log('🚀 Setting up automated testing for GUILD app...\n');

    // Check prerequisites
    await this.checkPrerequisites();

    // Create configuration files
    await this.createConfigFiles();

    // Set up test data
    await this.createTestData();

    // Generate additional test scenarios
    await this.generateTestScenarios();

    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. cd testing');
    console.log('2. npm install');
    console.log('3. node scripts/run-tests.js');
    console.log('\n📊 Reports will be generated in testing/reports/ every 5 minutes');
  }

  async checkPrerequisites() {
    console.log('📋 Checking prerequisites...\n');

    const checks = [
      { name: 'Node.js', command: 'node --version', expected: 'v16' },
      { name: 'npm', command: 'npm --version', expected: '8' },
      { name: 'Expo CLI', command: 'npx expo --version', expected: '5' }
    ];

    for (const check of checks) {
      try {
        const result = execSync(check.command, { encoding: 'utf8' }).trim();
        console.log(`✅ ${check.name}: ${result}`);
      } catch (error) {
        console.log(`❌ ${check.name}: Not found`);
        console.log(`   Please install ${check.name} ${check.expected}+`);
      }
    }
  }

  async createConfigFiles() {
    console.log('\n📝 Creating configuration files...\n');

    // Create test environment file
    const testEnvPath = path.join(this.testingDir, 'config', 'test.env');
    const testEnv = `# Test Environment Variables
# Copy this to your .env file if needed

# OpenAI API for AI analysis
OPENAI_API_KEY=your-openai-api-key-here

# Test Firebase Configuration
TEST_FIREBASE_API_KEY=AIzaSy-your-test-api-key
TEST_FIREBASE_AUTH_DOMAIN=guild-testing.firebaseapp.com
TEST_FIREBASE_PROJECT_ID=guild-testing

# Test Database URLs (for isolated testing)
TEST_DATABASE_URL=postgresql://test-user:test-pass@localhost:5432/guild-test
TEST_REDIS_URL=redis://localhost:6379/1

# Load Testing Configuration
LOAD_TEST_API_URL=http://localhost:4000
LOAD_TEST_USERS=1000
LOAD_TEST_DURATION=900

# UI Testing Configuration
UI_TEST_PLATFORM=android
UI_TEST_DEVICE=Pixel_5_API_31
`;

    fs.mkdirSync(path.dirname(testEnvPath), { recursive: true });
    fs.writeFileSync(testEnvPath, testEnv);
    console.log('✅ Created testing environment configuration');

    // Create Jest configuration for Detox
    const jestConfigPath = path.join(this.testingDir, 'detox', 'e2e', 'config.json');
    const jestConfig = {
      "setupFilesAfterEnv": ["<rootDir>/config.js"],
      "testEnvironment": "node",
      "testTimeout": 30000,
      "verbose": true,
      "collectCoverage": false
    };

    fs.mkdirSync(path.dirname(jestConfigPath), { recursive: true });
    fs.writeFileSync(jestConfigPath, JSON.stringify(jestConfig, null, 2));
    console.log('✅ Created Jest configuration');
  }

  async createTestData() {
    console.log('\n📊 Creating test data...\n');

    // Create realistic job data for testing
    const jobsDataPath = path.join(this.testingDir, 'load', 'data', 'jobs.json');
    const jobsData = {
      jobs: Array.from({ length: 100 }, (_, i) => ({
        id: `test-job-${i + 1}`,
        title: `Test Job ${i + 1}`,
        description: `This is a test job for load testing. Job number ${i + 1} of 100.`,
        category: ['Technology', 'Design', 'Marketing', 'Writing'][Math.floor(Math.random() * 4)],
        budget: 100 + Math.floor(Math.random() * 4900),
        duration: `${Math.floor(Math.random() * 30) + 1} days`,
        skills: ['React', 'Node.js', 'TypeScript', 'Python', 'JavaScript'][Math.floor(Math.random() * 5)],
        location: {
          lat: 25.2048 + (Math.random() - 0.5) * 0.1,
          lng: 55.2708 + (Math.random() - 0.5) * 0.1,
          address: `Test Location ${i + 1}, Doha, Qatar`
        }
      }))
    };

    fs.mkdirSync(path.dirname(jobsDataPath), { recursive: true });
    fs.writeFileSync(jobsDataPath, JSON.stringify(jobsData, null, 2));
    console.log('✅ Created test job data');

    // Create realistic user profiles
    const usersDataPath = path.join(this.testingDir, 'load', 'data', 'users.json');
    const usersData = {
      users: Array.from({ length: 1000 }, (_, i) => ({
        id: `test-user-${i + 1}`,
        email: `testuser${i + 1}@guild-testing.app`,
        name: `Test User ${i + 1}`,
        rank: ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'][Math.floor(Math.random() * 10)],
        completedJobs: Math.floor(Math.random() * 50),
        rating: 3.5 + Math.random() * 1.5,
        skills: Array.from({ length: Math.floor(Math.random() * 5) + 1 },
          () => ['React', 'Node.js', 'Python', 'Design', 'Marketing'][Math.floor(Math.random() * 5)])
      }))
    };

    fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 2));
    console.log('✅ Created test user profiles');
  }

  async generateTestScenarios() {
    console.log('\n🎯 Generating additional test scenarios...\n');

    // Create stress test scenario
    const stressTestPath = path.join(this.testingDir, 'load', 'scenarios', 'stress-test.yml');
    const stressTest = `config:
  target: "http://192.168.1.36:4000"
  phases:
    - duration: 300
      arrivalRate: 100
      name: "Stress test - 100 users"
    - duration: 600
      arrivalRate: 100
      rampTo: 500
      name: "Ramp to 500 users"
  processor: "./processors/auth.js"

scenarios:
  - name: "Heavy Firebase Load"
    weight: 50
    flow:
      - loop:
          - post:
              url: "/api/v1/auth/login"
              json:
                email: "stress{{ $randomNumber(1, 1000) }}@test.com"
                password: "testpass123"
          - get:
              url: "/api/v1/jobs"
          - get:
              url: "/api/v1/user/profile"
        count: 10

  - name: "Chat Stress Test"
    weight: 50
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "chat{{ $randomNumber(1, 1000) }}@test.com"
            password: "testpass123"
      - loop:
          - post:
              url: "/api/v1/chat/message"
              headers:
                Authorization: "Bearer {{ authToken }}"
              json:
                conversationId: "stress-chat-{{ $randomNumber(1, 50) }}"
                message: "Stress test message {{ $timestamp }}"
          - think: 0.5
        count: 20`;

    fs.writeFileSync(stressTestPath, stressTest);
    console.log('✅ Created stress test scenario');

    // Create single user test scenario
    const singleUserPath = path.join(this.testingDir, 'load', 'scenarios', 'single-user.yml');
    const singleUser = `config:
  target: "http://192.168.1.36:4000"
  phases:
    - duration: 60
      arrivalRate: 1
      name: "Single user test"

scenarios:
  - name: "Complete User Flow"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@guild.app"
            password: "TestPass123!"
      - get:
          url: "/api/v1/user/profile"
      - get:
          url: "/api/v1/jobs?limit=5"
      - get:
          url: "/api/v1/chat/conversations"
      - post:
          url: "/api/v1/user/profile/update"
          json:
            lastActive: "{{ $timestamp }}"`;

    fs.writeFileSync(singleUserPath, singleUser);
    console.log('✅ Created single user test scenario');

    // Create API performance test
    const apiPerfPath = path.join(this.testingDir, 'load', 'scenarios', 'api-performance.yml');
    const apiPerf = `config:
  target: "http://192.168.1.36:4000"
  phases:
    - duration: 300
      arrivalRate: 50
      name: "API Performance Test"

scenarios:
  - name: "Jobs API Test"
    weight: 40
    flow:
      - get:
          url: "/api/v1/jobs"
      - get:
          url: "/api/v1/jobs?category=Technology"
      - get:
          url: "/api/v1/jobs?limit=50"

  - name: "Chat API Test"
    weight: 30
    flow:
      - get:
          url: "/api/v1/chat/conversations"
      - post:
          url: "/api/v1/chat/message"
          json:
            conversationId: "perf-test"
            message: "Performance test"

  - name: "User API Test"
    weight: 30
    flow:
      - get:
          url: "/api/v1/user/profile"
      - get:
          url: "/api/v1/user/stats"`;

    fs.writeFileSync(apiPerfPath, apiPerf);
    console.log('✅ Created API performance test scenario');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TestSetup();
  setup.runSetup().catch(console.error);
}

module.exports = TestSetup;
