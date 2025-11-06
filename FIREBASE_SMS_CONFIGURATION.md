# 🔧 Firebase Console Configuration for SMS Authentication

## **Required Firebase Console Settings**

### **1. Enable Phone Authentication Provider**

1. Go to [Firebase Console](https://console.firebase.google.com/project/guild-4f46b/authentication/providers)
2. Navigate to **Authentication > Sign-in method**
3. Enable **Phone** provider
4. Configure test phone numbers (for development):
   - `+1 650-555-3434` (test code: `123456`)
   - `+1 650-555-3435` (test code: `123456`)

### **2. Configure App Verification (Critical)**

#### **For Android (EAS Builds):**

1. Go to **Project Settings > General**
2. Add your Android app with package name: `com.mazen123333.guild`
3. Download `google-services.json`
4. Get SHA-1 and SHA-256 fingerprints:

```bash
# For debug builds
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release builds (if you have the keystore)
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

5. Add SHA-1 and SHA-256 to Firebase Console under **Project Settings > General > Your Android App**

#### **For iOS (EAS Builds):**

1. Add your iOS app with bundle ID: `com.mazen123333.guild`
2. Download `GoogleService-Info.plist`
3. Add to your iOS app configuration

### **3. Enable App Check (Production Only)**

1. Go to **App Check** in Firebase Console
2. Register your apps:
   - **Android**: Use Play Integrity API
   - **iOS**: Use App Attest
   - **Web**: Use reCAPTCHA v3

3. Configure enforcement:
   - **Authentication**: Enforce App Check
   - **Firestore**: Enforce App Check
   - **Storage**: Enforce App Check

### **4. Configure reCAPTCHA (Web/Expo Go)**

1. Go to **Authentication > Settings**
2. Under **Authorized domains**, add:
   - `localhost` (for development)
   - `guild-4f46b.firebaseapp.com`
   - Your production domain

3. Configure reCAPTCHA:
   - **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` (test key)
   - **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` (test key)

### **5. SMS Quota Configuration**

1. Go to **Authentication > Settings**
2. Under **SMS settings**:
   - **Daily quota**: Set appropriate limit (default: 100 SMS/day)
   - **Rate limiting**: Enable to prevent abuse
   - **Test phone numbers**: Add development numbers

### **6. Security Rules Update**

Ensure Firestore rules allow phone authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow phone verification data
    match /phoneVerifications/{verificationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## **Environment-Specific Configuration**

### **Development (Expo Go):**
- Use test phone numbers
- Disable App Check enforcement
- Use test reCAPTCHA keys
- Enable debug logging

### **Production (EAS Builds):**
- Use real phone numbers
- Enable App Check enforcement
- Use production reCAPTCHA keys
- Enable rate limiting
- Monitor SMS quota usage

## **Validation Checklist**

- [ ] Phone authentication provider enabled
- [ ] Test phone numbers configured
- [ ] SHA-1/SHA-256 fingerprints added (Android)
- [ ] Bundle ID configured (iOS)
- [ ] App Check configured (production)
- [ ] reCAPTCHA keys configured
- [ ] SMS quota limits set
- [ ] Security rules updated
- [ ] Authorized domains configured

## **Testing Commands**

```bash
# Test environment detection
npx expo start --clear

# Test in Expo Go
# Navigate to /firebase-sms-test screen

# Test in EAS build
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

## **Troubleshooting**

### **Common Issues:**

1. **"This app is not authorized to use Firebase Auth API"**
   - Solution: Add correct SHA-1/SHA-256 fingerprints

2. **"reCAPTCHA verification failed"**
   - Solution: Check authorized domains and reCAPTCHA keys

3. **"SMS quota exceeded"**
   - Solution: Increase quota or use test phone numbers

4. **"Invalid phone number format"**
   - Solution: Ensure phone numbers include country code (+1, +44, etc.)

### **Debug Steps:**

1. Check Firebase Console logs
2. Verify app configuration
3. Test with different phone numbers
4. Check network connectivity
5. Verify Firebase project ID matches












