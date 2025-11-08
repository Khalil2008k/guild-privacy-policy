# 🚀 Sadad WebCheckout - Render Setup & Testing Guide

## ✅ Your Backend is on Render - Let's Test Coin Purchases! 🪙

Since your backend is already deployed on Render, we just need to:
1. Add Sadad environment variables to Render
2. Redeploy
3. Test from your mobile app

---

## 📋 Step 1: Add Environment Variables to Render

### 1. Go to your Render Dashboard
- Navigate to: https://dashboard.render.com
- Select your backend service

### 2. Go to "Environment" Tab
Click on the **"Environment"** tab in your service settings

### 3. Add Sadad Variables

Click **"Add Environment Variable"** and add these **5 variables**:

#### Variable 1:
```
Key: SADAD_MERCHANT_ID
Value: 2334863
```

#### Variable 2:
```
Key: SADAD_SECRET_KEY
Value: +efrWl1GCKwPzJaR
```

#### Variable 3:
```
Key: SADAD_BASE_URL
Value: https://sadadqa.com/webpurchase
```

#### Variable 4:
```
Key: SADAD_WEBSITE
Value: www.guildapp.com
```

#### Variable 5:
```
Key: BASE_URL
Value: https://your-backend-url.onrender.com
```
**Replace `your-backend-url` with your actual Render URL!**

For example:
```
BASE_URL=https://guild-backend-abc123.onrender.com
```

### 4. Save Changes
Click **"Save Changes"** - this will automatically trigger a redeploy!

---

## ⏳ Step 2: Wait for Deployment

- Watch the **"Logs"** tab
- Wait for the deployment to complete (usually 2-5 minutes)
- Look for: `✅ Server started successfully on port 3000`

---

## 📱 Step 3: Test from Your Mobile App

### API Endpoint for Coin Purchase

Your app should call:

```
POST https://your-backend-url.onrender.com/api/coins/purchase/sadad/initiate
```

### Request Example

```typescript
// In your React Native app
const buyCo ins = async (coinPackageId: string) => {
  try {
    // Get Firebase auth token
    const token = await auth().currentUser?.getIdToken();
    
    // Get user details
    const user = auth().currentUser;
    
    // Call backend API
    const response = await fetch(
      'https://your-backend-url.onrender.com/api/coins/purchase/sadad/initiate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coinPackageId: coinPackageId,  // e.g., 'gold_100'
          email: user.email,
          mobileNo: user.phoneNumber || '50123456',
          language: 'ENG'  // or 'ARB' for Arabic
        })
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      // Open payment page
      const { formPayload } = result.data;
      openSadadPayment(formPayload);
    }
  } catch (error) {
    console.error('Coin purchase error:', error);
  }
};
```

### Available Coin Packages

Check your coin catalog, but typical packages might be:

```typescript
// Example packages (adjust based on your catalog)
const coinPackages = [
  { id: 'bronze_50', coins: 50, priceQAR: 5 },
  { id: 'silver_100', coins: 100, priceQAR: 10 },
  { id: 'gold_500', coins: 500, priceQAR: 50 },
  { id: 'platinum_1000', coins: 1000, priceQAR: 100 }
];
```

Or use custom amount:

```typescript
body: JSON.stringify({
  customAmount: 25.00,  // 25 QAR = 250 coins
  email: user.email,
  mobileNo: user.phoneNumber,
  language: 'ENG'
})
```

---

## 🎨 Frontend Implementation (React Native)

### Full Example - Buy Coins Screen

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import auth from '@react-native-firebase/auth';

const BACKEND_URL = 'https://your-backend-url.onrender.com';

const BuyCoinsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  const coinPackages = [
    { id: 'silver_100', name: '100 Coins', coins: 100, price: 10, popular: false },
    { id: 'gold_500', name: '500 Coins', coins: 500, price: 50, popular: true },
    { id: 'platinum_1000', name: '1000 Coins', coins: 1000, price: 100, popular: false },
  ];

  const purchaseCoins = async (packageId: string) => {
    setLoading(true);
    
    try {
      // Get Firebase token
      const token = await auth().currentUser?.getIdToken();
      const user = auth().currentUser;

      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Call initiate API
      const response = await fetch(
        `${BACKEND_URL}/api/coins/purchase/sadad/initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            coinPackageId: packageId,
            email: user.email,
            mobileNo: user.phoneNumber || '50123456',
            language: 'ENG'
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        const { formPayload, coins, amount } = result.data;
        
        Alert.alert(
          'Purchase Confirmation',
          `You are about to purchase ${coins} coins for ${amount} QAR`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => {
                // Generate HTML for payment
                const html = generatePaymentHTML(formPayload);
                navigation.navigate('PaymentWebView', { html });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to initiate purchase');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to connect to payment gateway');
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentHTML = (formPayload) => {
    const fields = Object.entries(formPayload.fields)
      .map(([key, value]) => 
        `<input type="hidden" name="${key}" value="${value}" />`
      )
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
    h2 { margin: 20px 0; font-size: 24px; font-weight: 600; }
    p { margin: 10px 0; opacity: 0.9; font-size: 16px; }
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
      <Text style={styles.subtitle}>Choose a package</Text>

      {coinPackages.map((pkg) => (
        <TouchableOpacity
          key={pkg.id}
          style={[styles.package, pkg.popular && styles.popularPackage]}
          onPress={() => purchaseCoins(pkg.id)}
          disabled={loading}
        >
          {pkg.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}
          
          <Text style={styles.packageCoins}>🪙 {pkg.coins} Coins</Text>
          <Text style={styles.packageName}>{pkg.name}</Text>
          <Text style={styles.packagePrice}>{pkg.price} QAR</Text>
          
          <View style={styles.buyButton}>
            <Text style={styles.buyButtonText}>
              {loading ? 'Processing...' : 'Buy Now'}
            </Text>
          </View>
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
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: #6b7280',
    marginBottom: 24,
  },
  package: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  popularPackage: {
    borderColor: '#667eea',
    backgroundColor: '#f5f7ff',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  packageCoins: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 16,
  },
  buyButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BuyCoinsScreen;
```

### Payment WebView Screen

```typescript
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const PaymentWebView = ({ route, navigation }) => {
  const { html } = route.params;

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    
    // Check if returned from payment
    if (url.includes('payment-success')) {
      const orderId = extractParam(url, 'orderId');
      const coins = extractParam(url, 'coins');
      
      navigation.replace('PaymentSuccess', { orderId, coins });
    } else if (url.includes('payment-failed')) {
      navigation.replace('PaymentFailed');
    }
  };

  const extractParam = (url: string, param: string) => {
    const match = url.match(new RegExp(`${param}=([^&]+)`));
    return match ? match[1] : null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ html }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PaymentWebView;
```

---

## 🧪 Step 4: Test the Flow

### Test in Sadad Sandbox

1. **Open your app**
2. **Navigate to Buy Coins screen**
3. **Select a coin package**
4. **Click "Buy Now"**
5. **You'll be redirected to Sadad sandbox payment page**
6. **Use Sadad test cards** (contact Sadad for test credentials)
7. **Complete payment**
8. **You'll be redirected back with success/failure**

### Check Results

After successful payment:
- ✅ Check your Render logs: `https://dashboard.render.com → Your Service → Logs`
- ✅ Look for: `✅ Coin purchase callback processed`
- ✅ Verify coins were added to user wallet in Firestore
- ✅ Check `coin_purchases` collection for the order
- ✅ Check `transactions` collection for the transaction record

---

## 🔍 Debugging on Render

### View Live Logs

```bash
# In Render Dashboard → Logs tab
# Look for these log messages:

💰 Initiating coin purchase with Sadad
✅ Generated Sadad signature for coin purchase
💾 Coin purchase order stored
📥 Received Sadad callback for coin purchase
✅ Signature validated for coin purchase
💰 User coins credited successfully
✅ Coin purchase callback processed
```

### Check Environment Variables

```bash
# In Render Dashboard → Environment tab
# Verify all 5 Sadad variables are set:

✅ SADAD_MERCHANT_ID
✅ SADAD_SECRET_KEY
✅ SADAD_BASE_URL
✅ SADAD_WEBSITE
✅ BASE_URL
```

### Test API Directly

Use curl or Postman to test the API:

```bash
curl -X POST https://your-backend-url.onrender.com/api/coins/purchase/sadad/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "coinPackageId": "gold_500",
    "email": "test@guildapp.com",
    "mobileNo": "50123456",
    "language": "ENG"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "orderId": "COIN_abc12345_1699368000000",
    "amount": 50,
    "coins": 500,
    "packageName": "Gold Package",
    "formPayload": {
      "action": "https://sadadqa.com/webpurchase",
      "method": "POST",
      "fields": {
        "merchant_id": "2334863",
        "ORDER_ID": "COIN_abc12345_1699368000000",
        "TXN_AMOUNT": "50.00",
        "signature": "..."
      }
    }
  }
}
```

---

## 📊 Firestore Collections

### After Purchase, Check These Collections:

#### 1. `coin_purchases`
```javascript
{
  orderId: "COIN_abc12345_1699368000000",
  userId: "firebase_user_id",
  coinPackageId: "gold_500",
  packageName: "Gold Package",
  amount: 50,
  coins: 500,
  currency: "QAR",
  status: "completed",  // pending | completed | failed
  paymentMethod: "sadad",
  gatewayTransactionId: "TXN_12345",
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

#### 2. `wallets` (user wallet)
```javascript
{
  userId: "firebase_user_id",
  balances: {
    GOLD: 500  // Coins added!
  },
  totalCoins: 500,
  totalValueQAR: 50,
  updatedAt: Timestamp
}
```

#### 3. `transactions`
```javascript
{
  userId: "firebase_user_id",
  transactionType: "coin_purchase",
  amount: 50,
  currency: "QAR",
  coins: 500,
  status: "completed",
  description: "Coin purchase via Sadad - 500 coins",
  referenceId: "COIN_abc12345_1699368000000",
  gatewayTransactionId: "TXN_12345",
  createdAt: Timestamp
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Sadad configuration is incomplete"
**Solution:** Make sure all 5 environment variables are set on Render and redeployed.

### Issue 2: Callback not received
**Solution:** 
- Verify `BASE_URL` is set to your Render URL
- Check Render logs for incoming requests
- Ensure your Render service is not in "Suspended" state

### Issue 3: Signature validation fails
**Solution:**
- Verify `SADAD_SECRET_KEY` is exactly: `+efrWl1GCKwPzJaR`
- Check Render logs for signature mismatch details

### Issue 4: Coins not credited
**Solution:**
- Check Render logs for errors in `creditUserCoins` function
- Verify Firestore permissions allow writes
- Check `coin_purchases` collection for order status

---

## 🎯 Quick Checklist

Before testing from your app:

- [ ] ✅ Added all 5 Sadad env variables to Render
- [ ] ✅ Set BASE_URL to your Render URL
- [ ] ✅ Service redeployed successfully
- [ ] ✅ Checked logs for "Server started successfully"
- [ ] ✅ Tested API with curl/Postman (optional)
- [ ] ✅ Implemented frontend code in mobile app
- [ ] ✅ Added deep linking for `guildapp://payment-success`
- [ ] ✅ Ready to buy coins! 🎉

---

## 🚀 Ready to Test!

Your backend is configured and ready on Render. Just:

1. **Add the 5 environment variables** to Render
2. **Wait for redeploy** (2-5 minutes)
3. **Open your mobile app**
4. **Try buying coins!** 🪙

---

**Need Help?**
- Check Render logs for errors
- Verify all env variables are set
- Test API endpoint with curl first
- Check Firestore for data

**Everything working?** 🎉
- You'll see coins added to your wallet
- Transaction recorded in Firestore
- Payment success screen displayed

---

**Happy Testing!** 🚀💰


