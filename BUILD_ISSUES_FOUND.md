# 🚨 BUILD ISSUES FOUND

## **Critical TypeScript Errors - 538 Errors in 11 Files**

### **Root Cause:**
Several service files have `.ts` extensions but contain JSX/React code. TypeScript cannot compile JSX in `.ts` files - they must be `.tsx` files.

---

## **Files That Need to be Renamed from `.ts` to `.tsx`:**

### **1. src/services/onboardingService.ts** (85 errors)
- Contains JSX: `<View>`, `<Text>`, `<TouchableOpacity>`
- **Fix:** Rename to `onboardingService.tsx`

### **2. src/services/walkMeGuides.ts** (92 errors)
- Contains JSX: `<View>`, `<Text>`, `<TouchableOpacity>`
- **Fix:** Rename to `walkMeGuides.tsx`

### **3. src/services/chameleonTours.ts** (88 errors)
- Contains JSX components
- **Fix:** Rename to `chameleonTours.tsx`

### **4. src/services/cleverTapRetention.ts** (86 errors)
- Contains JSX components
- **Fix:** Rename to `cleverTapRetention.tsx`

### **5. src/services/accessibilityService.ts** (50 errors)
- Contains JSX components
- **Fix:** Rename to `accessibilityService.tsx`

### **6. src/services/advancedI18nService.ts** (47 errors)
- Contains JSX components
- **Fix:** Rename to `advancedI18nService.tsx`

### **7. src/services/intercomChatbot.ts** (40 errors)
- Contains JSX components
- **Fix:** Rename to `intercomChatbot.tsx`

### **8. src/services/userFlowService.ts** (23 errors)
- Contains JSX: `<View>`, `<TouchableOpacity>`
- **Fix:** Rename to `userFlowService.tsx`

### **9. src/services/brazeCampaigns.ts** (18 errors)
- Contains JSX components
- **Fix:** Rename to `brazeCampaigns.tsx`

### **10. src/hooks/OptimizedHooks.tsx** (5 errors)
- Already `.tsx` but has syntax errors
- **Fix:** Review and fix syntax

### **11. src/utils/rtl-auto-fix.ts** (4 errors)
- Contains JSX: `<Component {...props} />`
- **Fix:** Rename to `rtl-auto-fix.tsx`

---

## **Common Error Patterns:**

### **Error Type 1: Apostrophe in Strings**
```typescript
// ❌ Wrong (causes errors in .ts files)
title: 'You're All Set!'

// ✅ Fix 1: Escape apostrophe
title: 'You\'re All Set!'

// ✅ Fix 2: Use double quotes
title: "You're All Set!"
```

### **Error Type 2: JSX in .ts Files**
```typescript
// ❌ Wrong (.ts file with JSX)
return <View><Text>Hello</Text></View>;

// ✅ Fix: Rename file to .tsx
// File: component.tsx
return <View><Text>Hello</Text></View>;
```

---

## **Quick Fix Commands:**

```bash
# Navigate to project root
cd C:\Users\Admin\GUILD\GUILD-3

# Rename files (PowerShell)
Rename-Item src\services\onboardingService.ts onboardingService.tsx
Rename-Item src\services\walkMeGuides.ts walkMeGuides.tsx
Rename-Item src\services\chameleonTours.ts chameleonTours.tsx
Rename-Item src\services\cleverTapRetention.ts cleverTapRetention.tsx
Rename-Item src\services\accessibilityService.ts accessibilityService.tsx
Rename-Item src\services\advancedI18nService.ts advancedI18nService.tsx
Rename-Item src\services\intercomChatbot.ts intercomChatbot.tsx
Rename-Item src\services\userFlowService.ts userFlowService.tsx
Rename-Item src\services\brazeCampaigns.ts brazeCampaigns.tsx
Rename-Item src\utils\rtl-auto-fix.ts rtl-auto-fix.tsx
```

---

## **After Renaming:**

1. **Update imports** in files that reference these services
2. **Run type check** again: `npx tsc --noEmit`
3. **Test the build**: `npx expo start`

---

## **Additional Issues to Check:**

### **1. String Apostrophes**
Search for strings with apostrophes and escape them:
- `You're` → `You\'re` or `"You're"`
- `Let's` → `Let\'s` or `"Let's"`
- `Don't` → `Don\'t` or `"Don't"`

### **2. Missing Dependencies**
Check if all required packages are installed:
```bash
npm install
```

### **3. Metro Cache**
Clear Metro bundler cache:
```bash
npx expo start --clear
```

---

## **Priority Actions:**

### **🔴 CRITICAL (Must Fix Before Build):**
1. ✅ Rename all `.ts` files with JSX to `.tsx`
2. ✅ Fix apostrophe escaping in strings
3. ✅ Update imports

### **🟡 RECOMMENDED:**
1. Run `npm install` to ensure all dependencies
2. Clear cache: `npx expo start --clear`
3. Test on device/emulator

### **🟢 OPTIONAL:**
1. Run linter: `npm run lint:fix`
2. Format code: `npm run format`

---

## **Estimated Fix Time:**
- **File Renaming:** 5 minutes
- **Import Updates:** 10-15 minutes (if any)
- **Testing:** 10 minutes
- **Total:** ~30 minutes

---

## **Status:**
❌ **BUILD WILL FAIL** - Must fix these errors before building APK

**Next Steps:**
1. Rename files from `.ts` to `.tsx`
2. Run `npx tsc --noEmit` to verify
3. Build APK once errors are resolved














