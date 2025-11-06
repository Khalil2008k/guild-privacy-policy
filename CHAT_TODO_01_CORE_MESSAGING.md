# Chat System TODO - Part 1: Core Messaging Features
**Priority:** HIGH | **Status:** Planning | **SDK 54:** ✅ Compatible

---

## ✅ CURRENT STATUS CHECK

### What We Have:
- ✅ Text messages (basic)
- ✅ Image sharing
- ✅ Video sharing  
- ✅ Voice messages
- ✅ File sharing
- ✅ Reply to messages
- ✅ Edit messages
- ✅ Delete messages
- ✅ Message reactions (basic)
- ✅ Read receipts (basic)

---

## 📋 TODO TASKS - Core Messaging

### Task 1.1: Markdown Support
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes (use `react-native-markdown-display`)
- [ ] **What it is:** Parse and render markdown syntax in messages (bold, italic, code blocks, links)
- [ ] **Why needed:** Better message formatting, code sharing, rich text display
- [ ] **Implementation:**
  - [ ] Install `react-native-markdown-display` package
  - [ ] Create `MarkdownRenderer` component
  - [ ] Integrate into `ChatMessage.tsx`
  - [ ] Add markdown parsing in `chatService.ts`
  - [ ] Test with various markdown syntax
- [ ] **Files to create:** `src/components/MarkdownRenderer.tsx`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`, `src/services/chatService.ts`

---

### Task 1.2: Rich Text Editor
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (use `react-native-pell-rich-editor` or custom)
- [ ] **What it is:** Text formatting toolbar with bold, italic, underline, strikethrough buttons
- [ ] **Why needed:** Users can format text before sending, better message presentation
- [ ] **Implementation:**
  - [ ] Create `RichTextEditor` component
  - [ ] Add formatting toolbar to `ChatInput.tsx`
  - [ ] Store formatted text in message data
  - [ ] Render formatted text in messages
- [ ] **Files to create:** `src/components/RichTextEditor.tsx`
- [ ] **Files to modify:** `src/components/ChatInput.tsx`, `src/components/ChatMessage.tsx`

---

### Task 1.3: @Mentions System
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** @username autocomplete and mention highlighting in messages
- [ ] **Why needed:** Tag users, notify them, common chat feature
- [ ] **Implementation:**
  - [ ] Create `MentionAutocomplete` component
  - [ ] Detect @ in input field
  - [ ] Show user list dropdown
  - [ ] Highlight mentions in messages
  - [ ] Send notifications to mentioned users
- [ ] **Files to create:** `src/components/MentionAutocomplete.tsx`, `src/services/mentionService.ts`
- [ ] **Files to modify:** `src/components/ChatInput.tsx`, `src/components/ChatMessage.tsx`

---

### Task 1.4: Hashtag Support
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Make hashtags clickable with search/filter functionality
- [ ] **Why needed:** Categorize messages, enable hashtag-based search
- [ ] **Implementation:**
  - [ ] Detect hashtags in messages (#tag)
  - [ ] Make hashtags clickable
  - [ ] Create hashtag search screen
  - [ ] Add hashtag filtering
- [ ] **Files to create:** `src/components/HashtagLink.tsx`, `src/app/(modals)/hashtag-search.tsx`
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`, `src/services/messageSearchService.ts`

---

### Task 1.5: Emoji Picker Integration
- [ ] **Status:** Partially Implemented
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (use `expo-emoji` or system picker)
- [ ] **What it is:** Replace custom emoji picker with native/system emoji picker
- [ ] **Why needed:** Better emoji selection, native feel, more emojis
- [ ] **Implementation:**
  - [ ] Research SDK 54 compatible emoji picker
  - [ ] Replace current `ReactionPicker` with native picker
  - [ ] Add emoji button to input toolbar
  - [ ] Integrate emoji insertion into text
- [ ] **Files to modify:** `src/components/ReactionPicker.tsx`, `src/components/ChatInput.tsx`

---

### Task 1.6: Emoji Auto-Suggestions
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Show emoji suggestions while typing (e.g., ":)" → 😊)
- [ ] **Why needed:** Faster emoji input, better UX
- [ ] **Implementation:**
  - [ ] Create emoji suggestion library/dictionary
  - [ ] Detect emoji patterns in input
  - [ ] Show suggestion dropdown
  - [ ] Allow selection from suggestions
- [ ] **Files to create:** `src/utils/emojiSuggestions.ts`
- [ ] **Files to modify:** `src/components/ChatInput.tsx`

---

### Task 1.7: Message Draft Auto-Save
- [ ] **Status:** Not Started
- [ ] **Priority:** HIGH
- [ ] **SDK 54 Compatible:** Yes (AsyncStorage)
- [ ] **What it is:** Auto-save message drafts per chat, recover on app restart
- [ ] **Why needed:** Prevent message loss, better UX, WhatsApp-like feature
- [ ] **Implementation:**
  - [ ] Create `DraftService.ts`
  - [ ] Auto-save on input change (debounced)
  - [ ] Load draft on chat open
  - [ ] Clear draft on send
  - [ ] Show draft indicator in UI
- [ ] **Files to create:** `src/services/draftService.ts`
- [ ] **Files to modify:** `src/components/ChatInput.tsx`, `src/app/(modals)/chat/[jobId].tsx`

---

### Task 1.8: Message Templates
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes
- [ ] **What it is:** Save and reuse common message templates
- [ ] **Why needed:** Faster responses, business communication, efficiency
- [ ] **Implementation:**
  - [ ] Create `MessageTemplateService.ts`
  - [ ] Create template management UI
  - [ ] Add template picker to input
  - [ ] Allow template creation/editing
- [ ] **Files to create:** `src/services/messageTemplateService.ts`, `src/components/TemplatePicker.tsx`
- [ ] **Files to modify:** `src/components/ChatInput.tsx`

---

### Task 1.9: Voice-to-Text Conversion
- [ ] **Status:** Not Started
- [ ] **Priority:** MEDIUM
- [ ] **SDK 54 Compatible:** Yes (expo-speech or native APIs)
- [ ] **What it is:** Convert voice input to text before sending
- [ ] **Why needed:** Accessibility, faster input, hands-free messaging
- [ ] **Implementation:**
  - [ ] Research SDK 54 voice recognition API
  - [ ] Create voice-to-text service
  - [ ] Add voice input button
  - [ ] Show transcription in input field
- [ ] **Files to create:** `src/services/voiceToTextService.ts`
- [ ] **Files to modify:** `src/components/ChatInput.tsx`

---

### Task 1.10: Text-to-Speech (Read Messages)
- [ ] **Status:** Not Started
- [ ] **Priority:** LOW
- [ ] **SDK 54 Compatible:** Yes (expo-speech)
- [ ] **What it is:** Read messages aloud for accessibility
- [ ] **Why needed:** Accessibility, hands-free reading, vision impaired users
- [ ] **Implementation:**
  - [ ] Add "Read" button to messages
  - [ ] Use expo-speech to read text
  - [ ] Add playback controls (pause/resume)
  - [ ] Add voice speed options
- [ ] **Files to modify:** `src/components/ChatMessage.tsx`

---

**Total Tasks in This Chunk:** 10  
**Estimated Time:** 4-6 weeks  
**Next File:** `CHAT_TODO_02_MESSAGE_ACTIONS.md`





