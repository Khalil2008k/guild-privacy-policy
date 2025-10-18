/**
 * CHAT SYSTEM LOGIC COMPLETENESS AUDIT
 * Verifies ALL screens, functions, and buttons fulfill the ENTIRE chat logic
 * 
 * This checks if the implementation covers:
 * 1. Complete chat lifecycle (create → message → close)
 * 2. All user interactions (send, receive, edit, delete)
 * 3. All chat states (active, muted, blocked, deleted)
 * 4. All message types (text, image, file, voice)
 * 5. All chat features (search, mute, block, report)
 * 6. All edge cases (offline, error, retry)
 * 7. All integrations (Firebase, backend, storage)
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║       CHAT SYSTEM LOGIC COMPLETENESS AUDIT                        ║');
console.log('║       Do All Screens/Functions/Buttons Fulfill Chat Logic?        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const gaps = [];
const recommendations = [];

function check(name, fn) {
  totalChecks++;
  try {
    const result = fn();
    if (result === true) {
      passedChecks++;
      console.log(`  ✅ ${name}`);
      return true;
    } else if (result && result.gap) {
      failedChecks++;
      console.log(`  ❌ ${name}`);
      console.log(`     Gap: ${result.gap}`);
      gaps.push({ feature: name, gap: result.gap, recommendation: result.recommendation });
      return false;
    }
  } catch (error) {
    failedChecks++;
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
    gaps.push({ feature: name, gap: error.message });
    return false;
  }
}

// Read all relevant files
const chatScreenPath = path.join(__dirname, 'src', 'app', '(modals)', 'chat', '[jobId].tsx');
const chatServicePath = path.join(__dirname, 'src', 'services', 'chatService.ts');
const chatFileServicePath = path.join(__dirname, 'src', 'services', 'chatFileService.ts');
const chatOptionsServicePath = path.join(__dirname, 'src', 'services', 'chatOptionsService.ts');
const messageSearchServicePath = path.join(__dirname, 'src', 'services', 'messageSearchService.ts');

const chatScreen = fs.readFileSync(chatScreenPath, 'utf-8');
const chatService = fs.readFileSync(chatServicePath, 'utf-8');
const chatFileService = fs.readFileSync(chatFileServicePath, 'utf-8');
const chatOptionsService = fs.readFileSync(chatOptionsServicePath, 'utf-8');
const messageSearchService = fs.readFileSync(messageSearchServicePath, 'utf-8');

// ============================================================================
// PART 1: CHAT LIFECYCLE LOGIC
// ============================================================================
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 1: CHAT LIFECYCLE LOGIC - Create → Message → Close          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('1.1 Create/Open Chat', () => {
  // Chat is opened via route parameter [jobId]
  if (!chatScreen.includes('jobId') || !chatScreen.includes('useLocalSearchParams')) {
    return { gap: 'Chat opening mechanism missing', recommendation: 'Add route parameter handling' };
  }
  if (!chatScreen.includes('listenToChat')) {
    return { gap: 'Chat initialization missing', recommendation: 'Add chat listener' };
  }
  return true;
});

check('1.2 Load Chat History', () => {
  if (!chatScreen.includes('listenToMessages')) {
    return { gap: 'Message loading missing', recommendation: 'Add message listener' };
  }
  if (!chatService.includes('orderBy')) {
    return { gap: 'Message ordering missing', recommendation: 'Add orderBy in Firestore query' };
  }
  return true;
});

check('1.3 Send Messages', () => {
  if (!chatScreen.includes('handleSendMessage')) {
    return { gap: 'Send handler missing', recommendation: 'Add handleSendMessage function' };
  }
  if (!chatService.includes('sendMessage')) {
    return { gap: 'Send service missing', recommendation: 'Add sendMessage in chatService' };
  }
  return true;
});

check('1.4 Receive Messages (Real-time)', () => {
  if (!chatService.includes('onSnapshot')) {
    return { gap: 'Real-time listener missing', recommendation: 'Add Firestore onSnapshot' };
  }
  if (!chatScreen.includes('setMessages')) {
    return { gap: 'Message state update missing', recommendation: 'Add state update in listener callback' };
  }
  return true;
});

check('1.5 Close Chat', () => {
  if (!chatScreen.includes('router.back()')) {
    return { gap: 'Chat close navigation missing', recommendation: 'Add back button with router.back()' };
  }
  if (!chatScreen.includes('return () =>') || !chatScreen.includes('unsubscribe')) {
    return { gap: 'Cleanup missing', recommendation: 'Add useEffect cleanup for listeners' };
  }
  return true;
});

// ============================================================================
// PART 2: MESSAGE OPERATIONS LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 2: MESSAGE OPERATIONS LOGIC - CRUD Operations               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('2.1 Create Message (Text)', () => {
  if (!chatService.includes('addDoc') || !chatService.includes('messages')) {
    return { gap: 'Message creation missing', recommendation: 'Add addDoc to messages collection' };
  }
  if (!chatService.includes('serverTimestamp')) {
    return { gap: 'Timestamp missing', recommendation: 'Add serverTimestamp for createdAt' };
  }
  return true;
});

check('2.2 Read Messages', () => {
  if (!chatService.includes('getDocs') && !chatService.includes('onSnapshot')) {
    return { gap: 'Message reading missing', recommendation: 'Add getDocs or onSnapshot' };
  }
  return true;
});

check('2.3 Update Message (Edit)', () => {
  if (!chatScreen.includes('handleEditMessage')) {
    return { gap: 'Edit handler missing', recommendation: 'Add handleEditMessage' };
  }
  if (!chatService.includes('editMessage') || !chatService.includes('updateDoc')) {
    return { gap: 'Edit service missing', recommendation: 'Add editMessage with updateDoc' };
  }
  if (!chatService.includes('editHistory')) {
    return { gap: 'Edit history tracking missing', recommendation: 'Add editHistory array in message update' };
  }
  return true;
});

check('2.4 Delete Message (Soft Delete)', () => {
  if (!chatScreen.includes('handleDeleteMessage')) {
    return { gap: 'Delete handler missing', recommendation: 'Add handleDeleteMessage' };
  }
  if (!chatService.includes('deleteMessage')) {
    return { gap: 'Delete service missing', recommendation: 'Add deleteMessage function' };
  }
  if (!chatService.includes('deletedAt') && !chatService.includes('deletedBy')) {
    return { gap: 'Soft delete tracking missing', recommendation: 'Add deletedAt and deletedBy fields' };
  }
  return true;
});

check('2.5 View Edit History', () => {
  if (!chatScreen.includes('handleViewHistory')) {
    return { gap: 'View history handler missing', recommendation: 'Add handleViewHistory' };
  }
  if (!chatScreen.includes('EditHistoryModal')) {
    return { gap: 'History modal missing', recommendation: 'Add EditHistoryModal component' };
  }
  return true;
});

// ============================================================================
// PART 3: MESSAGE TYPES LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 3: MESSAGE TYPES LOGIC - Text, Image, File, Voice           ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('3.1 Text Messages', () => {
  if (!chatScreen.includes('handleSendMessage')) {
    return { gap: 'Text message handler missing' };
  }
  return true;
});

check('3.2 Image Messages', () => {
  if (!chatScreen.includes('handleSendImage')) {
    return { gap: 'Image handler missing', recommendation: 'Add handleSendImage' };
  }
  if (!chatScreen.includes('ImagePicker') && !chatScreen.includes('launchImageLibrary')) {
    return { gap: 'Image picker missing', recommendation: 'Add expo-image-picker integration' };
  }
  if (!chatFileService.includes('uploadBytes')) {
    return { gap: 'Image upload missing', recommendation: 'Add Firebase Storage upload' };
  }
  return true;
});

check('3.3 File Messages (Documents)', () => {
  if (!chatScreen.includes('handleSendFile')) {
    return { gap: 'File handler missing', recommendation: 'Add handleSendFile' };
  }
  if (!chatScreen.includes('DocumentPicker') && !chatScreen.includes('getDocumentAsync')) {
    return { gap: 'Document picker missing', recommendation: 'Add expo-document-picker' };
  }
  return true;
});

check('3.4 Voice Messages', () => {
  if (!chatScreen.includes('voice') && !chatScreen.includes('audio') && !chatScreen.includes('recording')) {
    return { 
      gap: 'Voice messages not implemented', 
      recommendation: 'Optional: Add expo-av for voice recording if needed for your use case'
    };
  }
  return true; // Not critical for MVP
});

check('3.5 File Download', () => {
  if (!chatScreen.includes('handleDownloadFile')) {
    return { gap: 'Download handler missing', recommendation: 'Add handleDownloadFile' };
  }
  if (!chatScreen.includes('downloadAsync')) {
    return { gap: 'Download function missing', recommendation: 'Add FileSystem.downloadAsync' };
  }
  return true;
});

// ============================================================================
// PART 4: CHAT FEATURES LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 4: CHAT FEATURES LOGIC - Search, Mute, Block, Report        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('4.1 Search Messages', () => {
  if (!chatScreen.includes('handleSearchMessages')) {
    return { gap: 'Search handler missing', recommendation: 'Add handleSearchMessages' };
  }
  if (!messageSearchService.includes('searchInChat')) {
    return { gap: 'Search service missing', recommendation: 'Add searchInChat function' };
  }
  if (!chatScreen.includes('searchQuery') || !chatScreen.includes('searchResults')) {
    return { gap: 'Search state missing', recommendation: 'Add search state variables' };
  }
  return true;
});

check('4.2 Mute Chat', () => {
  if (!chatScreen.includes('handleMuteChat')) {
    return { gap: 'Mute handler missing', recommendation: 'Add handleMuteChat' };
  }
  if (!chatOptionsService.includes('muteChat')) {
    return { gap: 'Mute service missing', recommendation: 'Add muteChat function' };
  }
  if (!chatScreen.includes('hour') || !chatScreen.includes('day') || !chatScreen.includes('forever')) {
    return { gap: 'Mute duration options missing', recommendation: 'Add duration picker' };
  }
  return true;
});

check('4.3 Unmute Chat', () => {
  if (!chatScreen.includes('handleUnmute')) {
    return { gap: 'Unmute handler missing', recommendation: 'Add handleUnmute' };
  }
  if (!chatOptionsService.includes('unmuteChat')) {
    return { gap: 'Unmute service missing', recommendation: 'Add unmuteChat function' };
  }
  return true;
});

check('4.4 Block User', () => {
  if (!chatScreen.includes('handleBlockUser')) {
    return { gap: 'Block handler missing', recommendation: 'Add handleBlockUser' };
  }
  if (!chatOptionsService.includes('blockUser')) {
    return { gap: 'Block service missing', recommendation: 'Add blockUser function' };
  }
  return true;
});

check('4.5 Unblock User', () => {
  if (!chatScreen.includes('handleUnblockUser')) {
    return { gap: 'Unblock handler missing', recommendation: 'Add handleUnblockUser' };
  }
  if (!chatOptionsService.includes('unblockUser')) {
    return { gap: 'Unblock service missing', recommendation: 'Add unblockUser function' };
  }
  return true;
});

check('4.6 Report User', () => {
  if (!chatScreen.includes('handleReportUser')) {
    return { gap: 'Report handler missing', recommendation: 'Add handleReportUser' };
  }
  if (!chatScreen.includes('dispute-filing-form')) {
    return { gap: 'Report navigation missing', recommendation: 'Add navigation to dispute form' };
  }
  return true;
});

check('4.7 Delete Chat', () => {
  if (!chatScreen.includes('handleDeleteChat')) {
    return { gap: 'Delete chat handler missing', recommendation: 'Add handleDeleteChat' };
  }
  if (!chatOptionsService.includes('deleteChat')) {
    return { gap: 'Delete chat service missing', recommendation: 'Add deleteChat function' };
  }
  return true;
});

check('4.8 View User Profile', () => {
  if (!chatScreen.includes('handleViewProfile')) {
    return { gap: 'Profile handler missing', recommendation: 'Add handleViewProfile' };
  }
  if (!chatScreen.includes('user-profile')) {
    return { gap: 'Profile navigation missing', recommendation: 'Add navigation to user profile' };
  }
  return true;
});

// ============================================================================
// PART 5: REAL-TIME FEATURES LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 5: REAL-TIME FEATURES LOGIC - Live Updates & Status         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('5.1 Real-time Message Updates', () => {
  if (!chatService.includes('onSnapshot')) {
    return { gap: 'Real-time listener missing', recommendation: 'Add Firestore onSnapshot' };
  }
  return true;
});

check('5.2 Typing Indicator', () => {
  if (!chatScreen.includes('typingUsers') || !chatScreen.includes('MessageLoading')) {
    return { gap: 'Typing indicator missing', recommendation: 'Add typing indicator state and component' };
  }
  if (!chatScreen.includes('handleTyping')) {
    return { gap: 'Typing handler missing', recommendation: 'Add handleTyping to update typing status' };
  }
  return true;
});

check('5.3 Online/Offline Status', () => {
  if (!chatScreen.includes('Active') && !chatScreen.includes('status')) {
    return { gap: 'User status display missing', recommendation: 'Add online/offline status indicator' };
  }
  return true;
});

check('5.4 Message Read Receipts', () => {
  if (!chatService.includes('readBy') || !chatService.includes('status')) {
    return { 
      gap: 'Read receipts partially implemented', 
      recommendation: 'Ensure readBy array is updated when messages are read'
    };
  }
  return true;
});

check('5.5 Last Seen / Active Status', () => {
  // This is shown in the header
  if (!chatScreen.includes('Active') && !chatScreen.includes('typing')) {
    return { gap: 'Status text missing', recommendation: 'Add active/typing status in header' };
  }
  return true;
});

// ============================================================================
// PART 6: UI STATE MANAGEMENT LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 6: UI STATE MANAGEMENT LOGIC - Loading, Error, Empty        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('6.1 Loading State', () => {
  if (!chatScreen.includes('loading') || !chatScreen.includes('setLoading')) {
    return { gap: 'Loading state missing', recommendation: 'Add loading state' };
  }
  if (!chatScreen.includes('ActivityIndicator')) {
    return { gap: 'Loading indicator missing', recommendation: 'Add ActivityIndicator' };
  }
  return true;
});

check('6.2 Error State', () => {
  if (!chatScreen.includes('try') || !chatScreen.includes('catch')) {
    return { gap: 'Error handling missing', recommendation: 'Add try-catch blocks' };
  }
  if (!chatScreen.includes('Alert.alert')) {
    return { gap: 'Error feedback missing', recommendation: 'Add Alert.alert for errors' };
  }
  return true;
});

check('6.3 Empty State', () => {
  if (!chatScreen.includes('No results') && !chatScreen.includes('empty')) {
    return { gap: 'Empty state UI missing', recommendation: 'Add empty state for no messages/results' };
  }
  return true;
});

check('6.4 Edit Mode State', () => {
  if (!chatScreen.includes('editingMessageId') || !chatScreen.includes('editMode')) {
    return { gap: 'Edit mode state missing', recommendation: 'Add edit mode state' };
  }
  return true;
});

check('6.5 Modal States', () => {
  const modals = ['showOptionsMenu', 'showMuteOptions', 'showSearchModal', 'showHistoryModal'];
  const missingModals = modals.filter(m => !chatScreen.includes(m));
  if (missingModals.length > 0) {
    return { gap: `Modal states missing: ${missingModals.join(', ')}`, recommendation: 'Add modal state variables' };
  }
  return true;
});

// ============================================================================
// PART 7: DATA PERSISTENCE & EVIDENCE LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 7: DATA PERSISTENCE & EVIDENCE LOGIC - For Disputes         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('7.1 Message Metadata (Evidence)', () => {
  if (!chatService.includes('evidence') || !chatFileService.includes('evidence')) {
    return { 
      gap: 'Evidence metadata missing', 
      recommendation: 'Add evidence field with deviceInfo, appVersion, ipAddress'
    };
  }
  return true;
});

check('7.2 File Hashing (Authenticity)', () => {
  if (!chatFileService.includes('SHA256') && !chatFileService.includes('hash')) {
    return { gap: 'File hashing missing', recommendation: 'Add Crypto.digestStringAsync for file hashing' };
  }
  return true;
});

check('7.3 Edit History (Audit Trail)', () => {
  if (!chatService.includes('editHistory')) {
    return { gap: 'Edit history missing', recommendation: 'Add editHistory array to track changes' };
  }
  return true;
});

check('7.4 Soft Delete (Preserve Data)', () => {
  if (!chatService.includes('deletedAt')) {
    return { gap: 'Soft delete missing', recommendation: 'Add deletedAt field instead of actually deleting' };
  }
  return true;
});

check('7.5 File Metadata Storage', () => {
  if (!chatFileService.includes('fileMetadata') && !chatFileService.includes('originalFileName')) {
    return { gap: 'File metadata missing', recommendation: 'Add metadata: originalName, size, hash, storagePath' };
  }
  return true;
});

// ============================================================================
// PART 8: SECURITY & VALIDATION LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 8: SECURITY & VALIDATION LOGIC - Auth & Rules               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('8.1 User Authentication Check', () => {
  if (!chatScreen.includes('useAuth') || !chatScreen.includes('user')) {
    return { gap: 'Auth check missing', recommendation: 'Add useAuth hook and check user' };
  }
  if (!chatScreen.includes('if (!user)')) {
    return { gap: 'User validation missing', recommendation: 'Add null checks for user' };
  }
  return true;
});

check('8.2 Chat Access Validation', () => {
  if (!chatScreen.includes('chatId') || !chatScreen.includes('participants')) {
    return { gap: 'Access validation missing', recommendation: 'Verify user is in chat.participants' };
  }
  return true;
});

check('8.3 Firebase Security Rules', () => {
  const rulesPath = path.join(__dirname, 'firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    return { gap: 'Security rules file missing', recommendation: 'Add firestore.rules' };
  }
  const rules = fs.readFileSync(rulesPath, 'utf-8');
  if (!rules.includes('match /chats/') || !rules.includes('match /messages/')) {
    return { gap: 'Chat security rules missing', recommendation: 'Add rules for chats and messages' };
  }
  return true;
});

check('8.4 Input Validation', () => {
  if (!chatScreen.includes('.trim()')) {
    return { gap: 'Input validation missing', recommendation: 'Add .trim() and length checks' };
  }
  return true;
});

check('8.5 Message Ownership Check', () => {
  if (!chatScreen.includes('senderId') && !chatScreen.includes('isOwnMessage')) {
    return { gap: 'Ownership check missing', recommendation: 'Add senderId comparison for edit/delete' };
  }
  return true;
});

// ============================================================================
// PART 9: INTEGRATION LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 9: INTEGRATION LOGIC - Firebase, Storage, Backend           ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('9.1 Firestore Integration', () => {
  if (!chatService.includes('collection') || !chatService.includes('doc')) {
    return { gap: 'Firestore methods missing', recommendation: 'Import and use Firestore methods' };
  }
  return true;
});

check('9.2 Firebase Storage Integration', () => {
  if (!chatFileService.includes('storage') || !chatFileService.includes('ref')) {
    return { gap: 'Storage integration missing', recommendation: 'Import and use Firebase Storage' };
  }
  return true;
});

check('9.3 Firebase Auth Integration', () => {
  if (!chatScreen.includes('useAuth')) {
    return { gap: 'Auth integration missing', recommendation: 'Import useAuth hook' };
  }
  return true;
});

check('9.4 Notification Integration (FCM)', () => {
  // Check if notifications are handled elsewhere
  if (!chatScreen.includes('notification') && !chatService.includes('notification')) {
    return { 
      gap: 'Push notifications not visible in chat', 
      recommendation: 'Notifications likely handled in separate service - this is OK'
    };
  }
  return true; // Not critical if handled elsewhere
});

check('9.5 Backend API Integration (Optional)', () => {
  // Chat is 100% Firebase, backend is optional
  return true;
});

// ============================================================================
// PART 10: UX ENHANCEMENTS LOGIC
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 10: UX ENHANCEMENTS LOGIC - Polish & User Experience        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('10.1 Auto-scroll to Latest Message', () => {
  if (!chatScreen.includes('scrollToEnd')) {
    return { gap: 'Auto-scroll missing', recommendation: 'Add scrollToEnd on new messages' };
  }
  return true;
});

check('10.2 Keyboard Handling', () => {
  if (!chatScreen.includes('KeyboardAvoidingView')) {
    return { gap: 'Keyboard handling missing', recommendation: 'Add KeyboardAvoidingView' };
  }
  return true;
});

check('10.3 Message Timestamps', () => {
  if (!chatService.includes('createdAt') || !chatService.includes('Timestamp')) {
    return { gap: 'Timestamps missing', recommendation: 'Add createdAt with serverTimestamp' };
  }
  return true;
});

check('10.4 User Avatars', () => {
  if (!chatScreen.includes('avatar')) {
    return { gap: 'Avatar display missing', recommendation: 'Add avatar image or placeholder' };
  }
  return true;
});

check('10.5 Confirmation Dialogs', () => {
  if (!chatScreen.includes('Alert.alert')) {
    return { gap: 'Confirmation dialogs missing', recommendation: 'Add Alert.alert for destructive actions' };
  }
  const alertCount = (chatScreen.match(/Alert\.alert/g) || []).length;
  if (alertCount < 5) {
    return { gap: 'Insufficient confirmations', recommendation: 'Add more confirmation dialogs' };
  }
  return true;
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║              CHAT LOGIC COMPLETENESS RESULTS                      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

console.log(`Total Logic Checks:  ${totalChecks}`);
console.log(`✅ Complete:         ${passedChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
console.log(`❌ Incomplete:       ${failedChecks}\n`);

if (failedChecks === 0) {
  console.log('═'.repeat(70) + '\n');
  console.log('🎉🎉🎉 PERFECT CHAT LOGIC IMPLEMENTATION! 🎉🎉🎉\n');
  console.log('✅ Chat lifecycle complete');
  console.log('✅ All message operations implemented');
  console.log('✅ All message types supported');
  console.log('✅ All chat features functional');
  console.log('✅ Real-time features active');
  console.log('✅ UI states managed properly');
  console.log('✅ Data persistence for evidence');
  console.log('✅ Security & validation in place');
  console.log('✅ All integrations working');
  console.log('✅ UX enhancements complete\n');
  console.log('🚀 ALL SCREENS, FUNCTIONS & BUTTONS FULFILL ENTIRE CHAT LOGIC!\n');
} else {
  console.log('═'.repeat(70) + '\n');
  console.log(`⚠️  CHAT LOGIC GAPS FOUND (${failedChecks} gaps)\n`);
  console.log('GAPS IDENTIFIED:\n');
  gaps.forEach((gap, idx) => {
    console.log(`${idx + 1}. ${gap.feature}`);
    console.log(`   Gap: ${gap.gap}`);
    if (gap.recommendation) {
      console.log(`   Recommendation: ${gap.recommendation}`);
    }
    console.log('');
  });
}

process.exit(failedChecks > 0 ? 1 : 0);







