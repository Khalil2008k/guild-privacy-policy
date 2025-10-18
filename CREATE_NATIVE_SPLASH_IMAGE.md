# 🎨 Create Native Splash Image - Matches Your Custom Splash

## 🎯 Goal
Create a `splash.png` that looks **EXACTLY** like your custom splash so users see a seamless experience from app start.

---

## 📐 Specifications

### Your Custom Splash Design:
- **Background:** Black (#000000)
- **Icon:** Gold/Yellow Shield (centered, 80px equivalent)
- **Text:** "GUILD" in gold (below shield, 48px, bold)
- **Font:** Signika Negative (or system bold)
- **Layout:** Centered vertically and horizontally

### Required Native Splash:
- **Size:** 1284x2778 pixels (iPhone 14 Pro Max - highest res)
- **Format:** PNG with transparency support
- **Background:** Solid black (#000000)
- **Content:** Shield icon + "GUILD" text (exactly matching your custom splash)

---

## 🛠️ How To Create It

### Option 1: Using Figma (Recommended)

1. **Create New File:**
   - Size: 1284 x 2778 px
   - Background: #000000 (black)

2. **Add Shield Icon:**
   - Use Shield icon from Lucide icons
   - Color: #D4AF37 (gold) or #FFD700 (bright gold)
   - Size: ~200px (scaled for high-res)
   - Position: Center, slightly above middle

3. **Add "GUILD" Text:**
   - Font: Signika Negative Bold (or similar sans-serif bold)
   - Size: ~120px (scaled for high-res)
   - Color: #D4AF37 (same gold)
   - Position: Below shield, ~50px gap

4. **Export:**
   - Format: PNG
   - Quality: 100%
   - Name: `splash.png`

### Option 2: Using Canva

1. **Create Design:**
   - Custom size: 1284 x 2778 px
   - Background: Black

2. **Add Elements:**
   - Search "shield icon" in elements
   - Make it gold/yellow color
   - Add text "GUILD" below
   - Make text gold, bold, large

3. **Download:**
   - File type: PNG
   - Quality: Recommended
   - Name: `splash.png`

### Option 3: Using Photoshop/GIMP

1. **New Document:**
   - Width: 1284 px
   - Height: 2778 px
   - Background: Black (#000000)

2. **Add Shield:**
   - Use custom shape tool (shield)
   - OR import shield SVG
   - Fill: Gold (#D4AF37)
   - Size: ~200px
   - Position: Center, Y ~1100px

3. **Add Text:**
   - Text: "GUILD"
   - Font: Bold sans-serif
   - Size: 120px
   - Color: Gold (#D4AF37)
   - Position: Below shield, Y ~1350px

4. **Save:**
   - Format: PNG-24
   - Name: `splash.png`

---

## 🎨 Color Codes

Use these exact colors to match your app:

```
Background: #000000 (Black)
Icon/Text:  #FFD700 (Gold)
       OR:  #D4AF37 (Darker Gold)
       OR:  #FDB931 (Bright Gold - default theme primary)
```

**Tip:** Check your theme colors in `src/contexts/ThemeContext.tsx` for exact primary color.

---

## 📦 Quick SVG Template

If you want to code it, here's an SVG you can convert to PNG:

```svg
<svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
  <!-- Black Background -->
  <rect width="1284" height="2778" fill="#000000"/>
  
  <!-- Shield Icon (simplified) -->
  <path d="M642 1000 L542 1050 L542 1150 L642 1200 L742 1150 L742 1050 Z" 
        fill="#FFD700" stroke="#FFD700" stroke-width="4"/>
  
  <!-- GUILD Text -->
  <text x="642" y="1400" 
        font-family="Arial, sans-serif" 
        font-size="120" 
        font-weight="bold" 
        fill="#FFD700" 
        text-anchor="middle">
    GUILD
  </text>
</svg>
```

**Convert to PNG:**
- Use https://cloudconvert.com/svg-to-png
- OR use Inkscape/Illustrator
- Export at 1284x2778px

---

## 📍 File Placement

Once created, replace:
```
GUILD-3/assets/splash.png
```

Then rebuild:
```bash
npx expo prebuild --clean
```

---

## ✅ What This Achieves

**Before:**
```
App Launch → Black screen → Your custom splash (Shield + GUILD)
```

**After:**
```
App Launch → Native splash (Shield + GUILD) → Seamless transition → Your custom splash (Shield + GUILD)
```

**User Experience:**
- Looks like app starts instantly with YOUR splash
- No jarring transition
- Professional branding from first pixel
- Seamless visual continuity

---

## 🚀 Alternative: Use Expo Splash Screen Generator

If you don't want to design manually:

1. **Install:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Generate:**
   ```bash
   npx expo-splash-screen generate
   ```

3. **Follow prompts** to create splash from image

---

## 📝 Current Status

**Current Native Splash:**
- ✅ Black background (#000000) 
- ❌ Plain black image (no icon/text)

**Your Custom Splash:**
- ✅ Black background
- ✅ Gold shield icon
- ✅ "GUILD" text
- ✅ Proper styling

**To Match:** Create native splash with shield + text!

---

## 💡 Pro Tip

For absolute best results:
1. Create the splash image matching your design
2. Update `app.config.js` to use it:
   ```javascript
   splash: {
     image: "./assets/splash.png",
     resizeMode: "contain",
     backgroundColor: "#000000"
   }
   ```
3. Run `npx expo prebuild --clean`
4. Test on device

**Result:** App appears to start with YOUR splash immediately! 🎯

---

*This will give you the seamless startup experience you want.*
