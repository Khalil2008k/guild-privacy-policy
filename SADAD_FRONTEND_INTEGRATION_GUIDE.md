# 🎨 Sadad WebCheckout - Frontend Integration Guide

## Quick Start Guide for Frontend Developers

This guide shows you how to integrate Sadad WebCheckout payments into your React Native/Web application.

---

## 📋 Overview

The payment flow is simple:
1. User clicks "Add Funds" button
2. Call backend API to initiate payment
3. Auto-submit generated form to Sadad
4. User completes payment on Sadad's secure page
5. User redirected back with success/error status

---

## 🚀 Step-by-Step Integration

### Step 1: Create Payment Button

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

const PaymentButton = ({ userId, userEmail, userPhone, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('100.00');

  const handlePayment = async () => {
    setLoading(true);
    try {
      await initiateSadadPayment(amount, userEmail, userPhone, authToken);
    } catch (error) {
      alert('Payment initialization failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePayment} 
      disabled={loading}
      style={styles.button}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Add Funds (QAR {amount})</Text>
      )}
    </TouchableOpacity>
  );
};
```

---

### Step 2: API Integration Function

```typescript
/**
 * Initiate Sadad Payment
 * 
 * @param amount - Payment amount (e.g., 150.50)
 * @param email - User email
 * @param mobileNo - User mobile number (8+ digits)
 * @param authToken - Firebase authentication token
 */
const initiateSadadPayment = async (
  amount: string,
  email: string,
  mobileNo: string,
  authToken: string
) => {
  const API_BASE_URL = 'https://your-backend-url.com';
  
  try {
    // Step 1: Call backend to initiate payment
    const response = await fetch(
      `${API_BASE_URL}/api/v1/payments/sadad/web-checkout/initiate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          email,
          mobileNo,
          language: 'ENG', // or 'ARB' for Arabic
          metadata: {
            source: 'mobile_app',
            userId: 'user_123'
          }
        })
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Payment initialization failed');
    }

    // Step 2: Get form payload
    const { orderId, formPayload } = result.data;
    
    console.log('Payment Order ID:', orderId);
    console.log('Redirecting to Sadad...');

    // Step 3: Open Sadad payment page (Web)
    if (typeof window !== 'undefined') {
      openSadadPaymentWeb(formPayload);
    } 
    // For React Native
    else {
      openSadadPaymentMobile(formPayload);
    }

    return orderId;
  } catch (error) {
    console.error('Payment initiation error:', error);
    throw error;
  }
};
```

---

### Step 3: Form Submission (Web)

```typescript
/**
 * Auto-submit form to Sadad (Web)
 */
const openSadadPaymentWeb = (formPayload: any) => {
  // Create a hidden form
  const form = document.createElement('form');
  form.method = formPayload.method;
  form.action = formPayload.action;
  form.style.display = 'none';

  // Add all form fields
  Object.entries(formPayload.fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  // Add to document and submit
  document.body.appendChild(form);
  form.submit();
  
  // Form will redirect user to Sadad payment gateway
};
```

---

### Step 4: Form Submission (React Native)

```typescript
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Open Sadad payment page in WebView (React Native)
 */
const openSadadPaymentMobile = (formPayload: any) => {
  // Generate HTML with auto-submit form
  const html = generatePaymentFormHTML(formPayload);
  
  // Open in WebView or external browser
  // Option 1: WebView (recommended)
  navigation.navigate('PaymentWebView', { html });
  
  // Option 2: External browser
  // const url = buildPaymentURL(formPayload);
  // Linking.openURL(url);
};

/**
 * Generate HTML for auto-submit form
 */
const generatePaymentFormHTML = (formPayload: any): string => {
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
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h2>Redirecting to Payment Gateway...</h2>
    <p>Please wait...</p>
  </div>
  
  <form id="paymentForm" method="${formPayload.method}" action="${formPayload.action}">
    ${fields}
  </form>
  
  <script>
    // Auto-submit form after 1 second
    setTimeout(() => {
      document.getElementById('paymentForm').submit();
    }, 1000);
  </script>
</body>
</html>
  `;
};
```

---

### Step 5: WebView Component (React Native)

```tsx
import React from 'react';
import { WebView } from 'react-native-webview';
import { SafeAreaView, StyleSheet } from 'react-native';

const PaymentWebView = ({ route, navigation }) => {
  const { html } = route.params;

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    
    // Check if user returned from payment
    if (url.includes('payment-success')) {
      const orderId = extractOrderIdFromURL(url);
      navigation.navigate('PaymentSuccess', { orderId });
    } else if (url.includes('payment-failed')) {
      navigation.navigate('PaymentFailed');
    }
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

const extractOrderIdFromURL = (url: string): string | null => {
  const match = url.match(/orderId=([^&]+)/);
  return match ? match[1] : null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

### Step 6: Handle Deep Links

#### iOS (Info.plist)
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>guildapp</string>
    </array>
  </dict>
</array>
```

#### Android (AndroidManifest.xml)
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="guildapp" />
</intent-filter>
```

#### React Native Deep Link Handler
```typescript
import { Linking } from 'react-native';
import { useEffect } from 'react';

const usePaymentDeepLinks = () => {
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      
      if (url.includes('guildapp://payment-success')) {
        const orderId = extractOrderIdFromURL(url);
        navigation.navigate('PaymentSuccess', { orderId });
      } else if (url.includes('guildapp://payment-failed')) {
        navigation.navigate('PaymentFailed');
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);
};
```

---

### Step 7: Check Payment Status

```typescript
/**
 * Check payment order status
 */
const checkPaymentStatus = async (orderId: string, authToken: string) => {
  const API_BASE_URL = 'https://your-backend-url.com';
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/payments/sadad/order/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      const order = result.data;
      
      return {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        status: order.status, // 'pending' | 'success' | 'failed' | 'cancelled'
        paymentMethod: order.paymentMethod,
        transactionId: order.gatewayTransactionId,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        failureReason: order.failureReason
      };
    }
    
    throw new Error('Failed to fetch order status');
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
};
```

---

## 🎨 UI Components

### Payment Success Screen

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      const details = await checkPaymentStatus(orderId, authToken);
      setOrderDetails(details);
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={100} color="#10b981" />
      </View>
      
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.subtitle}>
        Your wallet has been credited with {orderDetails?.amount} QAR
      </Text>
      
      <View style={styles.detailsCard}>
        <DetailRow label="Order ID" value={orderId} />
        <DetailRow label="Amount" value={`${orderDetails?.amount} QAR`} />
        <DetailRow label="Status" value={orderDetails?.status} />
        {orderDetails?.transactionId && (
          <DetailRow label="Transaction ID" value={orderDetails.transactionId} />
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

---

## 🔍 Testing

### Test Data

Use these credentials for testing in sandbox mode:

```typescript
const testPaymentData = {
  amount: 100.00,
  email: 'test@guildapp.com',
  mobileNo: '12345678',
  language: 'ENG'
};
```

### Test Cards (Sadad Sandbox)

Contact Sadad for test card numbers and credentials.

---

## ⚠️ Error Handling

### Common Errors

```typescript
const handlePaymentError = (error: any) => {
  if (error.message.includes('authentication')) {
    // User not authenticated
    navigation.navigate('Login');
  } else if (error.message.includes('amount')) {
    // Invalid amount
    Alert.alert('Invalid Amount', 'Please enter a valid amount');
  } else if (error.message.includes('email')) {
    // Invalid email
    Alert.alert('Invalid Email', 'Please provide a valid email address');
  } else if (error.message.includes('mobile')) {
    // Invalid mobile
    Alert.alert('Invalid Mobile', 'Please provide a valid mobile number');
  } else {
    // Generic error
    Alert.alert('Payment Error', error.message || 'Something went wrong');
  }
};
```

---

## 📱 Complete Example

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';

const AddFundsScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  
  // Get from auth context
  const { user, authToken } = useAuth();

  const handleAddFunds = async () => {
    // Validation
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amountNum < 10) {
      Alert.alert('Minimum Amount', 'Minimum amount is 10 QAR');
      return;
    }

    if (!user?.email || !user?.phoneNumber) {
      Alert.alert('Profile Incomplete', 'Please complete your profile first');
      return;
    }

    setLoading(true);
    
    try {
      const orderId = await initiateSadadPayment(
        amount,
        user.email,
        user.phoneNumber,
        authToken
      );
      
      console.log('Payment initiated:', orderId);
      // Form will auto-submit and redirect to Sadad
    } catch (error) {
      handlePaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Funds</Text>
      <Text style={styles.subtitle}>
        Add funds to your wallet using Sadad Payment Gateway
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount (QAR)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Enter amount"
          editable={!loading}
        />
      </View>

      <View style={styles.quickAmounts}>
        {[50, 100, 200, 500].map((preset) => (
          <TouchableOpacity
            key={preset}
            style={styles.quickAmount}
            onPress={() => setAmount(String(preset))}
            disabled={loading}
          >
            <Text style={styles.quickAmountText}>{preset} QAR</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAddFunds}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Continue to Payment
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        You will be redirected to Sadad's secure payment gateway
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickAmount: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
```

---

## 🎯 Best Practices

1. **Always validate input** before calling the API
2. **Show loading states** during API calls
3. **Handle errors gracefully** with user-friendly messages
4. **Use deep links** to return to the app after payment
5. **Check payment status** after returning from Sadad
6. **Update wallet balance** after successful payment
7. **Log events** for analytics and debugging

---

## 🔗 API Endpoints

### Base URL
- **Development:** `http://localhost:3000/api/v1`
- **Production:** `https://your-backend-url.com/api/v1`

### Endpoints

1. **Initiate Payment**
   - `POST /payments/sadad/web-checkout/initiate`
   - Requires: Authentication token
   - Body: `{ amount, email, mobileNo, language, metadata }`

2. **Check Order Status**
   - `GET /payments/sadad/order/:orderId`
   - Requires: Authentication token
   - Returns: Order details and status

---

## 📞 Support

For integration issues:
- Check backend logs for errors
- Verify authentication token is valid
- Ensure all required fields are provided
- Test with sandbox credentials first

---

**Happy Coding! 🚀**



