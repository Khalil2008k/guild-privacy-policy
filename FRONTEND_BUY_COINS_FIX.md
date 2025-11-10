# 🔧 Frontend Fix: Buy Coins with Sadad

Your backend is live, but your frontend is calling the wrong endpoint!

## ✅ Backend URL
```
https://guild-yf7q.onrender.com
```

## ❌ Current Problem

Your app is calling:
```
POST /api/payments/web-checkout/initiate
→ Returns HTTP 502 (not found)
```

## ✅ Correct Endpoint

For buying coins:
```
POST /api/coins/purchase/sadad/initiate
```

---

## 🔧 Fix Your Frontend Code

### Find and Update Payment Service

Look for your payment service file (probably `src/services/paymentService.ts` or similar):

**BEFORE (Wrong):**
```typescript
const initiatePayment = async (amount: number, userId: string) => {
  const response = await fetch(
    `${BACKEND_URL}/api/payments/web-checkout/initiate`, // ❌
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        amount,
        email: user.email,
        phone: user.phone,
        // ...
      })
    }
  );
};
```

**AFTER (Correct):**
```typescript
const buyCoinsSadad = async (coinPackageId: string, userEmail: string, userMobile: string, authToken: string) => {
  const BACKEND_URL = 'https://guild-yf7q.onrender.com';
  
  const response = await fetch(
    `${BACKEND_URL}/api/coins/purchase/sadad/initiate`, // ✅ Correct
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`, // ✅ Required!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coinPackageId: coinPackageId, // 'bronze_50', 'silver_100', 'gold_500', 'platinum_1000'
        email: userEmail,
        mobileNo: userMobile,
        language: 'ENG'
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
};
```

---

## 📱 Complete React Native Example

```typescript
// src/services/coinPurchaseService.ts

import auth from '@react-native-firebase/auth';

const BACKEND_URL = 'https://guild-yf7q.onrender.com';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceQAR: number;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'bronze_50', name: 'Bronze Pack', coins: 50, priceQAR: 5 },
  { id: 'silver_100', name: 'Silver Pack', coins: 100, priceQAR: 10 },
  { id: 'gold_500', name: 'Gold Pack', coins: 500, priceQAR: 50 },
  { id: 'platinum_1000', name: 'Platinum Pack', coins: 1000, priceQAR: 100 }
];

export const initiateCoinPurchase = async (
  coinPackageId: string
): Promise<{
  orderId: string;
  amount: number;
  coins: number;
  formPayload: {
    action: string;
    method: string;
    fields: Record<string, string>;
  };
}> => {
  try {
    // Get Firebase auth token
    const token = await auth().currentUser?.getIdToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    // Get user details
    const user = auth().currentUser;
    if (!user || !user.email) {
      throw new Error('User email not available');
    }

    // Get phone number (you might need to get this from Firestore)
    const userPhone = user.phoneNumber || '50123456'; // Fallback

    console.log('🔐 BackendAPI: Sending request with token', {
      endpoint: '/api/coins/purchase/sadad/initiate',
      hasBearer: true,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...'
    });

    // Call backend API
    const response = await fetch(
      `${BACKEND_URL}/api/coins/purchase/sadad/initiate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coinPackageId,
          email: user.email,
          mobileNo: userPhone,
          language: 'ENG'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Backend error response:', errorText);
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Payment initiation failed');
    }

    console.log('✅ Coin purchase initiated:', {
      orderId: result.data.orderId,
      coins: result.data.coins,
      amount: result.data.amount
    });

    return result.data;
  } catch (error) {
    console.log('[ERROR] ❌ Coin purchase initiation failed:', error);
    throw error;
  }
};
```

---

## 🎨 UI Component

```typescript
// src/screens/BuyCoinsScreen.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { COIN_PACKAGES, initiateCoinPurchase } from '../services/coinPurchaseService';

const BuyCoinsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    
    try {
      const result = await initiateCoinPurchase(packageId);
      
      // Generate HTML for payment
      const html = generatePaymentHTML(result.formPayload);
      
      // Navigate to WebView
      navigation.navigate('PaymentWebView', { 
        html,
        orderId: result.orderId,
        coins: result.coins
      });
    } catch (error) {
      Alert.alert(
        'Purchase Failed',
        error.message || 'Unable to initiate payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentHTML = (formPayload: any): string => {
    const fields = Object.entries(formPayload.fields)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n      ');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Processing Payment...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .loader {
      text-align: center;
      color: white;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h2>Redirecting to Payment...</h2>
    <p>Please wait...</p>
  </div>
  
  <form id="paymentForm" method="${formPayload.method}" action="${formPayload.action}">
    ${fields}
  </form>
  
  <script>
    setTimeout(() => {
      document.getElementById('paymentForm').submit();
    }, 1000);
  </script>
</body>
</html>
    `;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buy Coins 🪙</Text>
      
      {COIN_PACKAGES.map((pkg) => (
        <TouchableOpacity
          key={pkg.id}
          style={styles.package}
          onPress={() => handlePurchase(pkg.id)}
          disabled={loading}
        >
          <Text style={styles.coins}>🪙 {pkg.coins} Coins</Text>
          <Text style={styles.price}>{pkg.priceQAR} QAR</Text>
          <Text style={styles.name}>{pkg.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  package: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  coins: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 20,
    color: '#667eea',
    marginTop: 8,
  },
  name: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
});

export default BuyCoinsScreen;
```

---

## ✅ Quick Summary

1. **Backend URL:** `https://guild-yf7q.onrender.com`
2. **Correct Endpoint:** `/api/coins/purchase/sadad/initiate`
3. **Required Header:** `Authorization: Bearer {firebase-token}`
4. **Request Body:**
   ```json
   {
     "coinPackageId": "gold_500",
     "email": "user@example.com",
     "mobileNo": "50123456",
     "language": "ENG"
   }
   ```

---

## 🚀 Test Right Now!

Once you:
1. ✅ Add the 5 Sadad environment variables to Render
2. ✅ Update your frontend code to use the correct endpoint
3. ✅ Wait for Render to redeploy

Then you can **test buying coins from your app!** 🪙

---

**Need help with the frontend code? Let me know which file to update!**



