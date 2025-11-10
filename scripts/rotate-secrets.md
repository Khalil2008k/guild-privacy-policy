# 🔐 Secret Rotation Guide

This guide explains how to rotate secrets safely after they've been exposed or as part of regular security maintenance.

## 🚨 When to Rotate Secrets

**Immediately:**
- Secret was committed to git
- Secret was exposed in logs
- Secret was shared insecurely
- Suspected compromise

**Regularly (Every 90 days):**
- JWT secrets
- API keys
- Database passwords
- Encryption keys

---

## 📋 Secret Rotation Checklist

### **1. Firebase API Key**

**Steps:**
1. Go to Firebase Console → Project Settings → General
2. Under "Your apps" → Web app → Click "Reset API key"
3. Copy new API key
4. Update `.env`:
   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=new-api-key-here
   ```
5. Restart app and backend
6. Test authentication flows

**Impact:** Low (Firebase API keys are not highly sensitive, but should still be rotated)

---

### **2. Firebase Admin SDK Private Key**

**Steps:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Extract values and update `.env`:
   ```bash
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com
   ```
5. Delete old service account (optional)
6. Restart backend
7. Test backend Firebase operations

**Impact:** HIGH - Backend will fail until updated

---

### **3. JWT Secret**

**Steps:**
1. Generate new secret:
   ```bash
   openssl rand -base64 32
   ```
2. Update `.env`:
   ```bash
   JWT_SECRET=new-secret-here
   ```
3. **IMPORTANT:** This will invalidate ALL existing user sessions
4. Restart backend
5. All users must log in again

**Impact:** HIGH - All users logged out

**Migration Strategy (Zero Downtime):**
```typescript
// Support both old and new secrets during transition
const JWT_SECRET_OLD = process.env.JWT_SECRET_OLD;
const JWT_SECRET_NEW = process.env.JWT_SECRET_NEW;

// Verify with new secret first, fall back to old
try {
  return jwt.verify(token, JWT_SECRET_NEW);
} catch (err) {
  return jwt.verify(token, JWT_SECRET_OLD);
}

// Sign with new secret only
return jwt.sign(payload, JWT_SECRET_NEW);
```

---

### **4. Sadad Payment Gateway Credentials**

**Steps:**
1. Contact Sadad support to request new credentials
2. Update `.env`:
   ```bash
   SADAD_MERCHANT_ID=new-merchant-id
   SADAD_SECRET_KEY=new-secret-key
   ```
3. Test payment flow in sandbox
4. Deploy to production
5. Monitor payment transactions

**Impact:** HIGH - Payments will fail until updated

---

### **5. Database Passwords (PostgreSQL/Redis)**

**Steps:**
1. Create new user with same permissions:
   ```sql
   CREATE USER guild_new WITH PASSWORD 'new-password';
   GRANT ALL PRIVILEGES ON DATABASE guild TO guild_new;
   ```
2. Update `.env`:
   ```bash
   DATABASE_URL=postgresql://guild_new:new-password@host:5432/guild
   REDIS_URL=redis://:new-password@host:6379
   ```
3. Restart backend
4. Test database operations
5. Delete old user:
   ```sql
   DROP USER guild_old;
   ```

**Impact:** HIGH - Database access fails until updated

---

### **6. Encryption Keys**

**Steps:**
1. Generate new key:
   ```bash
   openssl rand -hex 32
   ```
2. **CRITICAL:** Re-encrypt all existing data with new key
3. Migration script:
   ```typescript
   // Decrypt with old key, encrypt with new key
   const decrypted = decrypt(data, OLD_KEY);
   const encrypted = encrypt(decrypted, NEW_KEY);
   await db.update({ encrypted });
   ```
4. Update `.env`:
   ```bash
   ENCRYPTION_KEY=new-key-here
   ```
5. Restart backend

**Impact:** CRITICAL - Data loss if not migrated properly

---

## 🔧 Removing Secrets from Git History

### **Option 1: git-filter-repo (Recommended)**

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove .env file from history
git filter-repo --path .env --invert-paths

# Remove specific secret pattern
git filter-repo --replace-text <(echo "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w==>REDACTED")

# Force push (WARNING: Rewrites history)
git push origin --force --all
```

### **Option 2: BFG Repo-Cleaner**

```bash
# Install BFG
brew install bfg

# Remove .env files
bfg --delete-files .env

# Remove secrets by pattern
bfg --replace-text secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### **Option 3: Manual (Small repos only)**

```bash
# Interactive rebase
git rebase -i HEAD~10

# Mark commits with secrets as "edit"
# Remove secrets from files
git add .
git commit --amend
git rebase --continue

# Force push
git push origin --force
```

---

## 📝 Post-Rotation Checklist

After rotating secrets:

- [ ] Update `.env` file
- [ ] Update CI/CD secrets (GitHub Actions, GitLab CI, etc.)
- [ ] Update production environment variables
- [ ] Update staging environment variables
- [ ] Restart all services
- [ ] Test critical flows (auth, payments, etc.)
- [ ] Monitor logs for errors
- [ ] Notify team of rotation
- [ ] Document rotation in changelog
- [ ] Schedule next rotation (90 days)

---

## 🚨 Emergency Response

If secrets are exposed publicly:

1. **Immediately rotate** all exposed secrets
2. **Monitor** for unauthorized access
3. **Audit** recent activity for suspicious behavior
4. **Notify** affected users if data was compromised
5. **Review** security practices to prevent recurrence
6. **Document** incident for future reference

---

## 🔒 Best Practices

1. **Never commit secrets** to git
2. **Use environment variables** for all secrets
3. **Rotate secrets regularly** (every 90 days)
4. **Use different secrets** for dev/staging/production
5. **Store production secrets** in a vault (AWS Secrets Manager, HashiCorp Vault)
6. **Audit secret access** regularly
7. **Use least privilege** principle
8. **Enable MFA** on all accounts with secret access
9. **Monitor for leaks** using tools like GitGuardian
10. **Have a rotation plan** documented and tested

---

## 📚 Additional Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitGuardian](https://www.gitguardian.com/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

