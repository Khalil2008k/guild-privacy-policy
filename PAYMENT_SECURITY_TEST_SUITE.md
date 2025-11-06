# 🧪 Advanced Payment Security Test Suite

## Test Execution Plan

This document provides comprehensive test cases for payment security validation.

---

## Test Suite 1: API Key Security Tests

### Test 1.1: API Key Storage Validation
```bash
# Test: Verify API key is NOT in source code
grep -r "kOGQrmkFr5LcNW9c" --exclude-dir=node_modules --exclude="*.md" .

# Expected: No matches (except in .md documentation files)
```

### Test 1.2: Environment Variable Validation
```typescript
// Test: Service fails if API key missing
const service = new SadadPaymentService();
// Expected: Throws error if SADAD_API_KEY not set
```

### Test 1.3: API Key Format Validation
```typescript
// Test: API key format validation
const validKey = "kOGQrmkFr5LcNW9c";
const invalidKey = "";

// Expected: Valid key accepted, invalid key rejected
```

---

## Test Suite 2: Webhook Security Tests

### Test 2.1: Signature Verification
```typescript
// Test: Valid signature accepted
const payload = JSON.stringify({ order_id: "test123", status: "success" });
const signature = generateHMAC(payload, webhookSecret);
const result = verifyWebhookSignature(payload, signature);
// Expected: result.valid === true

// Test: Invalid signature rejected
const invalidSignature = "wrong_signature";
const result2 = verifyWebhookSignature(payload, invalidSignature);
// Expected: result2.valid === false
```

### Test 2.2: Replay Attack Prevention
```typescript
// Test: Old webhook rejected
const oldTimestamp = Date.now() - 600000; // 10 minutes ago
const result = verifyTimestamp(oldTimestamp.toString());
// Expected: result.valid === false (if maxReplayWindow < 600)

// Test: Future timestamp rejected
const futureTimestamp = Date.now() + 60000; // 1 minute in future
const result2 = verifyTimestamp(futureTimestamp.toString());
// Expected: result2.valid === false (if tolerance < 60)
```

### Test 2.3: Nonce Validation
```typescript
// Test: Duplicate nonce rejected
const nonce = "test-nonce-123";
verifyNonce(nonce); // First use
const result = verifyNonce(nonce); // Second use
// Expected: result.valid === false
```

### Test 2.4: Idempotency
```typescript
// Test: Duplicate webhook processing prevented
const idempotencyKey = "webhook_order123";
checkIdempotency(idempotencyKey); // First check
recordIdempotency(idempotencyKey, { success: true });
const result = checkIdempotency(idempotencyKey); // Second check
// Expected: result.processed === true
```

---

## Test Suite 3: Deep Link Security Tests

### Test 3.1: Deep Link Format Validation
```typescript
// Test: Valid deep link accepted
const validLink = "guild://payment/success?transaction_id=txn123&order_id=order123";
const result = parsePaymentDeepLink(validLink);
// Expected: result.valid === true

// Test: Invalid deep link rejected
const invalidLink = "http://malicious.com/payment";
const result2 = parsePaymentDeepLink(invalidLink);
// Expected: result2 === null
```

### Test 3.2: Injection Prevention
```typescript
// Test: XSS injection prevented
const xssLink = "guild://payment/success?transaction_id=<script>alert('xss')</script>";
const result = parsePaymentDeepLink(xssLink);
// Expected: result.valid === false (invalid format)

// Test: SQL injection prevented
const sqlLink = "guild://payment/success?transaction_id=' OR '1'='1";
const result2 = parsePaymentDeepLink(sqlLink);
// Expected: result2.valid === false (invalid format)
```

### Test 3.3: Parameter Validation
```typescript
// Test: Invalid transaction_id format rejected
const invalidTxnId = "tx"; // Too short
const link = `guild://payment/success?transaction_id=${invalidTxnId}&order_id=order123`;
const result = parsePaymentDeepLink(link);
// Expected: result.valid === false

// Test: Invalid order_id format rejected
const invalidOrderId = "order!@#"; // Invalid characters
const link2 = `guild://payment/success?transaction_id=txn123&order_id=${invalidOrderId}`;
const result2 = parsePaymentDeepLink(link2);
// Expected: result2.valid === false
```

---

## Test Suite 4: Payment Flow Security Tests

### Test 4.1: Amount Validation
```typescript
// Test: Valid amount accepted
const result = PaymentInputValidator.validateAmount(100.50);
// Expected: result.valid === true

// Test: Negative amount rejected
const result2 = PaymentInputValidator.validateAmount(-100);
// Expected: result2.valid === false

// Test: Zero amount rejected
const result3 = PaymentInputValidator.validateAmount(0);
// Expected: result3.valid === false

// Test: Amount exceeding maximum rejected
const result4 = PaymentInputValidator.validateAmount(2000000);
// Expected: result4.valid === false

// Test: Invalid decimal precision rejected
const result5 = PaymentInputValidator.validateAmount(100.123);
// Expected: result5.valid === false
```

### Test 4.2: Order ID Validation
```typescript
// Test: Valid order ID accepted
const result = PaymentInputValidator.validateOrderId("order123");
// Expected: result.valid === true

// Test: Invalid order ID format rejected
const result2 = PaymentInputValidator.validateOrderId("order!@#");
// Expected: result2.valid === false

// Test: Order ID too short rejected
const result3 = PaymentInputValidator.validateOrderId("ord");
// Expected: result3.valid === false
```

### Test 4.3: Client Data Validation
```typescript
// Test: Valid client name accepted
const result = PaymentInputValidator.validateClientName("John Doe");
// Expected: result.valid === true

// Test: Invalid client name rejected
const result2 = PaymentInputValidator.validateClientName("John<script>");
// Expected: result2.valid === false

// Test: Valid email accepted
const result3 = PaymentInputValidator.validateEmail("user@example.com");
// Expected: result3.valid === true

// Test: Invalid email rejected
const result4 = PaymentInputValidator.validateEmail("invalid-email");
// Expected: result4.valid === false

// Test: Valid phone accepted
const result5 = PaymentInputValidator.validatePhone("+97412345678");
// Expected: result5.valid === true

// Test: Invalid phone rejected
const result6 = PaymentInputValidator.validatePhone("12345678");
// Expected: result6.valid === false
```

---

## Test Suite 5: Race Condition Tests

### Test 5.1: Concurrent Payment Processing
```typescript
// Test: Concurrent webhook processing
const orderId = "order123";
const webhook1 = { order_id: orderId, status: "success" };
const webhook2 = { order_id: orderId, status: "success" };

// Process both concurrently
await Promise.all([
  processWebhook(webhook1),
  processWebhook(webhook2)
]);

// Expected: Only one payment processed (idempotency)
```

### Test 5.2: Concurrent Wallet Updates
```typescript
// Test: Concurrent wallet updates
const userId = "user123";
const amount = 100;

// Update wallet concurrently
await Promise.all([
  updateWallet(userId, amount),
  updateWallet(userId, amount)
]);

// Expected: Wallet balance correct (no double credit)
```

---

## Test Suite 6: Input Sanitization Tests

### Test 6.1: Note Field Sanitization
```typescript
// Test: HTML tags removed
const note = "<script>alert('xss')</script>Hello";
const sanitized = PaymentInputValidator.sanitizeNote(note);
// Expected: sanitized === "Hello" (no script tags)

// Test: Length limit enforced
const longNote = "a".repeat(600);
const sanitized2 = PaymentInputValidator.sanitizeNote(longNote);
// Expected: sanitized2.length === 500
```

---

## Test Suite 7: Authentication/Authorization Tests

### Test 7.1: Endpoint Authentication
```typescript
// Test: Authenticated request accepted
const token = generateAuthToken(userId);
const response = await fetch('/api/payments/create', {
  headers: { Authorization: `Bearer ${token}` }
});
// Expected: response.status === 200

// Test: Unauthenticated request rejected
const response2 = await fetch('/api/payments/create');
// Expected: response2.status === 401
```

### Test 7.2: User Authorization
```typescript
// Test: User can access own payments
const userToken = generateAuthToken(userId);
const response = await fetch(`/api/payments/${orderId}`, {
  headers: { Authorization: `Bearer ${userToken}` }
});
// Expected: response.status === 200

// Test: User cannot access other user's payments
const otherUserToken = generateAuthToken(otherUserId);
const response2 = await fetch(`/api/payments/${orderId}`, {
  headers: { Authorization: `Bearer ${otherUserToken}` }
});
// Expected: response2.status === 403
```

---

## Test Suite 8: External Browser Security Tests

### Test 8.1: Deep Link Return Security
```typescript
// Test: Valid deep link returns to app
const deepLink = generateSignedDeepLink('success', 'txn123', 'order123');
const result = verifyDeepLink(deepLink);
// Expected: result.valid === true

// Test: Invalid signature rejected
const invalidLink = "guild://payment/success?transaction_id=txn123&order_id=order123&signature=wrong";
const result2 = verifyDeepLink(invalidLink);
// Expected: result2.valid === false
```

---

## Automated Test Execution

### Run All Security Tests
```bash
# Install test dependencies
npm install --save-dev jest @types/jest ts-jest

# Run security tests
npm run test:security

# Run with coverage
npm run test:security:coverage
```

### Continuous Security Testing
```bash
# Pre-commit hook
npm run test:security:pre-commit

# CI/CD pipeline
npm run test:security:ci
```

---

## Security Test Results

### Test Execution Status
- [ ] Test Suite 1: API Key Security - PENDING
- [ ] Test Suite 2: Webhook Security - PENDING
- [ ] Test Suite 3: Deep Link Security - PENDING
- [ ] Test Suite 4: Payment Flow Security - PENDING
- [ ] Test Suite 5: Race Condition Tests - PENDING
- [ ] Test Suite 6: Input Sanitization - PENDING
- [ ] Test Suite 7: Authentication/Authorization - PENDING
- [ ] Test Suite 8: External Browser Security - PENDING

---

**Status:** TEST SUITE READY FOR EXECUTION

