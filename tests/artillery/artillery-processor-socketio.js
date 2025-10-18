/**
 * Artillery Socket.IO Processor
 * Real-time chat performance monitoring
 */

const fs = require('fs');
const path = require('path');

// Metrics
const metrics = {
  connections: 0,
  disconnections: 0,
  messagesSent: 0,
  messagesReceived: 0,
  typingIndicators: 0,
  latencies: [],
  errors: []
};

const logPath = path.join(__dirname, '../../test-reports/artillery/socketio-metrics.json');

/**
 * Track message latency
 */
function trackMessageLatency(requestParams, response, context, ee, next) {
  const sendTime = context.vars.messageSendTime || Date.now();
  const receiveTime = Date.now();
  const latency = receiveTime - sendTime;
  
  metrics.latencies.push(latency);
  metrics.messagesReceived++;
  
  // Warning for slow messages
  if (latency > 200) {
    console.warn(`⚠️  Slow message: ${latency}ms`);
  }
  
  return next();
}

/**
 * Before sending message
 */
function beforeSendMessage(context, ee, next) {
  context.vars.messageSendTime = Date.now();
  metrics.messagesSent++;
  return next();
}

/**
 * Track typing indicators
 */
function trackTyping(context, ee, next) {
  metrics.typingIndicators++;
  return next();
}

/**
 * On connection
 */
function onConnect(context, ee, next) {
  metrics.connections++;
  console.log(`✅ Connected: ${metrics.connections} active connections`);
  return next();
}

/**
 * On disconnect
 */
function onDisconnect(context, ee, next) {
  metrics.disconnections++;
  return next();
}

/**
 * Final report
 */
function afterTest(context, ee, done) {
  const avgLatency = metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length || 0;
  const sortedLatencies = metrics.latencies.sort((a, b) => a - b);
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
  
  const report = {
    timestamp: new Date().toISOString(),
    connections: metrics.connections,
    disconnections: metrics.disconnections,
    messagesSent: metrics.messagesSent,
    messagesReceived: metrics.messagesReceived,
    messageLoss: metrics.messagesSent - metrics.messagesReceived,
    messageLossRate: ((1 - metrics.messagesReceived / metrics.messagesSent) * 100).toFixed(2) + '%',
    typingIndicators: metrics.typingIndicators,
    latency: {
      avg: Math.round(avgLatency),
      p95: Math.round(p95),
      min: Math.min(...metrics.latencies),
      max: Math.max(...metrics.latencies)
    }
  };
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           SOCKET.IO LOAD TEST - FINAL METRICS                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Connections: ${report.connections}`);
  console.log(`📤 Messages Sent: ${report.messagesSent}`);
  console.log(`📥 Messages Received: ${report.messagesReceived}`);
  console.log(`❌ Message Loss: ${report.messageLoss} (${report.messageLossRate})`);
  console.log(`⚡ Avg Latency: ${report.latency.avg}ms`);
  console.log(`📈 P95 Latency: ${report.latency.p95}ms\n`);
  
  fs.writeFileSync(logPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${logPath}\n`);
  
  return done();
}

module.exports = {
  trackMessageLatency,
  beforeSendMessage,
  trackTyping,
  onConnect,
  onDisconnect,
  afterTest
};






