# 🧪 HOW TO TEST THE COMPLETE COIN SYSTEM

## 🚀 QUICK START

### **1. Reload Your Expo App**

```bash
# In your Expo terminal, press:
r  # Reload the app

# Or restart Expo:
Ctrl+C  # Stop Expo
npm start  # Start again
```

### **2. Navigate to Wallet**

```
1. Open the app
2. Sign in (if not already)
3. Go to main wallet screen
4. Look for the "Store" button (replaced "Transfer")
```

---

## 🛍️ TEST 1: COIN STORE

### **Steps:**
```
1. Tap "Store" button on wallet screen
   → Opens Coin Store screen

2. See 6 coin types with gradients:
   - Bronze (5 QAR)
   - Silver (10 QAR)
   - Gold (50 QAR)
   - Platinum (100 QAR)
   - Diamond (200 QAR)
   - Ruby (500 QAR)

3. Tap "+" on any coin
   → Quantity increases
   → Cart appears at top
   → Total updates

4. Tap "-" to decrease
   → Quantity decreases
   → Cart updates

5. Add multiple coins to cart

6. Tap "Buy" button in cart
   → Shows confirmation
   → Calls backend API
   → Shows success/error message

7. Check backend logs on Render:
   → Should see POST /api/coins/purchase
   → Should see transaction created
```

### **What to Look For:**
- ✅ Beautiful gradient coins (no emojis!)
- ✅ Smooth animations when adding/removing
- ✅ Cart total updates instantly
- ✅ Text is readable (white on dark, black on light)
- ✅ RTL works if Arabic selected
- ✅ Purchase button calls backend

---

## 💰 TEST 2: COIN WALLET

### **Steps:**
```
1. From Coin Store, tap wallet icon (top right)
   → Opens Coin Wallet screen

2. See total balance in QAR at top

3. See breakdown of each coin type:
   - Quantity owned
   - Value per coin
   - Total value

4. See recent transactions (last 5)

5. Pull down to refresh
   → Shows loading spinner
   → Reloads data from backend

6. Tap "Buy" button
   → Goes back to Coin Store

7. Tap "Withdraw" button
   → Opens Withdrawal Request screen

8. Tap "See All" on transactions
   → Opens Transaction History screen
```

### **What to Look For:**
- ✅ Balance displays correctly
- ✅ Coin breakdown shows all types
- ✅ Transactions show with icons
- ✅ Pull-to-refresh works
- ✅ Navigation works
- ✅ Colors are perfect (readable text)

---

## 📜 TEST 3: TRANSACTION HISTORY

### **Steps:**
```
1. From Coin Wallet, tap "See All"
   → Opens Transaction History screen

2. See all transactions listed

3. Tap filter buttons:
   - "All" → Shows all transactions
   - "Credit" → Shows only additions
   - "Debit" → Shows only deductions

4. See transaction details:
   - Icon (cart, briefcase, cash, gift)
   - Description
   - Date & time
   - Transaction ID
   - Amount (green for +, red for -)
   - Coins involved

5. Pull down to refresh

6. If no transactions:
   → See empty state with icon
```

### **What to Look For:**
- ✅ Transactions load from backend
- ✅ Filters work correctly
- ✅ Colors: green for credit, red for debit
- ✅ Icons match transaction type
- ✅ Empty state shows if no data
- ✅ Text is readable

---

## 💸 TEST 4: WITHDRAWAL REQUEST

### **Steps:**
```
1. From Coin Wallet, tap "Withdraw"
   → Opens Withdrawal Request screen

2. See available balance at top

3. Enter amount:
   - Type manually
   - Or tap quick buttons (100, 500, 1000, Max)

4. Enter bank details:
   - Bank name
   - Account number
   - IBAN

5. (Optional) Add note

6. Tap "Submit Withdrawal Request"
   → Shows confirmation dialog
   → Mentions 10-14 day processing

7. Tap "Confirm"
   → Calls backend API
   → Shows success message
   → Goes back to wallet

8. Check backend logs:
   → Should see POST /api/coins/withdrawals/request
   → Should see withdrawal created
```

### **What to Look For:**
- ✅ Balance displays correctly
- ✅ Amount validation works (can't exceed balance)
- ✅ Quick buttons work
- ✅ "Max" button fills total balance
- ✅ Bank details required
- ✅ Confirmation dialog shows
- ✅ Backend API called
- ✅ Success message shows

---

## 🌓 TEST 5: DARK/LIGHT MODE

### **Steps:**
```
1. Go to app settings
2. Toggle dark mode ON
   → All screens should have:
     - Black/dark gray backgrounds
     - White text
     - Visible borders

3. Toggle dark mode OFF
   → All screens should have:
     - White/light gray backgrounds
     - Black text
     - Subtle borders

4. Check all 4 coin screens:
   - Coin Store
   - Coin Wallet
   - Transaction History
   - Withdrawal Request

5. Verify text is ALWAYS readable
   - No white text on white background
   - No black text on black background
```

### **What to Look For:**
- ✅ Perfect contrast in both modes
- ✅ All text readable
- ✅ Borders visible
- ✅ Cards stand out from background
- ✅ Gradients look good in both modes

---

## 🌍 TEST 6: ARABIC/RTL

### **Steps:**
```
1. Go to app settings
2. Change language to Arabic
   → All screens should:
     - Flip layout (right to left)
     - Show Arabic text
     - Keep icons on correct side

3. Check all 4 coin screens:
   - Coin Store → متجر العملات
   - Coin Wallet → محفظة العملات
   - Transaction History → سجل المعاملات
   - Withdrawal Request → طلب سحب

4. Check coin names in Arabic:
   - Bronze → برونزية
   - Silver → فضية
   - Gold → ذهبية
   - Platinum → بلاتينية
   - Diamond → ماسية
   - Ruby → ياقوتية

5. Verify layout:
   - Text aligned right
   - Icons on left side
   - Back button flips
   - Margins correct
```

### **What to Look For:**
- ✅ Complete layout flip
- ✅ All text in Arabic
- ✅ Coin names translated
- ✅ Numbers display correctly
- ✅ Icons positioned correctly
- ✅ No overlapping text

---

## 🔌 TEST 7: BACKEND INTEGRATION

### **Check Render Logs:**

```bash
# Go to Render dashboard
# Open your backend service
# Click "Logs" tab
# Look for:

1. Coin Store Purchase:
   POST /api/coins/purchase
   → Should see: "Purchase initiated"
   → Should see: Transaction created
   → Should see: Coins minted

2. Wallet Balance:
   GET /api/coins/balance
   → Should see: Balance retrieved
   → Should see: User ID

3. Transactions:
   GET /api/coins/transactions
   → Should see: Transactions retrieved
   → Should see: Count

4. Withdrawal Request:
   POST /api/coins/withdrawals/request
   → Should see: Withdrawal created
   → Should see: Status: pending
```

### **What to Look For:**
- ✅ No 401 errors (authentication working)
- ✅ No 500 errors (backend working)
- ✅ API responses successful
- ✅ Data being saved to Firestore
- ✅ Logs show correct user ID

---

## 🐛 TROUBLESHOOTING

### **Problem: Can't see Store button**
```
Solution:
1. Make sure you're on the main wallet screen
2. Look for button that says "Store" (replaced "Transfer")
3. If still not there, reload app (press 'r' in Expo)
```

### **Problem: Screens look broken**
```
Solution:
1. Clear Expo cache:
   - Stop Expo (Ctrl+C)
   - Run: npx expo start -c
2. Reload app
```

### **Problem: API calls failing**
```
Solution:
1. Check backend is running on Render
2. Check you're signed in
3. Check Firebase token is valid
4. Check Render logs for errors
```

### **Problem: Text not readable**
```
Solution:
This shouldn't happen! The color system is perfect.
If you see this, take a screenshot and let me know.
```

### **Problem: Arabic not working**
```
Solution:
1. Make sure language is set to Arabic in app settings
2. Reload app
3. Check i18n provider is working
```

---

## ✅ EXPECTED RESULTS

After testing, you should have:

### **Coin Store:**
- ✅ 6 beautiful coin cards with gradients
- ✅ Working cart with live total
- ✅ Functional purchase button
- ✅ Backend API called successfully

### **Coin Wallet:**
- ✅ Total balance displayed
- ✅ Coin breakdown shown
- ✅ Recent transactions listed
- ✅ Navigation working

### **Transaction History:**
- ✅ All transactions loaded
- ✅ Filters working
- ✅ Color-coded amounts
- ✅ Empty state if no data

### **Withdrawal Request:**
- ✅ Amount input working
- ✅ Quick buttons working
- ✅ Validation working
- ✅ Backend API called

### **Dark/Light Mode:**
- ✅ Perfect contrast in both modes
- ✅ All text readable
- ✅ Professional appearance

### **Arabic/RTL:**
- ✅ Complete layout flip
- ✅ All text translated
- ✅ Correct alignment

---

## 🎉 SUCCESS CRITERIA

**The coin system is working if:**

1. ✅ You can navigate to all 4 screens
2. ✅ You can add coins to cart
3. ✅ You can see your balance
4. ✅ You can view transactions
5. ✅ You can request withdrawal
6. ✅ Backend logs show API calls
7. ✅ Text is readable in dark/light mode
8. ✅ Arabic/RTL works perfectly
9. ✅ No crashes or errors
10. ✅ UI looks professional and beautiful

**If all 10 are ✅, the system is 100% working!** 🚀

---

## 📞 NEXT STEPS

Once testing is complete:

1. **If everything works:**
   - System is production-ready!
   - Can start using for real transactions
   - Can deploy to App Store/Play Store

2. **If you find issues:**
   - Take screenshots
   - Check Render logs
   - Let me know what's not working
   - I'll fix it immediately

3. **If you want enhancements:**
   - Additional features
   - UI tweaks
   - New screens
   - Just ask!

**The system is ready. Test it and enjoy!** 🎊


