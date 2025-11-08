# Chat System TODO - Part 7: New Components
**Priority:** MEDIUM | **Status:** Planning | **SDK 54:** ✅ Compatible

---

## ✅ CURRENT STATUS CHECK

### Components We Have:
- ✅ ChatMessage.tsx
- ✅ ChatInput.tsx
- ✅ ReactionPicker.tsx
- ✅ ReplyPreview.tsx
- ✅ MessageStatusIndicator.tsx
- ✅ EnhancedTypingIndicator.tsx
- ✅ DisappearingMessageTimer.tsx
- ✅ MessageTranslation.tsx
- ✅ LinkPreview.tsx
- ✅ ChatExportModal.tsx

---

## 📋 TODO TASKS - New Components

### Task 7.1: MarkdownRenderer.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes (react-native-markdown-display)
- [ ] **What it is:** Component to render markdown in messages
- [ ] **Why needed:** Support markdown formatting in messages
- [ ] **Implementation:**
  - [ ] Install react-native-markdown-display
  - [ ] Create component
  - [ ] Style markdown elements
  - [ ] Test with various markdown
- [ ] **Files to create:** `src/components/MarkdownRenderer.tsx`
- [ ] **Estimated Time:** 1 day

---

### Task 7.2: RichTextEditor.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (react-native-pell-rich-editor or custom)
- [ ] **What it is:** Rich text editor component with formatting toolbar
- [ ] **Why needed:** Text formatting before sending
- [ ] **Implementation:**
  - [ ] Research SDK 54 compatible rich text editor
  - [ ] Create component with toolbar
  - [ ] Add formatting buttons (bold, italic, etc.)
  - [ ] Integrate with ChatInput
- [ ] **Files to create:** `src/components/RichTextEditor.tsx`
- [ ] **Estimated Time:** 2-3 days

---

### Task 7.3: MentionAutocomplete.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Autocomplete dropdown for @mentions
- [ ] **Why needed:** Core mention functionality
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Detect @ in input
  - [ ] Show user list dropdown
  - [ ] Handle selection
  - [ ] Integrate with ChatInput
- [ ] **Files to create:** `src/components/MentionAutocomplete.tsx`
- [ ] **Estimated Time:** 2 days

---

### Task 7.4: MessageThreadView.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Full thread view component for nested replies
- [ ] **Why needed:** Threading functionality
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Show parent message
  - [ ] Show thread replies
  - [ ] Add reply input
  - [ ] Add navigation
- [ ] **Files to create:** `src/components/MessageThreadView.tsx`
- [ ] **Estimated Time:** 3-4 days

---

### Task 7.5: PinnedMessagesScreen.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Screen showing all pinned messages in a chat
- [ ] **Why needed:** Easy access to pinned messages
- [ ] **Implementation:**
  - [ ] Create screen component
  - [ ] Fetch pinned messages
  - [ ] Display list
  - [ ] Add navigation to message
  - [ ] Add unpin functionality
- [ ] **Files to create:** `src/app/(modals)/pinned-messages.tsx`
- [ ] **Estimated Time:** 2 days

---

### Task 7.6: StarredMessagesScreen.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Screen showing all starred messages across chats
- [ ] **Why needed:** Quick access to important messages
- [ ] **Implementation:**
  - [ ] Create screen component
  - [ ] Fetch starred messages from all chats
  - [ ] Group by chat or category
  - [ ] Display list
  - [ ] Add navigation to message
- [ ] **Files to create:** `src/app/(main)/starred-messages.tsx`
- [ ] **Estimated Time:** 2 days

---

### Task 7.7: ImageEditor.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (expo-image-manipulator)
- [ ] **What it is:** Image editor component with crop, rotate, filters
- [ ] **Why needed:** Image editing before sending
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Add crop tool
  - [ ] Add rotate tool
  - [ ] Add brightness/contrast sliders
  - [ ] Add filter options
  - [ ] Integrate with image picker
- [ ] **Files to create:** `src/components/ImageEditor.tsx`
- [ ] **Estimated Time:** 3-4 days

---

### Task 7.8: ImageAnnotation.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes (react-native-sketch-canvas or expo-canvas)
- [ ] **What it is:** Drawing/annotation component for images
- [ ] **Why needed:** Markup images, add notes
- [ ] **Implementation:**
  - [ ] Research SDK 54 compatible canvas library
  - [ ] Create component
  - [ ] Add drawing tools
  - [ ] Add text overlay
  - [ ] Save annotated image
- [ ] **Files to create:** `src/components/ImageAnnotation.tsx`
- [ ] **Estimated Time:** 3-4 days

---

### Task 7.9: FilePreview.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** File preview component for PDF, images, text files
- [ ] **Why needed:** Preview files before downloading
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Support PDF preview
  - [ ] Support image preview
  - [ ] Support text file preview
  - [ ] Add download button
- [ ] **Files to create:** `src/components/FilePreview.tsx`
- [ ] **Estimated Time:** 2-3 days

---

### Task 7.10: MessageSkeleton.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Skeleton screen component for loading messages
- [ ] **Why needed:** Better loading UX
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Design skeleton layout
  - [ ] Add shimmer animation
  - [ ] Use during initial load
- [ ] **Files to create:** `src/components/MessageSkeleton.tsx`
- [ ] **Estimated Time:** 1 day

---

### Task 7.11: NetworkStatusIndicator.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (@react-native-community/netinfo)
- [ ] **What it is:** Network status indicator component
- [ ] **Why needed:** Show network status to users
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Monitor network state
  - [ ] Show online/offline indicator
  - [ ] Show offline queue count
- [ ] **Files to create:** `src/components/NetworkStatusIndicator.tsx`
- [ ] **Estimated Time:** 1 day

---

### Task 7.12: ReadReceiptDetailModal.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Modal showing who read the message and when
- [ ] **Why needed:** Enhanced read receipts detail
- [ ] **Implementation:**
  - [ ] Create modal component
  - [ ] Fetch read receipt data
  - [ ] Show user list with avatars
  - [ ] Show timestamps
  - [ ] Add close button
- [ ] **Files to create:** `src/components/ReadReceiptDetailModal.tsx`
- [ ] **Estimated Time:** 1-2 days

---

### Task 7.13: TemplatePicker.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Component to pick message templates
- [ ] **Why needed:** Quick message templates
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Fetch templates from service
  - [ ] Show template list
  - [ ] Handle selection
  - [ ] Insert into input
- [ ] **Files to create:** `src/components/TemplatePicker.tsx`
- [ ] **Estimated Time:** 1-2 days

---

### Task 7.14: HashtagLink.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Clickable hashtag component
- [ ] **Why needed:** Hashtag functionality
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Detect hashtags in text
  - [ ] Make clickable
  - [ ] Navigate to hashtag search
- [ ] **Files to create:** `src/components/HashtagLink.tsx`
- [ ] **Estimated Time:** 1 day

---

### Task 7.15: ThreadBreadcrumb.tsx
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Breadcrumb component for thread navigation
- [ ] **Why needed:** Navigate between threads
- [ ] **Implementation:**
  - [ ] Create component
  - [ ] Show thread hierarchy
  - [ ] Add navigation buttons
  - [ ] Integrate with thread view
- [ ] **Files to create:** `src/components/ThreadBreadcrumb.tsx`
- [ ] **Estimated Time:** 1-2 days

---

**Total Tasks in This Chunk:** 15  
**Estimated Time:** 4-5 weeks  
**Next File:** `CHAT_TODO_08_SECURITY_PRIVACY.md`






