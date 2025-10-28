# 🔧 Chat List Screen - Issues & Fixes

## ❌ Issues Found

### 1. **Overlapping Indicators**
- Online indicator, group indicator, and admin indicator all positioned at `bottom: 2, right: 2`
- They stack on top of each other
- Only one visible at a time

### 2. **Non-Functional Online/Offline Status**
- Hardcoded `online: true` for all chats
- No real online status tracking
- Offline indicator in header not working

### 3. **Notification/Unread Count Issues**
- Unread badge positioning might overlap with action button
- No visual distinction for new messages vs old unread

### 4. **Layout Issues**
- Chat actions (unread badge + more button) not properly aligned
- Badges in title row might overflow
- Time text might overlap with badges

---

## ✅ Fixes to Apply

### Fix 1: Proper Indicator Positioning (No Overlap)
### Fix 2: Remove Non-Functional Online Status
### Fix 3: Improve Unread Badge Layout
### Fix 4: Clean Up Chat Item Layout
### Fix 5: Fix Offline Indicator Logic

---

## Implementation

Let me fix all these issues now...

