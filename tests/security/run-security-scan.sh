#!/bin/bash

###############################################################################
# OWASP ZAP Security Scanner - Guild Platform
# Comprehensive security testing with automated reporting
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         OWASP ZAP SECURITY SCAN - GUILD PLATFORM              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT_DIR="$PROJECT_ROOT/test-reports/security"
ZAP_CONFIG="$SCRIPT_DIR/zap-automation.yaml"
TARGET_URL="${TARGET_URL:-http://host.docker.internal:4000}"

# Create report directory
mkdir -p "$REPORT_DIR"

# Check if backend is running
echo -e "${YELLOW}📡 Checking if backend is running...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/health" | grep -q "200"; then
    echo -e "${GREEN}✅ Backend is running${NC}\n"
else
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo -e "${YELLOW}Start with: cd backend && npm run dev${NC}\n"
    exit 1
fi

# Check if Docker is running
echo -e "${YELLOW}🐳 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo -e "${YELLOW}Start Docker Desktop and try again${NC}\n"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}\n"

# Pull latest ZAP Docker image
echo -e "${YELLOW}📦 Pulling OWASP ZAP Docker image...${NC}"
docker pull owasp/zap2docker-stable
echo ""

# Run ZAP scan
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   STARTING SECURITY SCAN                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${YELLOW}⏱️  This may take 20-40 minutes...${NC}\n"

# Run full scan
docker run --rm \
    -v "$PROJECT_ROOT:/zap/wrk/:rw" \
    --network="host" \
    -t owasp/zap2docker-stable zap.sh \
    -cmd \
    -autorun "/zap/wrk/tests/security/zap-automation.yaml" \
    -config api.disablekey=true

SCAN_EXIT_CODE=$?

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   SCAN COMPLETE                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

# Parse results
if [ -f "$REPORT_DIR/zap-security-report.json" ]; then
    echo -e "${GREEN}✅ Reports generated:${NC}"
    echo -e "   📄 HTML: $REPORT_DIR/zap-security-report.html"
    echo -e "   📄 JSON: $REPORT_DIR/zap-security-report.json"
    echo -e "   📄 XML:  $REPORT_DIR/zap-security-report.xml"
    echo -e "   📄 Summary: $REPORT_DIR/zap-summary.txt\n"
    
    # Count vulnerabilities
    if command -v jq &> /dev/null; then
        HIGH=$(jq '[.site[].alerts[] | select(.riskcode=="3")] | length' "$REPORT_DIR/zap-security-report.json")
        MEDIUM=$(jq '[.site[].alerts[] | select(.riskcode=="2")] | length' "$REPORT_DIR/zap-security-report.json")
        LOW=$(jq '[.site[].alerts[] | select(.riskcode=="1")] | length' "$REPORT_DIR/zap-security-report.json")
        INFO=$(jq '[.site[].alerts[] | select(.riskcode=="0")] | length' "$REPORT_DIR/zap-security-report.json")
        
        echo -e "${BLUE}📊 VULNERABILITY SUMMARY:${NC}"
        echo -e "   ${RED}🔴 High:   $HIGH${NC}"
        echo -e "   ${YELLOW}🟡 Medium: $MEDIUM${NC}"
        echo -e "   ${BLUE}🔵 Low:    $LOW${NC}"
        echo -e "   ${GREEN}⚪ Info:   $INFO${NC}\n"
        
        # Verdict
        if [ "$HIGH" -eq 0 ] && [ "$MEDIUM" -eq 0 ]; then
            echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║                  ✅ SECURITY SCAN PASSED ✅                     ║${NC}"
            echo -e "${GREEN}║            No high or medium vulnerabilities found             ║${NC}"
            echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}\n"
        elif [ "$HIGH" -eq 0 ]; then
            echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}║                  ⚠️  SECURITY WARNINGS ⚠️                       ║${NC}"
            echo -e "${YELLOW}║              $MEDIUM medium-risk vulnerabilities found              ║${NC}"
            echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}\n"
        else
            echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${RED}║                  ❌ SECURITY SCAN FAILED ❌                     ║${NC}"
            echo -e "${RED}║              $HIGH high-risk vulnerabilities found                 ║${NC}"
            echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}\n"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Install 'jq' to see vulnerability breakdown${NC}\n"
    fi
else
    echo -e "${RED}❌ Report generation failed${NC}\n"
    exit 1
fi

exit $SCAN_EXIT_CODE






