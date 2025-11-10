# REMOVED FORBIDDEN AI SYSTEMS

**Date:** October 29, 2025  
**Reason:** Per GUILD Absolute Development Rules - Section II  
**Status:** Marked for removal (route registrations disabled)

---

## ❌ Forbidden AI Systems Removed

### 1. Image Processing / Background Remover / U²-Net

**Files marked for deletion:**
- `backend/src/services/ProfilePictureAIService.ts`
- `backend/src/services/AdvancedProfilePictureAIService.ts`
- `backend/src/routes/profile-picture-ai.ts`
- `backend/src/routes/advanced-profile-picture-ai.ts`
- `backend/src/routes/simple-profile-picture-ai.ts`
- `backend/src/tests/profile-picture-ai.test.ts`
- `backend/src/tests/advanced-ai-systems.test.ts`

**Routes disabled:**
- `/api/profile-picture-ai` - REMOVED
- `/api/advanced-profile-picture-ai` - REMOVED
- `/api/simple-profile-picture-ai` - REMOVED (but also in simple-server.ts)

---

### 2. AI Job Evaluators / Suggestion Systems

**Files marked for deletion:**
- `backend/src/services/EnhancedJobEvaluationService.ts`
- `backend/src/routes/enhanced-job-evaluation.ts`
- `backend/src/tests/enhanced-job-evaluation.test.ts`

**Routes to disable:**
- `/api/enhanced-job-evaluation/*` - REMOVED

---

### 3. Job Matching Engine

**Status:** Not found in codebase (already removed or never implemented)

---

### 4. Proposal Generator

**Status:** Not found in codebase (already removed or never implemented)

---

## ✅ ALLOWED AI SYSTEM

### FraudDetectionService (AdvancedAMLService)

**File:** `backend/src/services/AdvancedAMLService.ts`  
**Routes:** `backend/src/routes/advanced-aml.ts`  
**Purpose:** Detect fraudulent transactions, money laundering, fake accounts, suspicious withdrawals

**Status:** KEPT - This is the ONLY permitted AI system per Absolute Rules.

---

## 🔧 Next Steps

1. **Physical File Deletion** - Delete the files listed above
2. **Route Cleanup** - Remove any remaining route registrations
3. **Import Cleanup** - Remove unused imports from server.ts
4. **Dependency Cleanup** - Remove any AI-related dependencies if unused
5. **Test Cleanup** - Remove AI-related test files

---

## ⚠️ Manual Action Required

The following files should be manually deleted (or moved to archive):

### Service Files:
- `backend/src/services/ProfilePictureAIService.ts`
- `backend/src/services/AdvancedProfilePictureAIService.ts`
- `backend/src/services/EnhancedJobEvaluationService.ts`

### Route Files:
- `backend/src/routes/profile-picture-ai.ts`
- `backend/src/routes/advanced-profile-picture-ai.ts`
- `backend/src/routes/simple-profile-picture-ai.ts`
- `backend/src/routes/enhanced-job-evaluation.ts`

### Test Files:
- `backend/src/tests/profile-picture-ai.test.ts`
- `backend/src/tests/advanced-ai-systems.test.ts`
- `backend/src/tests/enhanced-job-evaluation.test.ts`

### Other References:
- Check `backend/src/simple-server.ts` for route registrations
- Check `backend/src/container/DIContainer.ts` for service registrations
- Check any frontend code that calls these endpoints

---

## ✅ Compliance Status

- **Route Registrations:** ✅ Disabled in server.ts
- **Physical Files:** ⚠️ Still exist (marked for deletion)
- **Imports:** ⚠️ Still exist (marked for removal)
- **Tests:** ⚠️ Still exist (marked for deletion)
- **Allowed AI System:** ✅ AdvancedAMLService preserved










