# 🧪 Payment Integration - Testing Guide

## ✅ **Implementation Complete!**

All payment components have been implemented and integrated. You can now test the WebView payment flow!

---

## 📋 **What Was Implemented**

### **Mobile App Components:**
1. ✅ `react-native-webview` - Installed
2. ✅ `src/components/PaymentWebView.tsx` - WebView component
3. ✅ `src/services/paymentService.ts` - Payment API service
4. ✅ `src/app/(modals)/payment.tsx` - Payment modal screen

### **Backend Components:**
1. ✅ `backend/src/routes/payments.routes.ts` - Payment API endpoints
2. ✅ `backend/src/services/FatoraPaymentService.ts` - Enhanced with demo mode
3. ✅ `backend/src/services/DemoModeService.ts` - Demo transaction system
4. ✅ `backend/src/services/DemoModeWebSocketService.ts` - Real-time sync
5. ✅ `backend/src/server.ts` - Routes registered

---

## 🚀 **Quick Start Testing**

### **Step 1: Start Backend**

```bash
cd backend
npm start
```

**Expected Output:**
```
✅ Server listening on http://192.168.1.34:5000
🧪 Initializing Demo Mode Service...
🧪 Demo Mode loaded: DISABLED (or ENABLED)
✅ Demo Mode WebSocket Service initialized
💳 Fatora Payment Service initialized (TEST mode)
```

### **Step 2: Start Mobile App**

```bash
cd GUILD-3
npx expo start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator  
- Scan QR code for physical device

---

## 🧪 **Testing Demo Mode Payments**

Demo mode allows you to test payments **without real money** or Fatora API calls.

### **Enable Demo Mode:**

#### **Method 1: Direct API Call**

```bash
# From GUILD-3 directory
curl -X POST http://192.168.1.34:5000/api/demo-mode/enable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### **Method 2: Admin Portal** (If available)

1. Open admin portal: `http://192.168.1.34:3000`
2. Go to "Demo Mode Controller"
3. Click "Switch to Demo"

### **Test Payment Flow:**

1. **In GUILD App:**
   - Navigate to any payment screen
   - Or navigate directly: `router.push('/(modals)/payment?amount=500&description=Test Payment')`

2. **Enter Payment Details:**
   - You'll see: "Confirm Payment" screen
   - Amount: 500.00 QAR
   - Description: Test Payment
   - Order ID: Auto-generated

3. **Click "Pay 500.00 QAR Securely"**
   - Loading spinner appears
   - Backend creates demo transaction
   - WebView opens with demo payment URL

4. **Demo Payment Processing:**
   - WebView shows: `http://backend/demo/payment/demo_txn_...`
   - Transaction processes for 2 seconds
   - Status changes: `pending` → `completed` (90% success rate)

5. **Success:**
   - WebView automatically detects success
   - Closes and shows success message
   - Returns to previous screen

---

## 💳 **Testing Real Payments** (Production Mode)

### **Disable Demo Mode:**

```bash
curl -X POST http://192.168.1.34:5000/api/demo-mode/disable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Test with Fatora Test Cards:**

1. **Enable Fatora Test Mode** (Already enabled in backend)
   - Backend uses test API key: `E4B73FEE-F492-4607-A38D-852B0EBC91C9`

2. **Perform Payment:**
   - Same flow as demo mode
   - But WebView opens **real Fatora page**
   - URL: `https://maktapp.credit/pay/MCPaymentPage?paymentID=...`

3. **Use Test Cards:**
   ```
   ✅ Success Card:
   Card Number: 4111 1111 1111 1111
   Expiry: Any future date (e.g., 12/25)
   CVV: Any 3 digits (e.g., 123)
   
   ❌ Failure Card:
   Card Number: 4000 0000 0000 0002
   Expiry: Any future date
   CVV: Any 3 digits
   ```

4. **Complete Payment:**
   - Enter test card details
   - Click "Pay"
   - Fatora processes payment
   - Redirects to success/failure URL
   - WebView detects and closes
   - Shows result in app

---

## 🔍 **Testing Checklist**

### **Demo Mode Tests:**

- [ ] Backend starts successfully
- [ ] Demo mode can be enabled
- [ ] Payment screen opens correctly
- [ ] Amount and details display correctly
- [ ] "Pay Securely" button works
- [ ] WebView opens with demo URL
- [ ] Demo transaction created (check logs)
- [ ] Loading indicator shows
- [ ] Success detected automatically
- [ ] WebView closes on success
- [ ] Success message displayed
- [ ] Returns to previous screen

### **Production Mode Tests:**

- [ ] Demo mode can be disabled
- [ ] Fatora checkout URL received
- [ ] WebView opens Fatora page
- [ ] Test card form works
- [ ] Success card completes payment
- [ ] Failure card shows error
- [ ] Success detected correctly
- [ ] Failure detected correctly
- [ ] Webhook received (check backend logs)

### **Error Handling Tests:**

- [ ] Invalid amount shows error
- [ ] Network error handled
- [ ] Backend down handled
- [ ] Close button works
- [ ] Back navigation works

---

## 📊 **Check Backend Logs**

### **Demo Mode Logs:**

```
💳 Creating payment checkout for order ORD-...
🧪 Creating DEMO checkout for order ORD-...
✅ Demo checkout created: demo_txn_1729...
🔌 Broadcasting demo mode status to 1 admins
💳 WebView URL changed: /demo/payment/demo_txn_...
✅ Payment successful!
```

### **Production Mode Logs:**

```
💳 Creating PRODUCTION checkout for order ORD-...
💳 Calling Fatora API...
✅ Payment checkout created: LUWIY8RSJH851001452527LU
💳 WebView URL changed: https://maktapp.credit/pay/...
✅ Payment successful!
🔍 Verifying payment: LUWIY8RSJH851001452527LU
```

---

## 🛠️ **Testing from Code**

### **Navigate to Payment Screen:**

```typescript
// From any screen in the app
import { router } from 'expo-router';

// Navigate to payment
router.push({
  pathname: '/(modals)/payment',
  params: {
    amount: '500.00',
    description: 'Test Payment',
    orderId: 'TEST-123', // Optional
    jobId: 'job_123', // Optional
    freelancerId: 'freelancer_123', // Optional
  }
});
```

### **Test Payment Service Directly:**

```typescript
import { initiatePayment, verifyPayment } from '../services/paymentService';

// Test payment initiation
const result = await initiatePayment({
  amount: 500.00,
  orderId: 'TEST-123',
  description: 'Test Payment',
  language: 'en'
});

console.log('Payment result:', result);

// Test payment verification
if (result.success && result.payment_id) {
  const verification = await verifyPayment(result.payment_id);
  console.log('Verification result:', verification);
}
```

---

## 🐛 **Troubleshooting**

### **Backend Not Starting:**

```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# Kill the process if needed
# Then restart backend
```

### **WebView Not Loading:**

1. **Check backend is running:**
   ```bash
   curl http://192.168.1.34:5000/health
   ```

2. **Check network connectivity:**
   - Ensure device/emulator can reach backend
   - For Android emulator, use `10.0.2.2:5000` instead of `192.168.1.34:5000`
   - For iOS simulator, use `localhost:5000`

3. **Update backend URL if needed:**
   ```typescript
   // In src/config/backend.ts
   const BACKEND_CONFIG = {
     baseURL: 'http://YOUR_IP:5000'
   };
   ```

### **Payment Not Completing:**

1. **Check backend logs** for errors
2. **Check Fatora API key** is valid
3. **Verify demo mode status:**
   ```bash
   curl http://192.168.1.34:5000/api/demo-mode/status
   ```

### **WebView Stays Open:**

- Success/failure URLs might not match expected patterns
- Check `handleNavigationStateChange` logic in `PaymentWebView.tsx`
- Add more logging to see URL changes

---

## 📱 **Testing on Different Devices**

### **iOS Simulator:**

```bash
npx expo start
# Press 'i' for iOS simulator
```

- Backend URL: `http://localhost:5000`
- WebView works out of the box
- Test with Safari dev tools

### **Android Emulator:**

```bash
npx expo start
# Press 'a' for Android emulator
```

- Backend URL: `http://10.0.2.2:5000` (emulator special IP)
- Or use your local IP: `http://192.168.1.34:5000`
- WebView requires HTTPS in production (test mode OK)

### **Physical Device:**

```bash
npx expo start
# Scan QR code with Expo Go
```

- Backend URL: `http://192.168.1.34:5000` (your machine's IP)
- Device and machine must be on same WiFi
- May need to disable firewall temporarily

---

## ✅ **Success Criteria**

Your payment integration is working if:

1. ✅ **Demo Mode:**
   - Payment screen opens
   - WebView loads demo URL
   - Success message appears after 2 seconds
   - No errors in console

2. ✅ **Production Mode:**
   - Fatora payment page loads
   - Test card completes payment
   - Success/failure detected correctly
   - Webhook received (optional)

---

## 🎯 **Next Steps After Testing**

Once testing is complete:

1. **Production Deployment:**
   - Get production Fatora API key
   - Update `.env` with production key
   - Test with real cards (small amounts)

2. **App Store Submission:**
   - Ensure all dev features removed
   - Test payment flow on TestFlight/Internal Testing
   - Provide test account for App Store review

3. **Monitoring:**
   - Set up payment success/failure tracking
   - Monitor Fatora webhook deliveries
   - Track payment conversion rates

---

## 📞 **Need Help?**

### **Check These First:**
1. Backend logs: `backend/logs/combined.log`
2. Mobile app console (Expo logs)
3. Network tab (browser dev tools for WebView)

### **Common Issues:**
- **"Backend connection failed"** → Check backend is running
- **"Payment initialization failed"** → Check Fatora API key
- **WebView blank** → Check URL is correct
- **Success not detected** → Check URL patterns in `PaymentWebView.tsx`

---

## 🎉 **You're Ready to Test!**

**Start backend → Start app → Navigate to payment → Test with demo mode → Test with Fatora test cards → Celebrate!** 🚀

---

**Files Created:**
- ✅ `src/components/PaymentWebView.tsx`
- ✅ `src/services/paymentService.ts`
- ✅ `src/app/(modals)/payment.tsx`
- ✅ `backend/src/routes/payments.routes.ts`
- ✅ `backend/src/services/DemoModeService.ts`
- ✅ `backend/src/services/DemoModeWebSocketService.ts`

**Documentation:**
- 📚 `FATORA_MOBILE_INTEGRATION.md` - Complete integration guide
- 📚 `PAYMENT_INTEGRATION_FINAL_DECISION.md` - Why WebView approach
- 📚 `🧪_PAYMENT_TESTING_GUIDE.md` - This testing guide

**Status:** ✅ **Ready to Test!**

