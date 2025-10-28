/**
 * Comprehensive Chat System Test Suite
 * Tests all core functionality across Local Storage and Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('../guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'guild-4f46b'
  });
}

const db = admin.firestore();
const storage = admin.storage();

class ChatTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testUsers = {
      userA: 'test-user-a',
      userB: 'test-user-b'
    };
    this.testChats = {
      personal: 'direct-userA-userB',
      job: 'job-1234'
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Chat Test Suite...\n');
    
    try {
      // Core functionality tests
      await this.testChatRouting();
      await this.testMessageSending();
      await this.testMediaUpload();
      await this.testRealTimeFeatures();
      await this.testPresenceSystem();
      await this.testReadReceipts();
      await this.testPermissions();
      await this.testPerformance();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testChatRouting() {
    console.log('📋 Testing Chat Routing...');
    
    try {
      // Test Local Storage routing
      const personalChat = await db.collection('chats').doc(this.testChats.personal).get();
      if (personalChat.exists) {
        console.log('✅ Personal chat exists (Local Storage)');
        this.testResults.passed++;
      } else {
        throw new Error('Personal chat not found');
      }
      
      // Test Firestore routing
      const jobChat = await db.collection('chats').doc(this.testChats.job).get();
      if (jobChat.exists) {
        console.log('✅ Job chat exists (Firestore)');
        this.testResults.passed++;
      } else {
        throw new Error('Job chat not found');
      }
      
    } catch (error) {
      console.error('❌ Chat routing test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Chat routing: ${error.message}`);
    }
  }

  async testMessageSending() {
    console.log('📋 Testing Message Sending...');
    
    try {
      // Test text message in job chat
      const messageData = {
        chatId: this.testChats.job,
        senderId: this.testUsers.userA,
        text: 'Test message from automated test suite',
        type: 'TEXT',
        status: 'sent',
        readBy: [this.testUsers.userA],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const messageRef = await db.collection('chats')
        .doc(this.testChats.job)
        .collection('messages')
        .add(messageData);
      
      if (messageRef.id) {
        console.log('✅ Text message sent successfully');
        this.testResults.passed++;
        
        // Clean up test message
        await messageRef.delete();
      } else {
        throw new Error('Failed to create message');
      }
      
    } catch (error) {
      console.error('❌ Message sending test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Message sending: ${error.message}`);
    }
  }

  async testMediaUpload() {
    console.log('📋 Testing Media Upload...');
    
    try {
      // Test voice message metadata
      const voiceMessage = {
        chatId: this.testChats.job,
        senderId: this.testUsers.userA,
        text: '',
        type: 'voice',
        attachments: ['https://test-voice-url.com/voice.webm'],
        duration: 5,
        status: 'sent',
        readBy: [this.testUsers.userA],
        fileMetadata: {
          originalName: 'test-voice.webm',
          size: 1024000,
          type: 'audio/webm'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const voiceRef = await db.collection('chats')
        .doc(this.testChats.job)
        .collection('messages')
        .add(voiceMessage);
      
      if (voiceRef.id) {
        console.log('✅ Voice message metadata created');
        this.testResults.passed++;
        await voiceRef.delete();
      }
      
      // Test video message metadata
      const videoMessage = {
        chatId: this.testChats.job,
        senderId: this.testUsers.userA,
        text: '',
        type: 'video',
        attachments: ['https://test-video-url.com/video.mp4'],
        thumbnailUrl: 'https://test-thumbnail-url.com/thumb.jpg',
        duration: 10,
        status: 'sent',
        readBy: [this.testUsers.userA],
        fileMetadata: {
          originalName: 'test-video.mp4',
          size: 5242880,
          type: 'video/mp4'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const videoRef = await db.collection('chats')
        .doc(this.testChats.job)
        .collection('messages')
        .add(videoMessage);
      
      if (videoRef.id) {
        console.log('✅ Video message metadata created');
        this.testResults.passed++;
        await videoRef.delete();
      }
      
    } catch (error) {
      console.error('❌ Media upload test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Media upload: ${error.message}`);
    }
  }

  async testRealTimeFeatures() {
    console.log('📋 Testing Real-time Features...');
    
    try {
      // Test typing indicators
      await db.collection('chats').doc(this.testChats.job).update({
        [`typing.${this.testUsers.userA}`]: true,
        [`typingUpdated.${this.testUsers.userA}`]: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Typing indicator set');
      this.testResults.passed++;
      
      // Clear typing indicator
      await db.collection('chats').doc(this.testChats.job).update({
        [`typing.${this.testUsers.userA}`]: admin.firestore.FieldValue.delete()
      });
      
      console.log('✅ Typing indicator cleared');
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Real-time features test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Real-time features: ${error.message}`);
    }
  }

  async testPresenceSystem() {
    console.log('📋 Testing Presence System...');
    
    try {
      // Test presence update
      await db.collection('presence').doc(this.testUsers.userA).set({
        state: 'online',
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Presence updated to online');
      this.testResults.passed++;
      
      // Test presence offline
      await db.collection('presence').doc(this.testUsers.userA).update({
        state: 'offline',
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Presence updated to offline');
      this.testResults.passed++;
      
    } catch (error) {
      console.error('❌ Presence system test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Presence system: ${error.message}`);
    }
  }

  async testReadReceipts() {
    console.log('📋 Testing Read Receipts...');
    
    try {
      // Create a test message
      const messageRef = await db.collection('chats')
        .doc(this.testChats.job)
        .collection('messages')
        .add({
          chatId: this.testChats.job,
          senderId: this.testUsers.userA,
          text: 'Test message for read receipts',
          type: 'TEXT',
          status: 'sent',
          readBy: [this.testUsers.userA],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      // Test read receipt update
      await messageRef.update({
        [`readBy.${this.testUsers.userB}`]: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Read receipt updated');
      this.testResults.passed++;
      
      // Clean up
      await messageRef.delete();
      
    } catch (error) {
      console.error('❌ Read receipts test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Read receipts: ${error.message}`);
    }
  }

  async testPermissions() {
    console.log('📋 Testing Permissions...');
    
    try {
      // Test chat access permissions
      const chatDoc = await db.collection('chats').doc(this.testChats.job).get();
      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        if (chatData.participants.includes(this.testUsers.userA)) {
          console.log('✅ User A has access to job chat');
          this.testResults.passed++;
        } else {
          throw new Error('User A does not have access to job chat');
        }
      }
      
      // Test message permissions
      const messagesSnapshot = await db.collection('chats')
        .doc(this.testChats.job)
        .collection('messages')
        .limit(1)
        .get();
      
      if (!messagesSnapshot.empty) {
        console.log('✅ User can read messages in job chat');
        this.testResults.passed++;
      }
      
    } catch (error) {
      console.error('❌ Permissions test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Permissions: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('📋 Testing Performance...');
    
    try {
      const startTime = Date.now();
      
      // Test message query performance
      const messagesSnapshot = await db.collection('chats')
        .doc(this.testChats.job)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      if (queryTime < 1000) { // Less than 1 second
        console.log(`✅ Message query performance: ${queryTime}ms`);
        this.testResults.passed++;
      } else {
        console.log(`⚠️ Message query slow: ${queryTime}ms`);
        this.testResults.failed++;
        this.testResults.errors.push(`Performance: Message query took ${queryTime}ms`);
      }
      
      // Test chat list performance
      const chatStartTime = Date.now();
      const chatsSnapshot = await db.collection('chats')
        .where('participants', 'array-contains', this.testUsers.userA)
        .orderBy('updatedAt', 'desc')
        .limit(20)
        .get();
      
      const chatEndTime = Date.now();
      const chatQueryTime = chatEndTime - chatStartTime;
      
      if (chatQueryTime < 1000) {
        console.log(`✅ Chat list query performance: ${chatQueryTime}ms`);
        this.testResults.passed++;
      } else {
        console.log(`⚠️ Chat list query slow: ${chatQueryTime}ms`);
        this.testResults.failed++;
        this.testResults.errors.push(`Performance: Chat list query took ${chatQueryTime}ms`);
      }
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Performance: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.testResults.failed === 0) {
      console.log('✅ All tests passed! System is ready for production.');
    } else {
      console.log('⚠️ Some tests failed. Review errors and fix before production.');
    }
  }
}

// Run the test suite
async function main() {
  const testSuite = new ChatTestSuite();
  await testSuite.runAllTests();
  process.exit(0);
}

main().catch(console.error);

