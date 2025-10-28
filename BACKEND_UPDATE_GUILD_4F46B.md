# 🔧 **UPDATE BACKEND TO USE `guild-4f46b`**

## Date: October 22, 2025, 09:55 UTC

---

## 🎯 **BACKEND ENVIRONMENT VARIABLES FOR RENDER**

### **Go to Render Dashboard:**
https://dashboard.render.com/

### **Select your backend service** (guild-yf7q or similar)

### **Click "Environment" tab**

---

## 📋 **UPDATE THESE VARIABLES:**

### **1. FIREBASE_PROJECT_ID**
```
guild-4f46b
```

### **2. FIREBASE_CLIENT_EMAIL**
```
firebase-adminsdk-fbsvc@guild-4f46b.iam.gserviceaccount.com
```

### **3. FIREBASE_PRIVATE_KEY**
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMlmUktl3TUgxd
bVR+QD3H+1v1cyk/062R9Z2+BnNsy4Yc6naueygZGx5+iZpQUuppSP6jM4RV2AB8
AJzE87sX3Lc3nk5xIB6ecBq2jUoeQo+QA6YAL/oYt7U0S5J3rLtbq3J6jR+Ryq9N
AgiXkKdGgfr9LrQvNizZML2tHiymLzRe0LQJs/O7BOWWyMW40KyJt2fCODaTfkwj
vyy3uxnV0+17Y1tmTNz6ZO05cVp86V+4mnSQaYbgHp34liEt/UhOejXkiPFA2cIY
ZMNZNdVbkJ6NKB1WRDxVmBWcp2cMrIqFDDcveD3E0o1JQdbG9HB38Cfr5n1/neNj
6wFbOHWZAgMBAAECggEAAJxJ4ZP/eIuHxIQBGujPCIVwd4LOkHix76rd7u//7IKw
Kv+WpjWkeUosD46J5VAzGGh3/P2NmSzp73TLRzvYsYNviCFBxarZGmjMoXltMdP9
FiZuPK7F1ci20q4pDTsa5Cg8+8hN04NQwgCjQEJmretZtdJN0uDGrMBxplKROoqn
JdAgVgKEXn2z1dSDvHrgvqZLq5wKOLL0ZHmczWO5LenpUYE/KBt+PbI+HvYoH1VL
KlAt+i3YkElgmNt+JbV4zF08sOGUyQRV0rHTuISgXgD8K4lNHSizPNny0KygfH8r
EZz6ALg7d7YdZglvLNs3qlGE9Sx5wvim7SJ1woKTQwKBgQD7Ln0fKEo+V+i5MoYE
qvPQlwrkgb9m/LiGEYgUseKhMWLCJ87tGfp1j+86WMcRWpZ3fyjHgsPbadiG+CJi
wu+lebFMjBMd8a2QLuKut0z6BQgadICjGObiKZ6JdvYvfacwsBj7Q43vWnh9KAD5
SqqSh7C0hTvKDjUIQEmHoBOqxwKBgQDQgxcgz4p2JquxyAehbTpVkC7dWV+X8si1
UguIgh/7+bb8Ljs0zhxz6LbHKW6dlC/1WWmdv45FDeQ9h1Z1l1EKgHAWhr+ngNhH
QO20iQUmnEdyyhBDkyyS6mlAG21JdhQDatxC/sNFSEv0yoKEs+5s944F45cxqHUp
9Z1sxG98nwKBgQCu/PcsMqxufF3kT59wNwy+v8tV4FJQ1DVVKXeNO1QwijBMJOGS
6utC5bB7DIg6vcpfm5X0UFRUUowHk2yZM0czF/F964QR82HANfm0UHzvHXxEue84
MMwAuY/6IodmFHraf4QX4DtMidGxF6J+CheFF8TyLnO102n8wpS3SL0K1wKBgBXI
zF7KMB4d9iwxyNJNth2AXdUUZE9ctylyc/AEIFFUCpEYR2lB62kUtBvksUDXXZdV
ixpHDBcc126yOA87CuV8+7juxRE7/dyb5PnKovYgt7o/cCmPM8X5pZtkAiv9oSOm
Q3LgaQhRAFaH3dD9d3h8+KKW35H5lpwWpCbb8wXjAoGBAJcLLv8KL1B8LWIYYemQ
tdpra/mQv0JpWMpFhGY3Z7AuChq194z/Jpf8yJhghtfNRr+CcUjdPG6YwNsn4+mp
cKFosyQ7vEAu9GfKNN1iVdjDV3o5w72MKchHojOlWwbc5vAPV38z2pbPd7GO6Mr3
5uWAs8kxXMS1NVrtV4/4Bk9B
-----END PRIVATE KEY-----
```

**⚠️ IMPORTANT:** Copy the ENTIRE private key including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines, with all the `\n` characters!

---

## 🚀 **AFTER UPDATING:**

1. **Click "Save Changes"**
2. **Render will automatically redeploy** (takes 2-3 minutes)
3. **Wait for deployment to complete**
4. **Check logs** to verify it's using `guild-4f46b`

---

## ✅ **EXPECTED LOGS:**

```
🔥 ENV CHECK:
projectId: "guild-4f46b"
clientEmail: "firebase-adminsdk-fbsvc@guild-4f46b.iam.gserviceaccount.com"
✅ 🔥 Firebase Admin SDK initialized in middleware
```

---

**GO TO RENDER NOW AND UPDATE THESE 3 VARIABLES!**

https://dashboard.render.com/


