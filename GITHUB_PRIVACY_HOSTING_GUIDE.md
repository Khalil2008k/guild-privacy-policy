# 🚀 GitHub Pages Privacy Policy Hosting Guide

## Quick Steps to Get Your Privacy Policy URL

### **Method 1: Quick GitHub Pages Setup (Recommended)**

#### **Step 1: Create GitHub Repository**
1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Repository settings:
   - **Name:** `guild-privacy-policy` (or any name you prefer)
   - **Description:** "GUILD App Privacy Policy"
   - **Public** (must be public for GitHub Pages)
   - ✅ Check "Add a README file"
4. Click **"Create repository"**

#### **Step 2: Upload Privacy Policy**
1. In your new repository, click **"Add file"** → **"Upload files"**
2. Upload the file: `GUILD-3/privacy-policy.html`
3. **Important:** Rename it to `index.html` (GitHub Pages serves `index.html` by default)
4. Commit the file (click "Commit changes")

#### **Step 3: Enable GitHub Pages**
1. In your repository, go to **Settings** (top menu)
2. Scroll down to **"Pages"** (left sidebar)
3. Under "Source":
   - **Branch:** Select `main` (or `master`)
   - **Folder:** Select `/ (root)`
4. Click **"Save"**
5. Wait 2-3 minutes for deployment

#### **Step 4: Get Your URL**
After deployment, you'll see a message:
```
✅ Your site is published at: https://YOUR-USERNAME.github.io/guild-privacy-policy/
```

**This is your Privacy Policy URL for Google Play Store!**

---

### **Method 2: Using GitHub Desktop (If You Prefer GUI)**

#### **Step 1: Install GitHub Desktop**
Download from: https://desktop.github.com/

#### **Step 2: Create Repository**
1. Open GitHub Desktop
2. File → New Repository
   - **Name:** `guild-privacy-policy`
   - **Local Path:** Choose where to save
3. Click "Create Repository"
4. Click "Publish repository" (make sure it's **Public**)

#### **Step 3: Add Privacy Policy**
1. Copy `privacy-policy.html` to the repository folder
2. Rename it to `index.html`
3. In GitHub Desktop:
   - You'll see the file in "Changes"
   - Add commit message: "Add privacy policy"
   - Click "Commit to main"
   - Click "Push origin"

#### **Step 4: Enable GitHub Pages**
(Same as Method 1, Step 3)

---

### **Method 3: Using Git Command Line**

```bash
# Navigate to GUILD-3 directory
cd c:\Users\Admin\GUILD\GUILD-3

# Initialize git repository
git init

# Copy privacy policy
copy privacy-policy.html index.html

# Create new repository on GitHub first, then:
git remote add origin https://github.com/YOUR-USERNAME/guild-privacy-policy.git

# Add and commit
git add index.html
git commit -m "Add privacy policy"

# Push to GitHub
git branch -M main
git push -u origin main

# Then enable GitHub Pages in repository settings
```

---

## 🎯 Expected URL Format

Your Privacy Policy will be accessible at:
```
https://YOUR-USERNAME.github.io/guild-privacy-policy/
```

**Example:**
- If your GitHub username is `johndoe`
- URL will be: `https://johndoe.github.io/guild-privacy-policy/`

---

## ✅ Verification Steps

1. **Visit the URL** in your browser
2. Confirm the privacy policy displays correctly
3. Test on mobile device (should be responsive)
4. **Copy the URL** for Google Play Store submission

---

## 📱 Adding to Google Play Store

### **In Play Console:**
1. Go to your app → **Store presence** → **Store settings**
2. Find **"Privacy Policy"** section
3. Paste your GitHub Pages URL:
   ```
   https://YOUR-USERNAME.github.io/guild-privacy-policy/
   ```
4. Save changes

---

## 🔄 Updating Privacy Policy Later

To update your privacy policy:

### **Using GitHub Website:**
1. Go to your repository
2. Click on `index.html`
3. Click the pencil icon (Edit)
4. Make changes
5. Commit changes
6. Wait 1-2 minutes for deployment

### **Using GitHub Desktop:**
1. Edit `index.html` locally
2. Commit changes
3. Push to GitHub
4. Changes will auto-deploy

---

## 🌐 Alternative: Custom Domain (Optional)

If you want a custom domain like `https://privacy.guild.qa`:

1. Purchase domain (e.g., from Namecheap, GoDaddy)
2. In GitHub repository settings → Pages:
   - Add custom domain: `privacy.guild.qa`
3. In your domain registrar:
   - Add CNAME record pointing to `YOUR-USERNAME.github.io`
4. Wait for DNS propagation (24-48 hours)

---

## 📧 Need Help?

If you encounter issues:
- GitHub Pages deployment problems → Check GitHub Status
- 404 errors → Ensure file is named `index.html` and repository is public
- Not updating → Clear browser cache or wait 5 minutes

---

## ✨ Your Privacy Policy is Ready!

Once deployed, your privacy policy URL will be:
```
https://YOUR-USERNAME.github.io/guild-privacy-policy/
```

**Use this URL in:**
- ✅ Google Play Store submission
- ✅ App Store Connect (if publishing on iOS)
- ✅ App settings/footer
- ✅ Marketing materials

---

**Last Updated:** October 15, 2024


