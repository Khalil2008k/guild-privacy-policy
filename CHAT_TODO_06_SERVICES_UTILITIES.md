# Chat System TODO - Part 6: Services & Utilities
**Priority:** HIGH | **Status:** Planning | **SDK 54:** ✅ Compatible

---

## ✅ CURRENT STATUS CHECK

### Services We Have:
- ✅ chatService.ts
- ✅ PresenceService.ts
- ✅ MessageQueueService.ts
- ✅ MessageNotificationService.ts
- ✅ chatFileService.ts
- ✅ messageSearchService.ts
- ✅ disappearingMessageService.ts
- ✅ messageSchedulerService.ts
- ✅ chatThemeService.ts
- ✅ chatExportService.ts
- ✅ ImageCompressionService.ts
- ✅ ChatStorageProvider.ts

---

## 📋 TODO TASKS - New Services & Utilities

### Task 6.1: DraftService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes (AsyncStorage)
- [ ] **What it is:** Service to auto-save and restore message drafts per chat
- [ ] **Why needed:** Prevent message loss, better UX
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement saveDraft(chatId, text)
  - [ ] Implement getDraft(chatId)
  - [ ] Implement clearDraft(chatId)
  - [ ] Add auto-save on input change (debounced)
- [ ] **Files to create:** `src/services/draftService.ts`
- [ ] **Estimated Time:** 1 day

---

### Task 6.2: MentionService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Service to handle @mentions, find users, send notifications
- [ ] **Why needed:** Core mention functionality
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement findUsers(query)
  - [ ] Implement extractMentions(text)
  - [ ] Implement sendMentionNotifications(mentions, messageId)
  - [ ] Integrate with UserSearchService
- [ ] **Files to create:** `src/services/mentionService.ts`
- [ ] **Estimated Time:** 2 days

---

### Task 6.3: MessageTemplateService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (AsyncStorage)
- [ ] **What it is:** Service to save, manage, and retrieve message templates
- [ ] **Why needed:** Faster responses, business communication
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement saveTemplate(name, text)
  - [ ] Implement getTemplates()
  - [ ] Implement deleteTemplate(id)
  - [ ] Implement updateTemplate(id, text)
  - [ ] Store in AsyncStorage
- [ ] **Files to create:** `src/services/messageTemplateService.ts`
- [ ] **Estimated Time:** 1 day

---

### Task 6.4: MessageReminderService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (expo-notifications)
- [ ] **What it is:** Service to schedule reminders for messages
- [ ] **Why needed:** Follow-up reminders, task management
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement setReminder(messageId, delay)
  - [ ] Implement cancelReminder(reminderId)
  - [ ] Schedule local notifications
  - [ ] Handle reminder callback
- [ ] **Files to create:** `src/services/messageReminderService.ts`
- [ ] **Estimated Time:** 2 days

---

### Task 6.5: MessageLabelService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Service to manage labels/tags for messages
- [ ] **Why needed:** Message organization, categorization
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement addLabel(messageId, label)
  - [ ] Implement removeLabel(messageId, label)
  - [ ] Implement getMessagesByLabel(label)
  - [ ] Store in Firestore
- [ ] **Files to create:** `src/services/messageLabelService.ts`
- [ ] **Estimated Time:** 1 day

---

### Task 6.6: MessageNoteService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes (AsyncStorage)
- [ ] **What it is:** Service to add private notes to messages (local only)
- [ ] **Why needed:** Personal reminders, context
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement saveNote(messageId, note)
  - [ ] Implement getNote(messageId)
  - [ ] Implement deleteNote(messageId)
  - [ ] Store in AsyncStorage (local only)
- [ ] **Files to create:** `src/services/messageNoteService.ts`
- [ ] **Estimated Time:** 1 day

---

### Task 6.7: VideoCompressionService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (expo-av or native)
- [ ] **What it is:** Service to compress videos before upload
- [ ] **Why needed:** Reduce file size, faster uploads
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement compressVideo(uri, quality)
  - [ ] Add quality options (low, medium, high)
  - [ ] Show progress
  - [ ] Return compressed file URI
- [ ] **Files to create:** `src/services/videoCompressionService.ts`
- [ ] **Estimated Time:** 2-3 days

---

### Task 6.8: VoiceToTextService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (expo-speech or native APIs)
- [ ] **What it is:** Service to convert voice input to text
- [ ] **Why needed:** Accessibility, faster input
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Research SDK 54 voice recognition API
  - [ ] Implement startRecording()
  - [ ] Implement stopRecordingAndTranscribe()
  - [ ] Return transcribed text
- [ ] **Files to create:** `src/services/voiceToTextService.ts`
- [ ] **Estimated Time:** 3-4 days

---

### Task 6.9: MessageThreadService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Service to manage message threads and nested replies
- [ ] **Why needed:** Threading functionality, better organization
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement createThread(parentMessageId)
  - [ ] Implement getThreadMessages(threadId)
  - [ ] Implement addToThread(threadId, message)
  - [ ] Update message schema for threading
- [ ] **Files to create:** `src/services/messageThreadService.ts`
- [ ] **Estimated Time:** 2-3 days

---

### Task 6.10: MessageArchiveService.ts
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Service to archive and restore messages
- [ ] **Why needed:** Keep history without cluttering
- [ ] **Implementation:**
  - [ ] Create service file
  - [ ] Implement archiveMessage(messageId)
  - [ ] Implement getArchivedMessages(chatId)
  - [ ] Implement restoreMessage(messageId)
  - [ ] Store archive status in Firestore
- [ ] **Files to create:** `src/services/messageArchiveService.ts`
- [ ] **Estimated Time:** 1-2 days

---

### Task 6.11: MessageAnalyticsService Enhancement
- [ ] **Status:** Partially Implemented (basic analytics exists)
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Enhanced analytics (sentiment, urgency, keywords, trends)
- [ ] **Why needed:** Better insights, AI features
- [ ] **Implementation:**
  - [ ] Enhance existing service
  - [ ] Add sentiment analysis
  - [ ] Add keyword extraction
  - [ ] Add trend analysis
  - [ ] Add usage statistics
- [ ] **Files to modify:** `src/services/MessageAnalyticsService.ts`
- [ ] **Estimated Time:** 3-4 days

---

### Task 6.12: MessageSearchService Enhancement
- [ ] **Status:** Partially Implemented (basic search exists)
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Enhanced search with filters (date, type, sender, media)
- [ ] **Why needed:** Better search functionality
- [ ] **Implementation:**
  - [ ] Add date range filter
  - [ ] Add message type filter
  - [ ] Add sender filter
  - [ ] Add media search
  - [ ] Add hashtag search
- [ ] **Files to modify:** `src/services/messageSearchService.ts`
- [ ] **Estimated Time:** 2-3 days

---

**Total Tasks in This Chunk:** 12  
**Estimated Time:** 3-4 weeks  
**Next File:** `CHAT_TODO_07_COMPONENTS.md`


