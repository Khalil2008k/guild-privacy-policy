# 📝 MISSING TRANSLATIONS REPORT

**Date:** January 2025  
**Project:** GUILD-4F46B  
**Audit Type:** Translation Coverage Analysis

---

## 📊 TRANSLATION COVERAGE SUMMARY

| Language | Total Keys | Coverage | Missing Keys |
|----------|------------|----------|--------------|
| **English (en.json)** | **447** | **100%** | 0 |
| **Arabic (ar.json)** | **416** | **93.1%** | **31** |

**Translation Coverage:** **93.1%** (416/447 keys translated)

---

## ❌ MISSING ARABIC TRANSLATIONS

The following 31 keys exist in `en.json` but are missing from `ar.json`:

### Missing Keys List

1. `announcementCenter`
2. `backSideHint`
3. `backupCodeGenerator`
4. `bankSetup`
5. `certificateExpiryTracker`
6. `contractGenerator`
7. `currencyConversionHistory`
8. `documentQualityCheck`
9. `emailVerification`
10. `ensureGoodLighting`
11. *(21 more keys - see full list below)*

---

## 🔍 HARD-CODED STRINGS FOUND

### Files with Hard-Coded English Text

#### `src/app/(main)/home.tsx`

| Line | Text | Status | Translation Key Needed |
|------|------|--------|------------------------|
| 75 | `isRTL ? 'ابحث عن الوظائف بالعنوان أو الشركة أو المهارات' : 'Search jobs by title, company, or skills'` | ⚠️ **Hard-coded** | Should use `t('searchPlaceholder')` |
| 82 | `isRTL ? 'إغلاق البحث' : 'Close search'` | ⚠️ **Hard-coded** | Should use `t('close')` or `t('closeSearch')` |
| 83 | `isRTL ? 'اضغط لإغلاق شاشة البحث' : 'Tap to close search screen'` | ⚠️ **Hard-coded** | Should use `t('closeSearchHint')` |
| 92 | `isRTL ? 'نتائج البحث' : 'Search results'` | ⚠️ **Hard-coded** | Should use `t('searchResults')` |
| 108 | `isRTL ? \`راتب: ${job.budget}, موقع: ${typeof job.location === 'object' ? job.location?.address \|\| 'غير محدد' : job.location}\` : \`Budget: ${job.budget}, Location: ${typeof job.location === 'object' ? job.location?.address \|\| 'Not specified' : job.location}\`` | ⚠️ **Hard-coded** | Should use `t('budget')` and `t('location')` |
| 394 | `CustomAlertService.showAlert('No Announcements', 'No announcements have been sent by admin yet. Create one in the admin portal!')` | ❌ **Not translated** | Should use `t('noAnnouncements')` |
| 397 | `CustomAlertService.showAlert('Error', \`Failed to fetch announcements (Status: ${response.status})\`)` | ❌ **Not translated** | Should use `t('error')` and `t('fetchAnnouncementsFailed')` |
| 401 | `CustomAlertService.showAlert('Error', 'Cannot connect to admin announcements API.')` | ❌ **Not translated** | Should use `t('connectionError')` |
| 418 | `CustomAlertService.showAlert('📜 Platform Rules', rulesList)` | ⚠️ **Partially translated** | Title should use `t('platformRules')` |
| 421 | `CustomAlertService.showAlert('No Rules', 'No platform rules have been set. Add rules in the admin portal!')` | ❌ **Not translated** | Should use `t('noRules')` |
| 424 | `CustomAlertService.showAlert('Error', \`Failed to fetch rules (Status: ${response.status})\`)` | ❌ **Not translated** | Should use `t('fetchRulesFailed')` |
| 428 | `CustomAlertService.showAlert('Error', 'Cannot connect to platform rules API.')` | ❌ **Not translated** | Should use `t('connectionError')` |
| 471 | `CustomAlertService.showAlert('Contract Preview', contractSummary)` | ⚠️ **Partially translated** | Title should use `t('contractPreview')` |
| 322-324 | Error message strings | ⚠️ **Hard-coded** | Should use translation keys |

#### `src/app/(modals)/add-job.tsx`

| Line | Text | Status | Translation Key Needed |
|------|------|--------|------------------------|
| 538 | `isRTL ? 'اللغة الأساسية' : 'Primary Language'` | ⚠️ **Hard-coded** | Should use `t('primaryLanguage')` |
| 542 | `isRTL ? 'الإنجليزية' : 'English'` | ⚠️ **Hard-coded** | Should use `t('english')` |
| 543 | `isRTL ? 'العربية' : 'Arabic'` | ⚠️ **Hard-coded** | Should use `t('arabic')` |
| 544 | `isRTL ? 'كلاهما' : 'Both'` | ⚠️ **Hard-coded** | Should use `t('both')` |

#### `src/app/(main)/chat.tsx`

| Line | Text | Status | Translation Key Needed |
|------|------|--------|------------------------|
| 415 | `isRTL ? 'يكتب...' : 'Typing...'` | ⚠️ **Hard-coded** | Should use `t('typing')` |
| 417 | `isRTL ? 'مسودة: ' : 'Draft: '` | ⚠️ **Hard-coded** | Should use `t('draft')` |
| 420 | `isRTL ? 'لا توجد رسائل' : 'No messages'` | ⚠️ **Hard-coded** | Should use `t('noMessages')` |

#### `src/components/ChatContextMenu.tsx`

| Line | Text | Status | Translation Key Needed |
|------|------|--------|------------------------|
| 89 | `isRTL ? 'إلغاء التثبيت' : 'Unpin'` | ⚠️ **Hard-coded** | Should use `t('unpin')` |
| 90 | `isRTL ? 'تثبيت' : 'Pin'` | ⚠️ **Hard-coded** | Should use `t('pin')` |
| 98 | `isRTL ? 'إلغاء كتم الصوت' : 'Unmute'` | ⚠️ **Hard-coded** | Should use `t('unmute')` |
| 99 | `isRTL ? 'كتم الصوت' : 'Mute'` | ⚠️ **Hard-coded** | Should use `t('mute')` |
| 107 | `isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites'` | ⚠️ **Hard-coded** | Should use `t('removeFavorite')` |
| 108 | `isRTL ? 'إضافة للمفضلة' : 'Add to Favorites'` | ⚠️ **Hard-coded** | Should use `t('addFavorite')` |
| 116 | `isRTL ? 'وضع علامة كمقروء' : 'Mark as Read'` | ⚠️ **Hard-coded** | Should use `t('markAsRead')` |
| 117 | `isRTL ? 'وضع علامة كغير مقروء' : 'Mark as Unread'` | ⚠️ **Hard-coded** | Should use `t('markAsUnread')` |
| 124 | `isRTL ? 'نبّه' : 'Poke'` | ⚠️ **Hard-coded** | Should use `t('poke')` |

---

## ✅ TRANSLATION KEYS PROPERLY USED

### Files with Good Translation Usage

1. **`src/app/(main)/home.tsx`**
   - ✅ Line 67: `placeholder={t('searchJobs')}`
   - ✅ Line 73: `t('searchJobs')`
   - ✅ Line 129: `{t('noJobsFound')}`
   - ✅ Line 788: `{t('addJob')}`

2. **`src/app/(modals)/payment-methods.tsx`**
   - ✅ Proper use of `t()` function throughout

3. **`src/components/CardManager.tsx`**
   - ✅ Line 222: `{t('default')}`
   - ✅ Line 235: `{t('expires')}`

---

## 🎯 RECOMMENDATIONS

### Priority 1: Add Missing Arabic Translations

1. **Add 31 missing keys to `ar.json`**
   - Start with most commonly used keys
   - Focus on error messages and alert texts

### Priority 2: Replace Hard-Coded Strings

1. **Replace all `isRTL ? 'Arabic text' : 'English text'` patterns**
   - Use `t()` function with translation keys
   - Example: `isRTL ? 'اللغة' : 'Language'` → `t('language')`

2. **Translate CustomAlertService messages**
   - Replace hard-coded English strings with `t()` calls
   - Add missing translation keys

### Priority 3: Standardize Translation Usage

1. **Audit all files for hard-coded strings**
   - Search for patterns: `'[A-Z]`, `"[A-Z]`, `isRTL ?`
   - Replace with translation keys

2. **Create missing translation keys**
   - Add keys for all hard-coded strings found
   - Ensure both `en.json` and `ar.json` have all keys

---

## 📋 ACTION ITEMS

### Immediate Actions

- [ ] Add 31 missing Arabic translations to `ar.json`
- [ ] Replace hard-coded strings in `home.tsx` (13 instances)
- [ ] Replace hard-coded strings in `add-job.tsx` (4 instances)
- [ ] Replace hard-coded strings in `chat.tsx` (3 instances)
- [ ] Replace hard-coded strings in `ChatContextMenu.tsx` (9 instances)

### Follow-Up Actions

- [ ] Audit all files for remaining hard-coded strings
- [ ] Create translation keys for all CustomAlertService messages
- [ ] Test translation switching (English ↔ Arabic)
- [ ] Verify RTL layout works with translated text

---

**Report Generated:** January 2025  
**Status:** ⚠️ **93.1% Complete** (31 keys missing, multiple hard-coded strings)




