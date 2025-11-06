/**
 * REAL-TIME SYNC ENGINE - INTEGRATION TEST GUIDE
 * 
 * This guide shows you how to integrate and test the Real-Time Sync Engine
 * in your GUILD application.
 */

// ============================================================================
// STEP 1: BASIC INTEGRATION TEST
// ============================================================================

import RealTimeSyncEngine, { SyncConfig, SyncState } from './src/services/RealTimeSyncEngine';

// Create a test configuration
const testConfig: SyncConfig = {
  websocket: {
    url: 'ws://localhost:8080', // Your WebSocket server URL
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    messageTimeout: 10000
  },
  sync: {
    batchSize: 10,
    syncInterval: 1000,
    conflictResolution: 'operational-transform',
    offlineMode: true,
    compressionEnabled: true
  },
  performance: {
    monitoringEnabled: true,
    metricsInterval: 1000,
    alertThresholds: {
      latency: 100,
      errorRate: 5,
      memoryUsage: 80
    }
  },
  security: {
    encryptionEnabled: true,
    authenticationRequired: true,
    messageSigning: true,
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 1000
    }
  }
};

// Create a test sync state
const testSyncState: SyncState = {
  userId: 'test-user-123',
  deviceId: 'test-device-456',
  documentId: 'test-document-789',
  version: 1,
  vectorClock: new Map([['test-device-456', 0]]),
  pendingOperations: [],
  appliedOperations: new Set(),
  lastSyncTimestamp: Date.now(),
  connectionState: 'disconnected',
  conflictResolution: 'operational-transform'
};

// ============================================================================
// STEP 2: BASIC USAGE EXAMPLE
// ============================================================================

async function testBasicSync() {
  console.log('🚀 Starting Basic Sync Test...');
  
  // Initialize the sync engine
  const syncEngine = new RealTimeSyncEngine(testConfig, testSyncState);
  
  try {
    // Initialize the engine
    await syncEngine.initialize();
    console.log('✅ Sync Engine initialized');
    
    // Create a test operation
    const testOperation = {
      id: 'test-op-1',
      type: 'insert' as const,
      position: 0,
      content: 'Hello, Real-Time Sync!',
      timestamp: Date.now(),
      userId: 'test-user-123',
      deviceId: 'test-device-456',
      vectorClock: new Map([['test-device-456', 1]]),
      dependencies: []
    };
    
    // Apply the operation
    await syncEngine.applyOperation(testOperation);
    console.log('✅ Operation applied successfully');
    
    // Get sync state
    const state = syncEngine.getSyncState();
    console.log('📊 Sync State:', state);
    
    // Get performance stats
    const stats = syncEngine.getStats();
    console.log('📈 Performance Stats:', stats);
    
    // Disconnect
    await syncEngine.disconnect();
    console.log('🔌 Sync Engine disconnected');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// ============================================================================
// STEP 2: CHAT INTEGRATION EXAMPLE
// ============================================================================

class ChatSyncIntegration {
  private syncEngine: RealTimeSyncEngine;
  private messages: any[] = [];
  
  constructor() {
    this.syncEngine = new RealTimeSyncEngine(testConfig, testSyncState);
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // Listen for sync events
    this.syncEngine.on('operationApplied', (data) => {
      console.log('📨 Operation applied:', data);
    });
    
    this.syncEngine.on('conflict', (conflict) => {
      console.log('⚠️ Conflict detected:', conflict);
    });
    
    this.syncEngine.on('syncComplete', (data) => {
      console.log('🔄 Sync completed:', data);
    });
    
    this.syncEngine.on('error', (error) => {
      console.error('❌ Sync error:', error);
    });
  }
  
  async initialize() {
    await this.syncEngine.initialize();
    console.log('💬 Chat Sync initialized');
  }
  
  async sendMessage(text: string, userId: string) {
    const messageOperation = {
      id: `msg-${Date.now()}`,
      type: 'insert' as const,
      position: this.messages.length,
      content: {
        text,
        userId,
        timestamp: Date.now(),
        type: 'message'
      },
      timestamp: Date.now(),
      userId,
      deviceId: testSyncState.deviceId,
      vectorClock: new Map([[testSyncState.deviceId, 1]]),
      dependencies: []
    };
    
    await this.syncEngine.applyOperation(messageOperation);
    this.messages.push(messageOperation.content);
    
    console.log(`💬 Message sent: "${text}"`);
  }
  
  async sync() {
    await this.syncEngine.sync();
    console.log('🔄 Chat synced');
  }
  
  getMessages() {
    return this.messages;
  }
  
  async disconnect() {
    await this.syncEngine.disconnect();
    console.log('🔌 Chat Sync disconnected');
  }
}

// ============================================================================
// STEP 3: COLLABORATIVE EDITING EXAMPLE
// ============================================================================

class CollaborativeEditor {
  private syncEngine: RealTimeSyncEngine;
  private document: string = '';
  
  constructor() {
    this.syncEngine = new RealTimeSyncEngine(testConfig, testSyncState);
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.syncEngine.on('operationApplied', (data) => {
      this.applyOperationToDocument(data.operation);
      console.log('📝 Document updated:', this.document);
    });
  }
  
  private applyOperationToDocument(operation: any) {
    switch (operation.type) {
      case 'insert':
        this.document = this.document.slice(0, operation.position) + 
                      operation.content + 
                      this.document.slice(operation.position);
        break;
      case 'delete':
        this.document = this.document.slice(0, operation.position) + 
                      this.document.slice(operation.position + (operation.length || 1));
        break;
    }
  }
  
  async initialize() {
    await this.syncEngine.initialize();
    console.log('📝 Collaborative Editor initialized');
  }
  
  async insertText(text: string, position: number) {
    const insertOperation = {
      id: `insert-${Date.now()}`,
      type: 'insert' as const,
      position,
      content: text,
      timestamp: Date.now(),
      userId: testSyncState.userId,
      deviceId: testSyncState.deviceId,
      vectorClock: new Map([[testSyncState.deviceId, 1]]),
      dependencies: []
    };
    
    await this.syncEngine.applyOperation(insertOperation);
  }
  
  async deleteText(position: number, length: number) {
    const deleteOperation = {
      id: `delete-${Date.now()}`,
      type: 'delete' as const,
      position,
      length,
      timestamp: Date.now(),
      userId: testSyncState.userId,
      deviceId: testSyncState.deviceId,
      vectorClock: new Map([[testSyncState.deviceId, 1]]),
      dependencies: []
    };
    
    await this.syncEngine.applyOperation(deleteOperation);
  }
  
  getDocument() {
    return this.document;
  }
  
  async disconnect() {
    await this.syncEngine.disconnect();
    console.log('🔌 Collaborative Editor disconnected');
  }
}

// ============================================================================
// STEP 4: TEST RUNNER
// ============================================================================

async function runIntegrationTests() {
  console.log('🧪 Starting Integration Tests...');
  console.log('================================');
  
  try {
    // Test 1: Basic Sync
    console.log('\n📋 Test 1: Basic Sync');
    await testBasicSync();
    
    // Test 2: Chat Integration
    console.log('\n📋 Test 2: Chat Integration');
    const chatSync = new ChatSyncIntegration();
    await chatSync.initialize();
    await chatSync.sendMessage('Hello from user 1!', 'user1');
    await chatSync.sendMessage('Hello from user 2!', 'user2');
    await chatSync.sync();
    console.log('💬 Messages:', chatSync.getMessages());
    await chatSync.disconnect();
    
    // Test 3: Collaborative Editing
    console.log('\n📋 Test 3: Collaborative Editing');
    const editor = new CollaborativeEditor();
    await editor.initialize();
    await editor.insertText('Hello, ', 0);
    await editor.insertText('World!', 7);
    await editor.insertText(' Collaborative editing is working!', 13);
    console.log('📝 Final document:', editor.getDocument());
    await editor.disconnect();
    
    console.log('\n🎉 All integration tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  testBasicSync,
  ChatSyncIntegration,
  CollaborativeEditor,
  runIntegrationTests,
  testConfig,
  testSyncState
};

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests();
}













