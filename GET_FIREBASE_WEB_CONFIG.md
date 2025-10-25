# 📋 **GET FIREBASE WEB CONFIG FOR `guild-4f46b`**

## 🎯 **PLEASE DO THIS:**

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/guild-4f46b/settings/general

2. **Scroll down to "Your apps" section**

3. **Look for a Web app** (icon looks like `</>`)
   - If you see one, click the **config icon** (gear or `</>`)
   - If you DON'T see one, click **"Add app"** → Select **Web** → Register it

4. **Copy the `firebaseConfig` object**

It should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "guild-4f46b.firebaseapp.com",
  projectId: "guild-4f46b",
  storageBucket: "guild-4f46b.appspot.com",
  messagingSenderId: "623808311115",  // This is the important one!
  appId: "1:623808311115:web:...",
  measurementId: "G-..."
};
```

5. **Also check for Android app:**
   - Look for Android app in "Your apps"
   - Copy the `appId` (should be `1:623808311115:android:...`)

---

## 📱 **PASTE THE CONFIG HERE:**

Once you have it, paste the entire `firebaseConfig` object and I'll update all the files!

---

**GO TO:** https://console.firebase.google.com/project/guild-4f46b/settings/general

