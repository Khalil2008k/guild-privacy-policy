# Chat System TODO - Part 2: Message Actions & Features
**Priority:** HIGH | **Status:** Planning | **SDK 54:** ✅ Compatible

---

## ✅ CURRENT STATUS CHECK

### What We Have:
- ✅ Pin message (single)
- ✅ Star message (basic)
- ✅ Reply to messages
- ✅ Forward messages (basic)
- ✅ Edit messages
- ✅ Delete messages
- ✅ Copy message text
- ✅ View edit history (admin)

---

## 📋 TODO TASKS - Message Actions

### Task 2.1: Pin Multiple Messages
- [ ] **Status:** Partially Implemented (single pin exists)
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Allow users to pin multiple messages per chat (currently only one)
- [ ] **Why needed:** Pin multiple important messages, better organization
- [ ] **Implementation:**
  - [ ] Update `Message` interface to support multiple pins
  - [ ] Modify `chatService.ts` pin logic
  - [ ] Update UI to show multiple pinned messages
  - [ ] Add "Unpin" option for each pinned message
- [ ] **Files to modify:** `src/services/chatService.ts`, `src/components/ChatMessage.tsx`, `src/app/(modals)/chat/[jobId].tsx`

---

### Task 2.2: Pinned Messages View Screen
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Dedicated screen showing all pinned messages in a chat
- [ ] **Why needed:** Easy access to pinned messages, better UX
- [ ] **Implementation:**
  - [ ] Create `PinnedMessagesScreen.tsx`
  - [ ] Add route to pinned messages
  - [ ] Fetch and display all pinned messages
  - [ ] Allow navigation to message in chat
  - [ ] Add unpin functionality
- [ ] **Files to create:** `src/app/(modals)/pinned-messages.tsx`
- [ ] **Files to modify:** `src/app/(modals)/chat/[jobId].tsx`

---

### Task 2.3: Star Categories
- [ ] **Status:** Partially Implemented (basic star exists)
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Star messages with categories (work, personal, important, etc.)
- [ ] **Why needed:** Better organization, categorize starred messages
- [ ] **Implementation:**
  - [ ] Update star system to support categories
  - [ ] Add category selection when starring
  - [ ] Show category badges on starred messages
  - [ ] Filter by category in starred view
- [ ] **Files to modify:** `src/services/chatService.ts`, `src/components/ChatMessage.tsx`

---

### Task 2.4: Starred Messages Screen
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Dedicated screen showing all starred messages across all chats
- [ ] **Why needed:** Quick access to important messages, better organization
- [ ] **Implementation:**
  - [ ] Create `StarredMessagesScreen.tsx`
  - [ ] Fetch all starred messages from all chats
  - [ ] Group by chat or category
  - [ ] Allow navigation to message in chat
  - [ ] Add unstar functionality
- [ ] **Files to create:** `src/app/(main)/starred-messages.tsx`
- [ ] **Files to modify:** `src/app/(main)/chat.tsx` (add navigation)

---

### Task 2.5: Message Labels/Tags
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Add custom labels/tags to messages for organization
- [ ] **Why needed:** Categorize messages, better search, organization
- [ ] **Implementation:**
  - [ ] Create label management system
  - [ ] Add label picker to message actions
  - [ ] Display labels on messages
  - [ ] Filter messages by label
- [ ] **Files to create:** `src/services/messageLabelService.ts`, `src/components/MessageLabelPicker.tsx`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`, `src/services/chatService.ts`

---

### Task 2.6: Private Message Notes
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Add private notes to messages (visible only to you)
- [ ] **Why needed:** Personal reminders, context, private annotations
- [ ] **Implementation:**
  - [ ] Add note field to message data (local storage)
  - [ ] Create note editor UI
  - [ ] Show note indicator on messages
  - [ ] Store notes in AsyncStorage
- [ ] **Files to create:** `src/services/messageNoteService.ts`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`

---

### Task 2.7: Message Reminders
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (expo-notifications)
- [ ] **What it is:** Set reminders for specific messages (e.g., remind me in 1 hour)
- [ ] **Why needed:** Follow-up reminders, task management, productivity
- [ ] **Implementation:**
  - [ ] Create `MessageReminderService.ts`
  - [ ] Add reminder button to message actions
  - [ ] Schedule local notifications
  - [ ] Show reminder indicator on messages
- [ ] **Files to create:** `src/services/messageReminderService.ts`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`

---

### Task 2.8: Message Threading (Full UI)
- [ ] **Status:** Partially Implemented (reply exists, threading UI missing)
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Full thread view for replies with nested conversations
- [ ] **Why needed:** Better reply organization, Slack/Discord-like threading
- [ ] **Implementation:**
  - [ ] Create `MessageThreadView.tsx` component
  - [ ] Update message data structure for threading
  - [ ] Add thread navigation
  - [ ] Show thread indicators in chat
  - [ ] Add "View thread" button
- [ ] **Files to create:** `src/components/MessageThreadView.tsx`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`, `src/services/chatService.ts`

---

### Task 2.9: Thread Navigation
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Navigate between message threads with breadcrumbs
- [ ] **Why needed:** Easy navigation in threaded conversations
- [ ] **Implementation:**
  - [ ] Create thread breadcrumb component
  - [ ] Add navigation between threads
  - [ ] Show thread hierarchy
  - [ ] Add "Back to thread" button
- [ ] **Files to create:** `src/components/ThreadBreadcrumb.tsx`
- [ ] **Files to modify:** `src/components/MessageThreadView.tsx`

---

### Task 2.10: Quote Multiple Messages
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Quote multiple messages in one reply
- [ ] **Why needed:** Reference multiple messages, better context
- [ ] **Implementation:**
  - [ ] Add multi-select for quote
  - [ ] Update quote UI to show multiple messages
  - [ ] Modify quote data structure
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`, `src/components/ChatInput.tsx`

---

### Task 2.11: Forward with Comment Enhancement
- [ ] **Status:** Partially Implemented (forward exists)
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Add comment field when forwarding messages
- [ ] **Why needed:** Add context when forwarding, better communication
- [ ] **Implementation:**
  - [ ] Add comment input to forward modal
  - [ ] Store comment with forwarded message
  - [ ] Display comment in forwarded message
- [ ] **Files to modify:** `src/components/ForwardMessageModal.tsx`, `src/services/chatService.ts`

---

### Task 2.12: Forward to Multiple Chats
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Forward messages to multiple chats at once
- [ ] **Why needed:** Efficiency, share with multiple people quickly
- [ ] **Implementation:**
  - [ ] Update forward modal to allow multi-select
  - [ ] Add chat list selection
  - [ ] Batch forward operation
- [ ] **Files to modify:** `src/components/ForwardMessageModal.tsx`, `src/services/chatService.ts`

---

### Task 2.13: Enhanced Bulk Message Actions
- [ ] **Status:** Partially Implemented (selection mode exists)
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Expand bulk operations (copy, delete, forward, pin, star, etc.)
- [ ] **Why needed:** Better batch management, efficiency
- [ ] **Implementation:**
  - [ ] Add more bulk actions to toolbar
  - [ ] Implement bulk copy
  - [ ] Implement bulk pin/star
  - [ ] Implement bulk delete
  - [ ] Add bulk export
- [ ] **Files to modify:** `src/app/(modals)/chat/[jobId].tsx`, `src/components/ChatMessage.tsx`

---

### Task 2.14: Message Archive Feature
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Archive old messages instead of deleting them
- [ ] **Why needed:** Keep history without cluttering, restore if needed
- [ ] **Implementation:**
  - [ ] Create archive service
  - [ ] Add archive action to messages
  - [ ] Create archived messages view
  - [ ] Add restore functionality
- [ ] **Files to create:** `src/services/messageArchiveService.ts`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`

---

### Task 2.15: Enhanced Read Receipts Detail
- [ ] **Status:** Partially Implemented (basic checkmarks exist)
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Show who read the message and when (tap to see details)
- [ ] **Why needed:** Better read tracking, WhatsApp-like feature
- [ ] **Implementation:**
  - [ ] Update read receipt UI
  - [ ] Create read receipt detail modal
  - [ ] Show user list with timestamps
  - [ ] Add avatar icons
- [ ] **Files to create:** `src/components/ReadReceiptDetailModal.tsx`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`, `src/services/chatService.ts`

---

**Total Tasks in This Chunk:** 15  
**Estimated Time:** 6-8 weeks  
**Next File:** `CHAT_TODO_03_UI_UX.md`






