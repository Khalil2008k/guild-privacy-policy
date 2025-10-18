#!/bin/bash

#####################################################################################################
# GUILD PLATFORM - COMPREHENSIVE TEST SUITE (150+ Tests)
# Run all phases: General, API, UX/Flow
#
# Usage: ./run-all-tests.sh [phase]
# Examples:
#   ./run-all-tests.sh           # Run all phases
#   ./run-all-tests.sh phase1    # Run only Phase 1
#   ./run-all-tests.sh quick     # Run quick checks only
#####################################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                               ║"
echo "║                    GUILD PLATFORM - TEST SUITE                                ║"
echo "║                         150+ Comprehensive Tests                              ║"
echo "║                                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check dependencies
echo -e "${BLUE}📦 Checking dependencies...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js not installed${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm not installed${NC}"; exit 1; }

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo -e "${GREEN}✅ npm $(npm -v)${NC}"
echo ""

# Check if backend is running
echo -e "${BLUE}🔍 Checking backend status...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health | grep -q "200"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not running - some tests will be skipped${NC}"
    echo -e "${YELLOW}   Start with: cd backend && npm run dev${NC}"
fi
echo ""

# Function to run phase
run_phase() {
    local phase=$1
    local test_file=$2
    local description=$3
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}▶️  $phase: $description${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    if [ -f "$test_file" ]; then
        echo -e "${YELLOW}Running $test_file...${NC}"
        
        if npm test -- "$test_file" --verbose; then
            echo -e "${GREEN}✅ $phase COMPLETED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ $phase FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ Test file not found: $test_file${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
}

# Determine which phases to run
RUN_PHASE1=true
RUN_PHASE2=true
RUN_PHASE3=true

if [ "$1" == "phase1" ]; then
    RUN_PHASE2=false
    RUN_PHASE3=false
elif [ "$1" == "phase2" ]; then
    RUN_PHASE1=false
    RUN_PHASE3=false
elif [ "$1" == "phase3" ]; then
    RUN_PHASE1=false
    RUN_PHASE2=false
elif [ "$1" == "quick" ]; then
    echo -e "${YELLOW}⚡ Quick mode - running essential checks only${NC}"
    echo ""
    
    # Quick checks
    echo -e "${BLUE}1. Checking lint...${NC}"
    npm run lint || echo -e "${YELLOW}⚠️  Linting issues found${NC}"
    
    echo -e "${BLUE}2. Checking build...${NC}"
    npm run build || echo -e "${RED}❌ Build failed${NC}"
    
    echo -e "${BLUE}3. Checking dependencies...${NC}"
    npm audit --audit-level=high || echo -e "${YELLOW}⚠️  Vulnerabilities found${NC}"
    
    echo -e "${GREEN}✅ Quick checks complete${NC}"
    exit 0
fi

# Run phases
if [ "$RUN_PHASE1" == true ]; then
    run_phase "PHASE 1" "tests/phase1-general.test.ts" "General Tests (1-50)"
fi

if [ "$RUN_PHASE2" == true ]; then
    run_phase "PHASE 2" "tests/phase2-api.test.ts" "API Tests (51-100)"
fi

if [ "$RUN_PHASE3" == true ]; then
    run_phase "PHASE 3" "tests/phase3-ux-flow.test.ts" "UX/Flow Tests (101-150)"
fi

# Additional Test Suites
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}▶️  ADDITIONAL TESTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Coverage Report
echo -e "${YELLOW}📊 Generating coverage report...${NC}"
if npm test -- --coverage --coverageDirectory=coverage 2>/dev/null; then
    echo -e "${GREEN}✅ Coverage report generated in coverage/${NC}"
else
    echo -e "${YELLOW}⚠️  Coverage report not available${NC}"
fi

# Security Audit
echo -e "${YELLOW}🔐 Running security audit...${NC}"
if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✅ No moderate+ vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠️  Vulnerabilities found - review npm audit output${NC}"
fi

# Final Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                              FINAL SUMMARY                                     ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Phases Passed:  $PASSED_TESTS${NC}"
echo -e "${RED}❌ Phases Failed:  $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Phases:   $TOTAL_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}║                     🎉 ALL TESTS PASSED! 🎉                                   ║${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}║                   ✅ READY FOR DEPLOYMENT ✅                                   ║${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "${BLUE}  1. Deploy to staging: npm run deploy:staging${NC}"
    echo -e "${BLUE}  2. Run smoke tests on staging${NC}"
    echo -e "${BLUE}  3. Deploy to production: npm run deploy:production${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                               ║${NC}"
    echo -e "${RED}║                     ⚠️  TESTS FAILED ⚠️                                       ║${NC}"
    echo -e "${RED}║                                                                               ║${NC}"
    echo -e "${RED}║                   Fix issues before deploying                                 ║${NC}"
    echo -e "${RED}║                                                                               ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📋 Review failed tests above and fix issues${NC}"
    exit 1
fi






