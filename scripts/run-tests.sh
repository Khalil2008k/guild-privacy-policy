#!/bin/bash

# Comprehensive Chat System Test Runner
# Executes all tests and generates reports

echo "🚀 Starting Comprehensive Chat System Tests..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Running: $test_name${NC}"
    echo "Command: $test_command"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check if Firebase emulators are running
check_emulators() {
    echo -e "\n${YELLOW}Checking Firebase emulators...${NC}"
    
    # Check if Firestore emulator is running
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Firestore emulator is running${NC}"
    else
        echo -e "${RED}❌ Firestore emulator is not running${NC}"
        echo "Please start emulators with: firebase emulators:start"
        exit 1
    fi
    
    # Check if Auth emulator is running
    if curl -s http://localhost:9099 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Auth emulator is running${NC}"
    else
        echo -e "${RED}❌ Auth emulator is not running${NC}"
        exit 1
    fi
    
    # Check if Storage emulator is running
    if curl -s http://localhost:9199 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Storage emulator is running${NC}"
    else
        echo -e "${RED}❌ Storage emulator is not running${NC}"
        exit 1
    fi
}

# Function to setup test environment
setup_test_environment() {
    echo -e "\n${YELLOW}Setting up test environment...${NC}"
    
    # Create test users and chats
    run_test "Create Test Users & Chats" "node scripts/create-test-users.js"
    
    # Deploy rules to emulators
    run_test "Deploy Firestore Rules" "firebase deploy --only firestore:rules --project demo-test"
    run_test "Deploy Storage Rules" "firebase deploy --only storage --project demo-test"
    
    # Deploy indexes
    run_test "Deploy Firestore Indexes" "firebase deploy --only firestore:indexes --project demo-test"
}

# Function to run core functionality tests
run_core_tests() {
    echo -e "\n${YELLOW}Running Core Functionality Tests...${NC}"
    
    # Run comprehensive test suite
    run_test "Comprehensive Chat Test Suite" "node scripts/chat-test-suite.js"
    
    # Run TypeScript type checking
    run_test "TypeScript Type Checking" "npx tsc --noEmit"
    
    # Run ESLint
    run_test "ESLint Code Quality Check" "npx eslint . --max-warnings=0"
}

# Function to run performance tests
run_performance_tests() {
    echo -e "\n${YELLOW}Running Performance Tests...${NC}"
    
    # Test message send latency
    run_test "Message Send Latency Test" "node scripts/performance-tests.js --test=latency"
    
    # Test concurrent users
    run_test "Concurrent Users Test" "node scripts/performance-tests.js --test=concurrent"
    
    # Test memory usage
    run_test "Memory Usage Test" "node scripts/performance-tests.js --test=memory"
}

# Function to run security tests
run_security_tests() {
    echo -e "\n${YELLOW}Running Security Tests...${NC}"
    
    # Test Firestore rules
    run_test "Firestore Rules Security Test" "node scripts/security-tests.js --test=firestore"
    
    # Test Storage rules
    run_test "Storage Rules Security Test" "node scripts/security-tests.js --test=storage"
    
    # Test authentication
    run_test "Authentication Security Test" "node scripts/security-tests.js --test=auth"
}

# Function to generate test report
generate_report() {
    echo -e "\n${YELLOW}Generating Test Report...${NC}"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    echo -e "\n${BLUE}TEST RESULTS SUMMARY${NC}"
    echo "===================="
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo -e "Success Rate: $success_rate%"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! System is ready for production.${NC}"
    else
        echo -e "\n${RED}⚠️ Some tests failed. Review errors and fix before production.${NC}"
    fi
    
    # Save report to file
    cat > test-report.md << EOF
# Chat System Test Report

**Generated:** $(date)
**Total Tests:** $TOTAL_TESTS
**Passed:** $PASSED_TESTS
**Failed:** $FAILED_TESTS
**Success Rate:** $success_rate%

## Test Categories

### Core Functionality
- Chat routing (Local vs Firestore)
- Message sending/receiving
- Media upload (voice/video)
- Real-time features
- Presence system
- Read receipts

### Performance
- Message send latency
- Concurrent users
- Memory usage

### Security
- Firestore rules
- Storage rules
- Authentication

## Recommendations

$(if [ $FAILED_TESTS -eq 0 ]; then echo "✅ All tests passed! System is ready for production."; else echo "⚠️ Some tests failed. Review errors and fix before production."; fi)
EOF
    
    echo -e "\n${GREEN}📊 Test report saved to test-report.md${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Chat System Test Runner${NC}"
    echo "========================"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Please run this script from the project root directory${NC}"
        exit 1
    fi
    
    # Check emulators
    check_emulators
    
    # Setup test environment
    setup_test_environment
    
    # Run tests
    run_core_tests
    run_performance_tests
    run_security_tests
    
    # Generate report
    generate_report
    
    echo -e "\n${BLUE}Test execution completed!${NC}"
}

# Run main function
main "$@"

