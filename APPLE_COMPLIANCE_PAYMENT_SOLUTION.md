# 🍎 Apple App Store Compliance - External Payment Solution

## Problem Statement

**Apple Guideline 3.1.1 – Business – Payments – In-App Purchase**

The app was rejected because:
- App sells Guild Coins using native or web payment (non-Apple system)
- Apple requires all digital purchases inside iOS apps to use In-App Purchase (IAP) only
- External PSP/webview payments are not allowed for digital goods inside iOS apps

## Solution: External Browser Payment

**For iOS:**
- ✅ Open payment in Safari (external browser) - NOT inside app
- ✅ Disable in-app digital purchases
- ✅ Use deep linking to return to app after payment

**For Android:**
- ✅ Can still use WebView (or also external browser for consistency)

---

## Implementation Strategy

### 1. **Platform Detection**
- Detect iOS vs Android
- iOS: Use external browser (Safari)
- Android: Can use WebView or external browser

### 2. **External Browser Flow**
```
iOS User Flow:
1. User clicks "Pay"
2. App opens Safari with payment URL
3. User completes payment in Safari
4. Payment gateway redirects to success URL
5. Deep link returns user to app
6. App verifies payment and updates wallet
```

### 3. **Deep Linking**
- Configure deep link: `guild://payment/success?transaction_id=XXX&order_id=XXX`
- Handle deep link in app to verify payment
- Update wallet after verification

### 4. **Disable In-App Purchases (iOS)**
- Hide coin purchase buttons on iOS
- Show message: "Please visit our website to purchase coins"
- Or redirect to external website

---

## Files to Update

1. ✅ `PaymentWebView.tsx` - Detect iOS, use external browser
2. ✅ `payment.tsx` - Use external browser on iOS
3. ✅ `coin-store.tsx` - Disable purchases on iOS, use external browser
4. ✅ `paymentService.ts` - Add deep link handling
5. ✅ `app.json` / `app.config.js` - Configure deep links
6. ✅ Add deep link handler in root layout

---

## Deep Link Configuration

### App Configuration
```json
{
  "expo": {
    "scheme": "guild",
    "ios": {
      "associatedDomains": ["applinks:guild.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "guild",
              "host": "payment"
            }
          ]
        }
      ]
    }
  }
}
```

### Deep Link URLs
- Success: `guild://payment/success?transaction_id=XXX&order_id=XXX`
- Failure: `guild://payment/failure?order_id=XXX&error=XXX`
- Cancel: `guild://payment/cancel?order_id=XXX`

---

## Backend Changes

### Update Success/Failure URLs
- Success URL: `guild://payment/success?transaction_id={transaction_id}&order_id={order_id}`
- Failure URL: `guild://payment/failure?order_id={order_id}&error={error}`
- Cancel URL: `guild://payment/cancel?order_id={order_id}`

### Alternative: Web Redirect
- Success URL: `https://guild.app/payment/success?transaction_id={transaction_id}&order_id={order_id}`
- Web page redirects to deep link: `guild://payment/success?...`

---

## Implementation Steps

1. ✅ Create external browser payment utility
2. ✅ Update PaymentWebView to detect iOS
3. ✅ Update payment modals to use external browser
4. ✅ Configure deep links
5. ✅ Add deep link handler
6. ✅ Update backend success/failure URLs
7. ✅ Test on iOS device

---

**Status:** Ready for Implementation

