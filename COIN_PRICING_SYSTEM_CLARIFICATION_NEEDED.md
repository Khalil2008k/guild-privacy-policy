# 🪙 **GUILD Coin Pricing System - Clarification Needed**

## 📋 **Current Issues**

1. ❌ Success page shows "undefined" for Order ID and Amount → **FIXED** ✅
2. ❌ WebView doesn't auto-close → **FIXED** ✅ (3-second timer)
3. ❌ Wrong coin calculation (100 coins for 10 QAR) → **NEEDS CLARIFICATION**
4. ❌ 10% markup not applied → **NEEDS IMPLEMENTATION**

---

## 💰 **Coin System Requirements (From User)**

### **Example Given:**
- **Bronze Coin Base Price:** 5 QAR
- **When Purchased:** 5 QAR + 10% = **5.5 QAR**

---

## ❓ **Questions Needed:**

### **1. What are your coin packages?**

**Option A: Coin Quantity Packages (Current)**
```typescript
{
  'bronze_50': { coins: 50, basePrice: 5, purchasePrice: 5.5 },    // 5 + 10%
  'silver_100': { coins: 100, basePrice: 10, purchasePrice: 11 },  // 10 + 10%
  'gold_500': { coins: 500, basePrice: 50, purchasePrice: 55 },    // 50 + 10%
}
```

**Option B: Coin Type System (Like Your Example)**
```typescript
{
  'bronze': { coinType: 'BRONZE', basePrice: 5, purchasePrice: 5.5, quantity: 1 },
  'silver': { coinType: 'SILVER', basePrice: 10, purchasePrice: 11, quantity: 1 },
  'gold': { coinType: 'GOLD', basePrice: 50, purchasePrice: 55, quantity: 1 },
}
```

**Option C: Mixed System**
```typescript
{
  'bronze_1': { coinType: 'BRONZE', quantity: 1, basePrice: 5, purchasePrice: 5.5 },
  'bronze_5': { coinType: 'BRONZE', quantity: 5, basePrice: 25, purchasePrice: 27.5 },
  'silver_1': { coinType: 'SILVER', quantity: 1, basePrice: 10, purchasePrice: 11 },
  'gold_1': { coinType: 'GOLD', quantity: 1, basePrice: 50, purchasePrice: 55 },
}
```

---

### **2. What is the 10% fee structure?**

**Option A: Platform Fee (Added to base price)**
- User pays: Base Price + 10%
- You receive: Base Price (10% is your platform fee)

**Option B: Total Price with Fee Included**
- Display price: 5.5 QAR (includes 10% already)
- User pays: 5.5 QAR
- Coin value remains the same

---

### **3. What are your coin types?**

From the code, I see coin types: `GOLD`, `SILVER`, `BRONZE`

**Questions:**
- Does 1 Bronze Coin = 5 QAR?
- Does 1 Silver Coin = 10 QAR?
- Does 1 Gold Coin = 50 QAR?
- Or are they all just "coins" with different package sizes?

---

### **4. Current Custom Amount Logic**

Right now: `1 QAR = 10 coins`

So if user pays 10 QAR:
- **Current:** 100 coins (generic)
- **Should be:** ??? (Bronze? Silver? Gold?)

---

## 🔧 **Temporary Fix Applied**

### **Changes Made:**
1. ✅ Fixed success HTML to show correct Order ID and Amount
2. ✅ Added 3-second auto-close timer
3. ✅ Added deep link with all params: `guildapp://payment-success?orderId=XXX&coins=XXX&amount=XXX`
4. ✅ Response sent immediately (coins credited in background)

### **Current Coin Packages (Placeholder):**
```typescript
{
  'bronze_50': { coins: 50, priceQAR: 5, name: 'Bronze Pack' },      // NO 10% FEE YET
  'silver_100': { coins: 100, priceQAR: 10, name: 'Silver Pack' },   // NO 10% FEE YET
  'gold_500': { coins: 500, priceQAR: 50, name: 'Gold Pack' },       // NO 10% FEE YET
  'platinum_1000': { coins: 1000, priceQAR: 100, name: 'Platinum Pack' }
}
```

---

## 📝 **Next Steps**

1. **Please clarify your coin pricing structure** (see questions above)
2. **I'll update the code** with the exact pricing you want
3. **Redeploy** with correct coin system

---

## 🚀 **Ready to Deploy Current Fix?**

The current fix addresses:
- ✅ "undefined" Order ID/Amount
- ✅ WebView auto-close after 3 seconds
- ✅ Proper deep link with all data

But still needs clarification on:
- ❓ Coin pricing (10% fee structure)
- ❓ Coin types (Bronze/Silver/Gold)
- ❓ Package definitions



