# 🎨 COIN STORE REDESIGNED - NIKE STYLE

## ✨ NEW DESIGN FEATURES

### **1. Real Coin Images (77x77px)**
✅ Uses your actual coin designs from `coin design/` folder:
- `5.png` → Bronze (GBC)
- `10.png` → Silver (GSC)
- `50.png` → Gold (GGC)
- `100.png` → Platinum (GPC)
- `200.png` → Diamond (GDC)
- `500.png` → Ruby (GRC)

### **2. Nike-Style Layout**
✅ Clean card design with:
- White/dark cards (depending on theme)
- Coin image at top (77x77px)
- Coin name and value below
- Add button or quantity controls
- 2 columns grid
- Professional spacing

### **3. Rounded Header**
✅ Header with:
- Corner radius (20px)
- Black text and icons (light mode)
- White text and icons (dark mode)
- Back button, title, wallet button
- Cart summary bar when items added

### **4. Proper Payment Flow**
✅ **Step 1: Add to Cart**
- Tap + to add coins
- See cart summary at top
- Shows total quantity and QAR

✅ **Step 2: Terms Modal (Bottom Sheet)**
- Slides up from bottom
- Shows complete coin rules:
  - Purchased coins: Never expire
  - Earned coins: 24 months expiry
  - Withdrawal rules: 10-14 days
  - Security: Encrypted, unique serials
  - Legal: Virtual coins, platform use only
- Two buttons: Cancel / Accept & Pay

✅ **Step 3: Fatora Payment**
- Backend creates Fatora checkout
- Returns payment URL
- Shows confirmation modal

✅ **Step 4: Confirmation Modal**
- Shows success icon
- Displays order summary
- "You will be redirected to secure payment"
- Two buttons: Cancel / Confirm
- Opens Fatora payment page

---

## 🎯 WHAT'S DIFFERENT

### **Before:**
❌ Emoji icons instead of real coins  
❌ Gradient backgrounds everywhere  
❌ Direct purchase without terms  
❌ No payment flow  
❌ Confusing alerts  

### **After:**
✅ Real coin images (77x77px)  
✅ Clean white/dark cards  
✅ Terms modal before payment  
✅ Proper Fatora integration  
✅ Confirmation flow  
✅ Professional Nike-style design  

---

## 📱 USER FLOW

```
1. User opens Coin Store
   ↓
2. Sees 6 coins in grid with real images
   ↓
3. Taps + to add coins to cart
   ↓
4. Cart summary appears at top
   ↓
5. Taps "Checkout" button
   ↓
6. MODAL 1: Terms & Conditions slides up
   - Shows all coin rules
   - User reads and accepts
   ↓
7. Backend creates Fatora payment
   ↓
8. MODAL 2: Confirmation slides up
   - Shows order summary
   - "Redirecting to payment"
   ↓
9. User taps "Confirm"
   ↓
10. Opens Fatora payment page
    ↓
11. User completes payment
    ↓
12. Coins added to wallet
```

---

## 🎨 DESIGN SPECS

### **Header:**
- Background: Light gray (light mode) / Dark gray (dark mode)
- Corner radius: 20px
- Text color: Black (light) / White (dark)
- Icons: Black (light) / White (dark)
- Height: Auto (based on content)

### **Cards:**
- Width: (screen width - 48) / 2
- Background: White (light) / Dark gray (dark)
- Corner radius: 16px
- Padding: 12px
- Shadow: Subtle elevation
- Spacing: 16px between cards

### **Coin Images:**
- Size: 77x77px
- Position: Centered at top
- Container height: 120px
- Resize mode: Contain

### **Modals:**
- Slide from bottom
- Max height: 80% of screen
- Corner radius: 24px (top only)
- Background: White (light) / Dark (dark)
- Overlay: Black 50% opacity

---

## 🔧 TECHNICAL DETAILS

### **Image Imports:**
```typescript
const COIN_IMAGES = {
  GBC: require('../../../coin design/5.png'),
  GSC: require('../../../coin design/10.png'),
  GGC: require('../../../coin design/50.png'),
  GPC: require('../../../coin design/100.png'),
  GDC: require('../../../coin design/200.png'),
  GRC: require('../../../coin design/500.png'),
};
```

### **Payment Flow:**
```typescript
1. User taps "Checkout"
   → Shows Terms Modal

2. User accepts terms
   → Calls CoinStoreService.purchaseCoins(cart)
   → Backend creates Fatora checkout
   → Returns { paymentUrl: "https://..." }

3. Shows Confirmation Modal
   → User taps "Confirm"
   → Opens payment URL (Fatora)

4. User completes payment
   → Fatora callback to backend
   → Backend adds coins to wallet
   → User sees success
```

---

## ✅ READY TO TEST

**Reload your app:**
```
Press 'r' in Expo
```

**Then:**
1. Open wallet → Tap "Store"
2. See real coin images (77x77px)
3. Add coins to cart
4. Tap "Checkout"
5. Read terms → Tap "Accept & Pay"
6. See confirmation → Tap "Confirm"
7. (Would open Fatora payment page)

---

## 🎉 RESULT

**Professional e-commerce coin store with:**
- ✅ Real coin images
- ✅ Nike-style layout
- ✅ Proper payment flow
- ✅ Terms & conditions
- ✅ Fatora integration
- ✅ Beautiful design
- ✅ Dark/light mode
- ✅ RTL/LTR support

**Test it now!** 🚀


