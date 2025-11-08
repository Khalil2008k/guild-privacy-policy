# 🧪 Task 2.10: Manual Payment Flow Test Plan

**Date:** January 2025  
**Status:** 📋 **TEST PLAN READY** - Manual testing required

---

## ✅ Test Flow: Add Card → Pay for Job → Escrow → Release → Confirm Wallet Update

### **Prerequisites**
- ✅ Backend server running (`npm run dev` in `backend/`)
- ✅ Frontend app running (`npx expo start`)
- ✅ Firebase project configured (`guild-4f46b`)
- ✅ Fatora sandbox credentials configured
- ✅ User authenticated in app
- ✅ Test job created (or use existing job ID)

---

## 📋 Step-by-Step Test Plan

### **Step 1: Add Payment Card**
1. Navigate to Payment Methods screen
2. Tap "Add New Payment Method" button
3. Fill in card form:
   - Card Number: `4111 1111 1111 1111` (Visa test card)
   - Expiry Date: `12/25`
   - CVV: `123`
   - Cardholder Name: `Test User`
4. Tap "Add Card"
5. ✅ **Expected:** Card saved successfully, appears in payment methods list
6. ✅ **Verify:** Card stored in secure storage (encrypted)

### **Step 2: Initiate Job Payment**
1. Navigate to a job detail screen (or create a test job)
2. Tap "Pay for Job" or "Proceed to Payment"
3. Confirm payment details:
   - Job ID displayed
   - Freelancer ID displayed
   - Amount displayed correctly
   - Order ID generated
4. Tap "Pay Securely" button
5. ✅ **Expected:** 
   - Payment state transitions: `idle` → `validating` → `pending` → `processing`
   - Fatora checkout WebView opens
   - Payment URL loads successfully

### **Step 3: Complete Fatora Payment**
1. In Fatora WebView:
   - Use test card: `4111 1111 1111 1111`
   - Expiry: `12/25`
   - CVV: `123`
   - Cardholder: `Test User`
2. Complete payment
3. ✅ **Expected:**
   - Payment WebView detects success URL
   - `handlePaymentSuccess` callback triggered
   - Payment state transitions to `completed`
   - Success message displayed
   - WebView closes automatically

### **Step 4: Verify Escrow Creation**
1. Check backend logs for:
   - `POST /api/payments/webhook` received
   - Payment intent updated to `completed`
   - Coins issued to user wallet
   - Escrow created successfully
   - Transaction logged in Firestore
2. Verify in Firestore:
   - `payment_intents/{paymentIntentId}` exists with `status: 'completed'`
   - `escrows/{escrowId}` exists with:
     - `status: 'locked'`
     - `clientId` matches user ID
     - `freelancerId` matches job freelancer
     - `jobId` matches job ID
     - `amount` matches payment amount
   - `transaction_logs/{transactionId}` exists with:
     - `type: 'PSP_TOPUP'` (initial payment)
     - `type: 'ESCROW_HOLD'` (escrow creation)
3. ✅ **Expected:** 
   - Escrow created with correct data
   - All transactions logged
   - Wallet balance reflects coin deduction

### **Step 5: Release Escrow**
1. Navigate to job detail or escrow management screen
2. Tap "Release Payment" or "Release Escrow"
3. Confirm release (if confirmation dialog appears)
4. ✅ **Expected:**
   - Escrow released successfully
   - Payment transferred to freelancer
   - Platform fee deducted (10%)
   - Transaction logged:
     - `type: 'ESCROW_RELEASE'` (freelancer payment)
     - `type: 'PLATFORM_FEE'` (platform fee)
   - Wallet balances updated:
     - Freelancer wallet increased
     - Platform wallet increased
5. Verify in Firestore:
   - `escrows/{escrowId}.status` = `'released'`
   - `transaction_logs` contains release transaction
   - Freelancer wallet balance updated

### **Step 6: Verify Wallet Update**
1. Navigate to wallet/balance screen
2. Check wallet balance:
   - ✅ **Client wallet:** Should show deduction (coins locked in escrow)
   - ✅ **Freelancer wallet:** Should show increase (after escrow release)
   - ✅ **Platform wallet:** Should show platform fee
3. Check transaction history:
   - ✅ **Client history:** Shows PSP_TOPUP, ESCROW_HOLD
   - ✅ **Freelancer history:** Shows ESCROW_RELEASE
   - ✅ **Platform history:** Shows PLATFORM_FEE
4. Verify ledger entries:
   - All transactions have corresponding ledger entries
   - Idempotency keys prevent duplicates

---

## 🔍 Detailed Verification Points

### **1. Payment Validation**
- ✅ PaymentProcessor validates all inputs
- ✅ Amount within valid range (0.01 - 1,000,000 QAR)
- ✅ State transitions validated
- ✅ Error handling for invalid states

### **2. Webhook Processing**
- ✅ Webhook signature verified (if provided)
- ✅ Payment intent found and updated
- ✅ Coins issued atomically
- ✅ Escrow created atomically
- ✅ Transaction logging complete

### **3. Escrow Logic**
- ✅ Escrow created with correct coins
- ✅ Authorization checks (client, freelancer, admin)
- ✅ Status validation (can only release/release when locked)
- ✅ Refund logic works correctly
- ✅ Reason required for refunds
- ✅ Input sanitization applied

### **4. Transaction Logging**
- ✅ All transactions logged to `transaction_logs` collection
- ✅ User-specific subcollections updated
- ✅ Transaction numbers generated sequentially
- ✅ All required fields present:
  - User identity (userId, guildId, fullName, govId)
  - Transaction details (type, amount, currency, status)
  - Money flow (fromAccount, toAccount)
  - Related data (jobId, escrowId, paymentId)

### **5. Wallet Updates**
- ✅ Atomic updates (Firestore transactions)
- ✅ Idempotency enforced
- ✅ Decimal precision maintained (using Decimal.js)
- ✅ Coin distribution calculated correctly
- ✅ Platform fee calculated correctly (10%)

### **6. Error Handling**
- ✅ Payment errors caught and displayed
- ✅ WebView errors handled gracefully
- ✅ Network errors provide user feedback
- ✅ HTTP errors categorized (400, 401, 404, 500, etc.)
- ✅ Error boundaries prevent crashes

### **7. Security**
- ✅ Cards encrypted in secure storage
- ✅ Input sanitization applied
- ✅ Authorization checks enforced
- ✅ Transaction logging includes user identity
- ✅ No hardcoded secrets

### **8. Performance**
- ✅ Components optimized (React.memo, useCallback)
- ✅ No unnecessary re-renders
- ✅ Stable function references
- ✅ Efficient state management

---

## ⚠️ Known Issues to Watch For

### **Potential Issues:**
1. **Webhook Timing:** Ensure webhook arrives within reasonable time (< 30 seconds)
2. **Race Conditions:** Check for race conditions between coin issue and escrow creation
3. **State Management:** Verify payment state machine transitions correctly
4. **Error Recovery:** Test error scenarios (network failure, payment failure, etc.)
5. **Idempotency:** Ensure duplicate webhooks don't create duplicate transactions

### **Edge Cases to Test:**
1. **Payment Failure:** What happens if payment fails after escrow creation?
2. **Refund Flow:** Test refunding escrow before release
3. **Multiple Payments:** Test multiple payments for same job
4. **Concurrent Access:** Test simultaneous payment attempts
5. **Network Interruption:** Test payment flow with network interruption

---

## 📊 Test Checklist

### **Payment Flow:**
- [ ] Card added successfully
- [ ] Payment initiated successfully
- [ ] Fatora WebView opens correctly
- [ ] Payment completed successfully
- [ ] Webhook received and processed
- [ ] Coins issued to wallet
- [ ] Escrow created successfully
- [ ] Transaction logged correctly

### **Escrow Release:**
- [ ] Escrow release authorized correctly
- [ ] Payment released to freelancer
- [ ] Platform fee deducted correctly
- [ ] Wallet balances updated correctly
- [ ] Transaction logged correctly
- [ ] Ledger entries created

### **Error Handling:**
- [ ] Payment validation errors displayed
- [ ] Network errors handled gracefully
- [ ] WebView errors handled gracefully
- [ ] HTTP errors categorized correctly
- [ ] Error boundaries prevent crashes

### **Security:**
- [ ] Cards encrypted in secure storage
- [ ] Input sanitization applied
- [ ] Authorization checks enforced
- [ ] No sensitive data logged
- [ ] Transaction logging complete

### **Performance:**
- [ ] No unnecessary re-renders
- [ ] Components optimized
- [ ] Stable function references
- [ ] Efficient state management

---

## 📝 Test Results Template

```markdown
## Test Date: [Date]
## Tester: [Name]
## Environment: [Development/Staging/Production]

### Step 1: Add Payment Card
- [ ] Pass / [ ] Fail
- Notes: [Any issues or observations]

### Step 2: Initiate Job Payment
- [ ] Pass / [ ] Fail
- Notes: [Any issues or observations]

### Step 3: Complete Fatora Payment
- [ ] Pass / [ ] Fail
- Notes: [Any issues or observations]

### Step 4: Verify Escrow Creation
- [ ] Pass / [ ] Fail
- Notes: [Any issues or observations]

### Step 5: Release Escrow
- [ ] Pass / [ ] Fail
- Notes: [Any issues or observations]

### Step 6: Verify Wallet Update
- [ ] Pass / [ ] Fail
- Notes: [Any issues or observations]

### Overall Result: [Pass / Fail]
### Issues Found: [List any issues]
### Recommendations: [Any recommendations]
```

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass:**
   - Mark Task 2.10 as complete
   - Document test results
   - Proceed to Section 3 (Chat System)

2. **If Issues Found:**
   - Document issues in detail
   - Prioritize fixes
   - Re-test after fixes
   - Update test results

3. **Continuous Testing:**
   - Add automated tests for critical flows
   - Set up integration tests
   - Monitor production logs

---

**Last Updated:** January 2025  
**Status:** 📋 **TEST PLAN READY** - Awaiting manual testing  
**Next Action:** Execute manual test flow and document results








