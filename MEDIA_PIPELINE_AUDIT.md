# 🔍 MEDIA PIPELINE AUDIT REPORT – GUILD CHAT SYSTEM
## COMPLETE TRUTH-BASED ANALYSIS (C1 Task)

**Date:** November 2025  
**Audit Scope:** All media capture, upload, and display features  
**SDK Version:** Expo SDK 54  
**Firebase:** Firestore + Storage v9+ modular API

---

## 1. INVENTORY: ALL MEDIA ENTRY POINTS

### 1.1 Photo Capture & Selection

**Entry Points:**
1. `ChatInput.tsx:203` - `handleTakePhoto()` → `ImagePicker.launchCameraAsync()`
2. `ChatInput.tsx:231` - `handlePickImage()` → `ImagePicker.launchImageLibraryAsync()`

**UI Component:** `ChatInput` → Attachment Menu → Camera/Image Icon

**Handler Chain:**
```
ChatInput.handleTakePhoto/handlePickImage
  → ImagePicker (expo-image-picker)
  → setSelectedImages() [local state]
  → ChatInput.handleSend() 
  → onSendImage(uri) [prop callback]
  → chat/[jobId].tsx:handleSendImage
  → useMediaHandlers.handleSendImage
  → chatFileService.uploadImageMessage
  → Firebase Storage
  → ChatStorageProvider.sendMessage
  → Firestore
```

**Current Status:** ⚠️ **PARTIALLY WORKING**
- ImagePicker configured correctly
- Upload service exists
- **Issue:** `getMediaType()` fallback may not work correctly with SDK 54

### 1.2 Video Recording & Selection

**Entry Points:**
1. `ChatInput.tsx` - Video recording button (if exists) → `onStartVideoRecording()` prop
2. `useMediaHandlers.ts:202` - `startVideoRecording()` → `ImagePicker.launchImageLibraryAsync()` with `MediaTypeOptions.Videos`

**UI Component:** Video icon in attachment menu (if present)

**Handler Chain:**
```
ChatInput.onStartVideoRecording
  → useMediaHandlers.startVideoRecording
  → ImagePicker.launchImageLibraryAsync({ mediaTypes: Videos })
  → useMediaHandlers.uploadVideoMessage
  → chatFileService.uploadVideoMessage
  → Firebase Storage (video + thumbnail)
  → ChatStorageProvider.sendMessage
  → Firestore
```

**Current Status:** ❌ **VIDEO CAMERA NOT IMPLEMENTED**
- Only video **picking** from gallery exists
- No **camera recording** flow
- Users cannot record videos directly in-app

### 1.3 Voice/Audio Recording

**Entry Points:**
1. `ChatInput.tsx:397` - Voice button → `onOpenAdvancedVoiceRecorder()` prop
2. `AdvancedVoiceRecorder.tsx` - Full-screen recorder modal

**UI Component:** `AdvancedVoiceRecorder` modal with waveform animation

**Handler Chain:**
```
ChatInput.onOpenAdvancedVoiceRecorder
  → AdvancedVoiceRecorder modal opens
  → AdvancedVoiceRecorder.startRecording()
  → Audio.Recording.createAsync()
  → AdvancedVoiceRecorder.stopRecording()
  → onRecordingComplete(uri, duration)
  → chat/[jobId].tsx:uploadVoiceMessage
  → useMediaHandlers.uploadVoiceMessage
  → chatFileService.uploadVoiceMessage
  → Firebase Storage
  → ChatStorageProvider.sendMessage
  → Firestore
```

**Current Status:** ✅ **IMPLEMENTED CORRECTLY**
- Uses `expo-av` correctly
- Proper permission handling
- Clean state management

### 1.4 Document/File Upload

**Entry Points:**
1. `ChatInput.tsx:260` - `handlePickDocument()` → `DocumentPicker.getDocumentAsync()`

**UI Component:** Attachment Menu → Document Icon

**Handler Chain:**
```
ChatInput.handlePickDocument
  → DocumentPicker.getDocumentAsync()
  → onSendFile(uri, name, type)
  → chat/[jobId].tsx:handleSendFile
  → useMediaHandlers.handleSendFile
  → chatFileService.uploadFileMessage
  → Firebase Storage
  → ChatStorageProvider.sendMessage
  → Firestore
```

**Current Status:** ✅ **IMPLEMENTED CORRECTLY**
- Uses `expo-document-picker` correctly
- Proper MIME type handling

---

## 2. TRACE "FAILED" STATE - ROOT CAUSE ANALYSIS

### 2.1 Where Failures Are Set

**In ChatMessage Component:**
- `ChatMessage.tsx:863-876` - Checks `message.uploadStatus === 'failed'`
- Renders error UI with `AlertCircle` icon and "Upload failed" text

**In Message Data Model:**
- `firebase/ChatService.ts:60` - Message interface includes `status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'`
- `useChatActions.ts:203` - Sets `status: 'failed'` on send error

**In Upload Services:**
- `chatFileService.ts` - All upload functions throw errors but **don't set uploadStatus**
- Errors are caught and logged, but **uploadStatus is never set to 'failed'**

### 2.2 Failure Points Identified

#### **Problem 1: Missing uploadStatus in Media Messages**

**Location:** `useMediaHandlers.ts`, `chatFileService.ts`

**Issue:**
- Media upload handlers create messages with `status: 'sent'` immediately
- If upload fails, error is thrown but message status is never updated to 'failed'
- `uploadStatus` field is not set during upload lifecycle

**Evidence:**
```typescript
// useMediaHandlers.ts:116-131 (voice message)
const messageData = {
  // ...
  status: 'sent' as const,  // Always 'sent', never 'uploading' or 'failed'
  // No uploadStatus field
};

// chatFileService.ts:233-267 (video message)
// Throws error but doesn't return status or update message
catch (error) {
  logger.error('❌ Error uploading video message:', error);
  throw error;  // Error propagates but message status not updated
}
```

#### **Problem 2: No Optimistic UI for Media**

**Location:** `useMediaHandlers.ts`, `chat/[jobId].tsx`

**Issue:**
- Text messages get optimistic UI updates (`status: 'sending'`)
- Media messages don't show "uploading..." state before completion
- User sees nothing until upload succeeds or fails completely

**Evidence:**
- No message added to UI until upload completes
- No intermediate "uploading" state shown

#### **Problem 3: getMediaType() Fallback May Be Incorrect**

**Location:** `ChatInput.tsx:40-47`

**Issue:**
```typescript
const getMediaType = () => {
  if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
    return ImagePicker.MediaType.Images;
  }
  return 'images';  // Fallback returns string, but API expects enum
};
```

**Problem:**
- If `MediaType` doesn't exist in SDK 54, returns `'images'` (string)
- But `launchCameraAsync({ mediaTypes: ['images'] })` may not work correctly
- Should use `ImagePicker.MediaTypeOptions.Images` enum value

#### **Problem 4: Video Camera Missing**

**Location:** No file exists

**Issue:**
- No camera recording flow for videos
- Only gallery picking exists
- Users expect to record videos directly in-app

---

## 3. PERMISSIONS & EXPO CONFIG CHECK

### 3.1 app.config.js Analysis

**File:** `app.config.js`

**✅ iOS Permissions (Correct):**
```javascript
infoPlist: {
  NSCameraUsageDescription: "GUILD needs camera access...", ✅
  NSPhotoLibraryUsageDescription: "GUILD needs photo library access...", ✅
  NSMicrophoneUsageDescription: "GUILD needs microphone access...", ✅
}
```

**✅ Android Permissions (Correct):**
```javascript
permissions: [
  "CAMERA", ✅
  "READ_EXTERNAL_STORAGE", ✅
  "WRITE_EXTERNAL_STORAGE", ✅
]
```

**✅ Expo Plugins (Correct):**
```javascript
plugins: [
  ["expo-image-picker", { photosPermission: "...", cameraPermission: "..." }], ✅
  ["expo-camera", { cameraPermission: "...", microphonePermission: "..." }], ✅
  ["expo-document-picker", { iCloudContainerEnvironment: "Production" }], ✅
]
```

**⚠️ Missing:** `expo-av` plugin not explicitly listed (but may work without)

### 3.2 Permission Request Patterns

**✅ Correct Patterns Found:**
- `ChatInput.tsx:175` - `requestCameraPermission()` uses `ImagePicker.requestCameraPermissionsAsync()`
- `ChatInput.tsx:189` - `requestMediaLibraryPermission()` uses `ImagePicker.requestMediaLibraryPermissionsAsync()`
- `AdvancedVoiceRecorder.tsx:94` - Uses `Audio.requestPermissionsAsync()`

**All permission requests follow Expo SDK 54 patterns correctly.**

---

## 4. API ALIGNMENT WITH EXPO SDK 54

### 4.1 Image Picker

**Current Code:**
```typescript
ImagePicker.launchCameraAsync({
  mediaTypes: [getMediaType()],  // ⚠️ Potentially incorrect
  allowsEditing: true,
  quality: 0.8,
  base64: false,
});
```

**SDK 54 Recommended:**
```typescript
ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,  // Use enum directly
  allowsEditing: true,
  quality: 0.8,
  allowsMultipleSelection: false,  // Explicit
});
```

**Status:** ⚠️ Needs fix

### 4.2 Video Picker

**Current Code:**
```typescript
ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Videos,  // ✅ Correct
  allowsEditing: true,
  quality: 0.8,
  videoMaxDuration: 60,
});
```

**Status:** ✅ Correct

### 4.3 Audio Recording

**Current Code:**
```typescript
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY  // ✅ Correct
);
```

**Status:** ✅ Correct

### 4.4 Document Picker

**Current Code:**
```typescript
DocumentPicker.getDocumentAsync({
  type: '*/*',
  copyToCacheDirectory: true,  // ✅ Correct
});
```

**Status:** ✅ Correct

---

## 5. FIREBASE UPLOAD PIPELINE ANALYSIS

### 5.1 Upload Functions (chatFileService.ts)

**✅ Correct Patterns:**
- Uses Firebase Storage v9+ modular API (`ref`, `uploadBytes`, `getDownloadURL`)
- Proper content-type setting
- Image compression integrated
- Video thumbnail generation integrated

**⚠️ Missing:**
- Progress callbacks not exposed to UI
- No retry logic on failure
- Errors thrown but not captured in message state

### 5.2 Storage Rules Check

**File:** `storage.rules`

**✅ Correct Rules Found:**
- Voice: 10MB limit ✅
- Video: 50MB limit ✅
- Images: 5MB limit ✅
- Files: Size validation ✅

**All storage rules correctly configured.**

---

## 6. SUMMARY OF ISSUES

### 🔴 Critical Issues

1. **No uploadStatus Tracking**
   - Media messages don't show "uploading..." or "failed" states
   - Users see no feedback during upload

2. **No Video Camera Recording**
   - Users can only pick videos from gallery
   - Missing in-app video recording feature

3. **getMediaType() Fallback May Break**
   - Returns string when enum expected
   - May cause ImagePicker to fail silently

### 🟠 High Priority Issues

4. **No Optimistic UI for Media**
   - Messages appear only after upload completes
   - Poor UX compared to text messages

5. **Error Handling Not User-Friendly**
   - Errors logged but not surfaced clearly
   - No retry mechanism exposed to UI

### 🟡 Medium Priority Issues

6. **No Upload Progress Indication**
   - Users don't know upload progress
   - No progress bars for large files

7. **Missing Camera Recording UI**
   - Video recording should have dedicated UI
   - Current approach (ImagePicker only) is limited

---

## 7. FILES REQUIRING CHANGES

1. `src/components/ChatInput.tsx` - Fix getMediaType(), add video recording
2. `src/app/(modals)/chat/_hooks/useMediaHandlers.ts` - Add uploadStatus tracking
3. `src/services/chatFileService.ts` - Add progress callbacks, better error handling
4. `src/components/ChatMessage.tsx` - Already has uploadStatus UI, needs data
5. `src/app/(modals)/chat/[jobId].tsx` - Wire uploadStatus state updates
6. **NEW:** `src/components/CameraModal.tsx` - New component for camera/video recording
7. **NEW:** `src/components/VideoRecorder.tsx` - New component for video recording UI

---

**NEXT STEPS:**
1. Fix getMediaType() and ImagePicker usage
2. Add uploadStatus tracking throughout media pipeline
3. Implement video camera recording
4. Add optimistic UI updates
5. Add progress indicators
6. Improve error handling and retry UI







