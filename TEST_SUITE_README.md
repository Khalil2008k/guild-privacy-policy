# 🧪 GUILD PLATFORM - COMPREHENSIVE TEST SUITE

**Total Tests**: 150+ automated + manual tests  
**Coverage**: API, UX/UI, Performance, Security, Scale  
**Run Time**: ~30 minutes (automated), ~2 hours (with manual)

---

## 📋 QUICK START

### **Run All Tests** (Automated)
```bash
# Linux/Mac
./run-all-tests.sh

# Windows
.\run-all-tests.ps1
```

### **Run Specific Phase**
```bash
# Phase 1: General (Tests 1-50)
./run-all-tests.sh phase1

# Phase 2: API (Tests 51-100)
./run-all-tests.sh phase2

# Phase 3: UX/Flow (Tests 101-150)
./run-all-tests.sh phase3

# Quick checks only
./run-all-tests.sh quick
```

---

## 🎯 TEST PHASES

### **Phase 1: General Tests (1-50)**
**File**: `tests/phase1-general.test.ts`  
**Focus**: Infrastructure, Build, Security, Performance

**Key Tests**:
- ✅ npm test with coverage
- ✅ Backend health check (<30s startup)
- ✅ E2E auth flow
- ✅ Load test (1k concurrent)
- ✅ Security scan (OWASP ZAP)
- ✅ Performance (Lighthouse >90)
- ✅ Accessibility (Axe)
- ✅ Bundle size analysis
- ✅ i18n/RTL validation
- ✅ Theme system (dark/light)
- ✅ Offline handling
- ✅ Error boundaries
- ✅ Dependency audit
- ✅ CI/CD simulation
- ✅ Database backup/restore

**Run**:
```bash
npm test tests/phase1-general.test.ts
```

---

### **Phase 2: API Tests (51-100)**
**File**: `tests/phase2-api.test.ts`  
**Focus**: Endpoint validation, Security, Performance

**Key Tests**:
- ✅ Authentication (verify, register, login, refresh, logout)
- ✅ Job CRUD (create, read, update, delete)
- ✅ Job offers (submit, duplicate prevention)
- ✅ Guild management (create, join, permissions)
- ✅ Wallet operations (balance, transactions, withdraw)
- ✅ Chat & notifications
- ✅ Search & analytics
- ✅ Rate limiting
- ✅ RBAC permissions
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CORS configuration
- ✅ Response time (<300ms p95)

**Run**:
```bash
npm test tests/phase2-api.test.ts
```

---

### **Phase 3: UX/Flow Tests (101-150)**
**File**: `tests/phase3-ux-flow.test.ts`  
**Focus**: User journeys, UI/UX, Mobile flows

**Key Tests**:
- ✅ Core flows (sign-up, onboarding, job post)
- ✅ Job lifecycle (post → offer → accept → complete)
- ✅ Communication (chat, notifications, guild)
- ✅ Wallet flows (top-up, withdraw, escrow)
- ✅ Profile management
- ✅ Discovery & search
- ✅ Analytics & reports
- ✅ Edge cases (offline, errors, network)
- ✅ Performance (cold start, memory, battery)
- ✅ Accessibility (zoom, voice, haptic)
- ✅ Scale tests (10k users, 50 tabs)

**Run**:
```bash
npm test tests/phase3-ux-flow.test.ts

# Or with Detox (E2E)
npx detox test -c ios.sim.debug
```

---

## 🛠️ SETUP REQUIREMENTS

### **1. Backend Running**
```bash
cd backend
npm install
npm run dev
```

### **2. Frontend Running**
```bash
npx expo start
```

### **3. Test Dependencies**
```bash
npm install --save-dev @jest/globals axios detox
```

### **4. Optional Tools**
```bash
# Load testing
npm install -g artillery

# Security scanning
docker pull owasp/zap2docker-stable

# Performance
npm install -g lighthouse
```

---

## 📊 TEST RESULTS FORMAT

Each test outputs:
```
Test ID: Description
Status: PASS/FAIL/WARN
Logs: [detailed output]
Broken: [if any, with fix code]
```

**Example**:
```
✅ Test 52 PASS: Duplicate email rejected
   Status: 400 Bad Request
   Message: "Email already exists"
   
❌ Test 65 FAIL: Duplicate offer allowed
   BROKEN: No unique constraint on job_offers table
   FIX: Add unique constraint on (jobId, freelancerId)
   Code: ALTER TABLE job_offers ADD CONSTRAINT unique_offer UNIQUE (jobId, freelancerId);
```

---

## 🎯 COVERAGE GOALS

| Category | Target | Current |
|----------|--------|---------|
| **Code Coverage** | >95% | Run tests to measure |
| **API Endpoints** | 100% | All critical endpoints |
| **User Flows** | 100% | All main journeys |
| **Security** | 0 high vulns | npm audit |
| **Performance** | <300ms p95 | Artillery |
| **Accessibility** | 0 WCAG fails | Axe |

---

## 🚨 CRITICAL TEST FAILURES

If any of these fail, **DO NOT DEPLOY**:
- [ ] Authentication (rate limiting, token validation)
- [ ] Payment/Escrow (PCI DSS, no data leaks)
- [ ] Data integrity (no duplicate records)
- [ ] Security (SQL injection, XSS prevention)
- [ ] User data protection (GDPR compliance)

---

## ⚙️ MANUAL TESTS REQUIRED

Some tests require manual verification:

### **Mobile App** (Expo Go / Simulator)
1. Open app → Complete sign-up flow
2. Post a job → Submit offer → Accept → Complete
3. Chat 1:1 → Send message → Upload file
4. Toggle theme (dark/light)
5. Switch language (EN/AR)
6. Test offline mode
7. Test deep links

### **Load Testing** (Artillery)
```bash
cd testing
artillery run artillery-comprehensive.yml
```

### **Security Scan** (OWASP ZAP)
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:4000/api
```

### **Performance** (Lighthouse)
```bash
lighthouse http://localhost:8081 --view
```

---

## 📈 DEPLOYMENT READINESS

Calculate deployment readiness:
```
Readiness % = (Passed Tests / Total Tests) × 100
```

**Thresholds**:
- **95-100%**: ✅ Production ready
- **90-94%**: ✅ Beta ready
- **80-89%**: ⚠️ Staging only
- **<80%**: ❌ Not ready

---

## 🐛 DEBUGGING FAILED TESTS

### **1. Backend Issues**
```bash
# Check logs
cd backend
npm run dev

# Verify endpoints
curl http://localhost:4000/health
```

### **2. Frontend Issues**
```bash
# Clear cache
npx expo start --clear

# Check logs
npx expo start --dev-client
```

### **3. Database Issues**
```bash
# Prisma
cd backend
npx prisma studio

# Firebase
firebase emulators:start
```

### **4. Test Issues**
```bash
# Run specific test with verbose output
npm test tests/phase1-general.test.ts -- --verbose

# Run with debugging
node --inspect-brk node_modules/.bin/jest tests/phase2-api.test.ts
```

---

## 📞 SUPPORT

**Issues**: Document in `test-results.md`  
**Format**:
```markdown
## Test XYZ Failed

**Test ID**: 52  
**Description**: Duplicate email rejected  
**Status**: FAIL  
**Error**: Email validation not working  
**Expected**: 400 status  
**Actual**: 200 status  
**Fix**: Add unique constraint on users.email  
```

---

## ✅ CHECKLIST BEFORE DEPLOYMENT

- [ ] All Phase 1 tests pass
- [ ] All Phase 2 tests pass
- [ ] Critical manual tests complete
- [ ] No high/critical vulnerabilities
- [ ] Code coverage >90%
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Accessibility audit pass
- [ ] Load test successful (1k+ users)
- [ ] Mobile app tested on real devices

---

**Created**: October 7, 2025  
**Version**: 1.0  
**Status**: ✅ Ready to use






