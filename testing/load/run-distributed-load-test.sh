#!/bin/bash
# JMeter Distributed Load Testing Script

echo "🚀 Starting JMeter Distributed Load Test..."

# Set up JMeter environment
export JMETER_HOME=/opt/apache-jmeter-5.6.2
export PATH=$JMETER_HOME/bin:$PATH

# Create results directory
mkdir -p jmeter-results

# Run distributed test with multiple JMeter servers
echo "📊 Running distributed load test with 50k users..."

jmeter -n -t guild-load-test.json \
  -R jmeter-server1:1099,jmeter-server2:1099,jmeter-server3:1099 \
  -l jmeter-results/distributed-results.jtl \
  -e -o jmeter-results/html-report \
  -Jusers=50000 \
  -Jduration=1800 \
  -Jramp-up=300

# Generate comprehensive report
echo "📈 Generating load test report..."

# Check if test passed (90% success rate, < 2s average response time)
SUCCESS_RATE=$(grep -o '"success":true' jmeter-results/distributed-results.jtl | wc -l)
TOTAL_REQUESTS=$(grep -c "success" jmeter-results/distributed-results.jtl)
AVG_RESPONSE_TIME=$(awk -F',' '{sum += $3} END {print sum/NR}' jmeter-results/distributed-results.jtl)

echo "Load Test Results:"
echo "- Success Rate: $((SUCCESS_RATE * 100 / TOTAL_REQUESTS))%"
echo "- Average Response Time: ${AVG_RESPONSE_TIME}ms"
echo "- Total Requests: ${TOTAL_REQUESTS}"

if [ $((SUCCESS_RATE * 100 / TOTAL_REQUESTS)) -ge 90 ] && [ $(echo "${AVG_RESPONSE_TIME} < 2000" | bc -l) -eq 1 ]; then
  echo "✅ Load test PASSED"
  exit 0
else
  echo "❌ Load test FAILED"
  exit 1
fi
