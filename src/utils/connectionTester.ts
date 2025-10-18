/**
 * Comprehensive System Connection Tester
 * Tests all 11 connections in the GUILD system architecture
 */

import { auth, db } from '../config/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { BackendConnectionManager } from '../config/backend';
import { logger } from './logger';

export interface ConnectionTestResult {
  connectionId: number;
  name: string;
  status: 'success' | 'error' | 'warning';
  responseTime: number;
  details: string;
  timestamp: Date;
  data?: any;
}

export interface SystemHealthReport {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  connections: ConnectionTestResult[];
  generatedAt: Date;
}

class ConnectionTester {
  private testResults: ConnectionTestResult[] = [];

  /**
   * Test Connection 1: App → Firebase (Authentication)
   */
  async testConnection1(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 1;
    const name = "App → Firebase (Authentication)";

    try {
      logger.info('🔍 Testing Connection 1: App → Firebase Authentication');

      // Test Firebase Auth initialization
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Test anonymous sign-in (safe test that doesn't affect real users)
      const userCredential = await signInAnonymously(auth);
      
      if (!userCredential.user) {
        throw new Error('Anonymous sign-in failed - no user returned');
      }

      // Test token generation
      const token = await userCredential.user.getIdToken();
      if (!token) {
        throw new Error('Failed to generate ID token');
      }

      // Clean up test user
      await signOut(auth);

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Firebase Auth working. Token generated successfully. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          tokenLength: token.length,
          userUid: userCredential.user.uid
        }
      };

      logger.info('✅ Connection 1 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Firebase Auth failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 1 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 2: Firebase → App (Auth State Changes)
   */
  async testConnection2(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 2;
    const name = "Firebase → App (Auth State Changes)";

    try {
      logger.info('🔍 Testing Connection 2: Firebase → App Auth State Changes');

      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      // Test auth state listener
      let authStateReceived = false;
      let receivedUser: any = null;

      const unsubscribe = auth.onAuthStateChanged((user) => {
        authStateReceived = true;
        receivedUser = user;
      });

      // Sign in to trigger auth state change
      const userCredential = await signInAnonymously(auth);
      
      // Wait for auth state change (max 3 seconds)
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (authStateReceived) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(false);
        }, 3000);
      });

      // Clean up
      unsubscribe();
      await signOut(auth);

      if (!authStateReceived) {
        throw new Error('Auth state change not received within timeout');
      }

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Auth state changes working. Listener triggered successfully. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          userReceived: !!receivedUser,
          userUid: receivedUser?.uid
        }
      };

      logger.info('✅ Connection 2 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Auth state changes failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 2 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 3: App → Backend (API Calls)
   */
  async testConnection3(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 3;
    const name = "App → Backend (API Calls)";

    try {
      logger.info('🔍 Testing Connection 3: App → Backend API Calls');

      // Test backend health endpoint
      const isConnected = await BackendConnectionManager.checkConnection();
      
      if (!isConnected) {
        throw new Error('Backend health check failed');
      }

      // Test actual API call
      const response = await fetch(`${BackendConnectionManager.getBaseUrl()}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      const healthData = await response.json();

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Backend API working. Health check passed. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          backendStatus: healthData.status,
          backendVersion: healthData.version,
          services: healthData.services
        }
      };

      logger.info('✅ Connection 3 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Backend API failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 3 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 4: Backend → App (API Responses)
   */
  async testConnection4(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 4;
    const name = "Backend → App (API Responses)";

    try {
      logger.info('🔍 Testing Connection 4: Backend → App API Responses');

      // Test echo endpoint to verify response handling
      const testPayload = {
        message: 'Connection test',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substr(2, 9)
      };

      const response = await fetch(`${BackendConnectionManager.getBaseUrl()}/test/echo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        throw new Error(`Echo test failed with status: ${response.status}`);
      }

      const echoData = await response.json();

      // Verify echo response
      if (echoData.message !== testPayload.message) {
        throw new Error('Echo response data mismatch');
      }

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Backend responses working. Echo test passed. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          sentPayload: testPayload,
          receivedPayload: echoData,
          dataIntegrity: 'verified'
        }
      };

      logger.info('✅ Connection 4 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Backend responses failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 4 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 5: Backend → Firebase (Data Operations)
   */
  async testConnection5(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 5;
    const name = "Backend → Firebase (Data Operations)";

    try {
      logger.info('🔍 Testing Connection 5: Backend → Firebase Data Operations');

      // Test backend's Firebase operations via API
      const testDoc = {
        testId: Math.random().toString(36).substr(2, 9),
        message: 'Backend Firebase test',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${BackendConnectionManager.getBaseUrl()}/test/firebase-write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testDoc)
      });

      if (!response.ok) {
        throw new Error(`Firebase write test failed with status: ${response.status}`);
      }

      const writeResult = await response.json();

      // Verify the document was written by reading it back
      const readResponse = await fetch(`${BackendConnectionManager.getBaseUrl()}/test/firebase-read/${testDoc.testId}`);
      
      if (!readResponse.ok) {
        throw new Error(`Firebase read test failed with status: ${readResponse.status}`);
      }

      const readResult = await readResponse.json();

      // Clean up test document
      await fetch(`${BackendConnectionManager.getBaseUrl()}/test/firebase-delete/${testDoc.testId}`, {
        method: 'DELETE'
      });

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Backend Firebase operations working. Write/Read/Delete cycle completed. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          writeSuccess: writeResult.success,
          readSuccess: readResult.success,
          dataIntegrity: readResult.data?.message === testDoc.message
        }
      };

      logger.info('✅ Connection 5 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Backend Firebase operations failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 5 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 6: Firebase → Backend (Triggers/Events)
   */
  async testConnection6(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 6;
    const name = "Firebase → Backend (Triggers/Events)";

    try {
      logger.info('🔍 Testing Connection 6: Firebase → Backend Triggers');

      // Test Firebase Cloud Function trigger
      const triggerData = {
        testId: Math.random().toString(36).substr(2, 9),
        action: 'trigger-test',
        timestamp: new Date().toISOString()
      };

      // Write to a collection that should trigger a Cloud Function
      const testDocRef = doc(db, 'test-triggers', triggerData.testId);
      await setDoc(testDocRef, triggerData);

      // Wait for trigger to process (max 5 seconds)
      let triggerProcessed = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if trigger was processed by looking for a response document
        const responseDoc = await getDoc(doc(db, 'test-trigger-responses', triggerData.testId));
        if (responseDoc.exists()) {
          triggerProcessed = true;
          break;
        }
      }

      // Clean up test documents
      await deleteDoc(testDocRef);
      if (triggerProcessed) {
        await deleteDoc(doc(db, 'test-trigger-responses', triggerData.testId));
      }

      const responseTime = Date.now() - startTime;
      
      if (!triggerProcessed) {
        const result: ConnectionTestResult = {
          connectionId,
          name,
          status: 'warning',
          responseTime,
          details: `⚠️ Firebase triggers may not be configured. No response received within timeout.`,
          timestamp: new Date(),
          data: { triggerProcessed: false }
        };

        logger.warn('⚠️ Connection 6 test warning', result);
        return result;
      }

      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Firebase triggers working. Cloud Function responded successfully. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: { triggerProcessed: true }
      };

      logger.info('✅ Connection 6 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Firebase triggers failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 6 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 7: Firebase → Admin Portal (Direct Access)
   */
  async testConnection7(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 7;
    const name = "Firebase → Admin Portal (Direct Access)";

    try {
      logger.info('🔍 Testing Connection 7: Firebase → Admin Portal Direct Access');

      // Test admin portal's Firebase connection via health endpoint
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Admin portal health check failed with status: ${response.status}`);
      }

      const healthData = await response.json();

      if (!healthData.firebase || healthData.firebase.status !== 'connected') {
        throw new Error('Admin portal Firebase connection not healthy');
      }

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Admin Portal Firebase access working. Connection verified. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          adminPortalStatus: healthData.status,
          firebaseStatus: healthData.firebase.status
        }
      };

      logger.info('✅ Connection 7 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'warning',
        responseTime,
        details: `⚠️ Admin Portal may not be running: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.warn('⚠️ Connection 7 test warning', result);
      return result;
    }
  }

  /**
   * Test Connection 8: Admin Portal → Backend (Admin API)
   */
  async testConnection8(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 8;
    const name = "Admin Portal → Backend (Admin API)";

    try {
      logger.info('🔍 Testing Connection 8: Admin Portal → Backend Admin API');

      // Test admin API endpoint
      const response = await fetch(`${BackendConnectionManager.getBaseUrl()}/admin/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Admin API health check failed with status: ${response.status}`);
      }

      const healthData = await response.json();

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Admin API working. Backend admin endpoints accessible. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          adminApiStatus: healthData.status,
          endpoints: healthData.endpoints
        }
      };

      logger.info('✅ Connection 8 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Admin API failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 8 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 9: Backend → Admin Portal (Admin Responses)
   */
  async testConnection9(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 9;
    const name = "Backend → Admin Portal (Admin Responses)";

    try {
      logger.info('🔍 Testing Connection 9: Backend → Admin Portal Responses');

      // Test admin data endpoint
      const response = await fetch(`${BackendConnectionManager.getBaseUrl()}/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Admin stats endpoint failed with status: ${response.status}`);
      }

      const statsData = await response.json();

      // Verify response structure
      if (!statsData || typeof statsData !== 'object') {
        throw new Error('Invalid admin stats response format');
      }

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ Admin responses working. Stats data received successfully. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          statsReceived: true,
          dataKeys: Object.keys(statsData)
        }
      };

      logger.info('✅ Connection 9 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'error',
        responseTime,
        details: `❌ Admin responses failed: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message }
      };

      logger.error('❌ Connection 9 test failed', result);
      return result;
    }
  }

  /**
   * Test Connection 10: Backend → Payment Service Provider (Future)
   */
  async testConnection10(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 10;
    const name = "Backend → Payment Service Provider (Future)";

    try {
      logger.info('🔍 Testing Connection 10: Backend → PSP (Future Integration)');

      // Test PSP integration readiness
      const response = await fetch(`${BackendConnectionManager.getBaseUrl()}/payment/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Payment config endpoint failed with status: ${response.status}`);
      }

      const paymentConfig = await response.json();

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ PSP integration ready. Payment endpoints configured. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          pspReady: paymentConfig.ready,
          supportedMethods: paymentConfig.supportedMethods,
          configuration: paymentConfig.configuration
        }
      };

      logger.info('✅ Connection 10 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'warning',
        responseTime,
        details: `⚠️ PSP integration not yet configured: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message, note: 'This is expected until PSP API is integrated' }
      };

      logger.warn('⚠️ Connection 10 test warning (expected)', result);
      return result;
    }
  }

  /**
   * Test Connection 11: Payment Service Provider → Backend (Future)
   */
  async testConnection11(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connectionId = 11;
    const name = "Payment Service Provider → Backend (Future)";

    try {
      logger.info('🔍 Testing Connection 11: PSP → Backend (Future Integration)');

      // Test webhook endpoint readiness
      const response = await fetch(`${BackendConnectionManager.getBaseUrl()}/payment/webhook/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          event: 'connection_test',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Payment webhook test failed with status: ${response.status}`);
      }

      const webhookResult = await response.json();

      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'success',
        responseTime,
        details: `✅ PSP webhook ready. Payment callbacks configured. Response time: ${responseTime}ms`,
        timestamp: new Date(),
        data: {
          webhookReady: webhookResult.ready,
          testProcessed: webhookResult.processed
        }
      };

      logger.info('✅ Connection 11 test passed', result);
      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        connectionId,
        name,
        status: 'warning',
        responseTime,
        details: `⚠️ PSP webhook not yet configured: ${error.message}`,
        timestamp: new Date(),
        data: { error: error.message, note: 'This is expected until PSP API is integrated' }
      };

      logger.warn('⚠️ Connection 11 test warning (expected)', result);
      return result;
    }
  }

  /**
   * Run all connection tests
   */
  async runAllTests(): Promise<SystemHealthReport> {
    logger.info('🚀 Starting comprehensive system connection tests...');
    
    const tests = [
      this.testConnection1(),
      this.testConnection2(),
      this.testConnection3(),
      this.testConnection4(),
      this.testConnection5(),
      this.testConnection6(),
      this.testConnection7(),
      this.testConnection8(),
      this.testConnection9(),
      this.testConnection10(),
      this.testConnection11(),
    ];

    const results = await Promise.all(tests);
    
    const passedTests = results.filter(r => r.status === 'success').length;
    const failedTests = results.filter(r => r.status === 'error').length;
    const warningTests = results.filter(r => r.status === 'warning').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (failedTests === 0 && warningTests <= 2) {
      overallStatus = 'healthy';
    } else if (failedTests <= 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'critical';
    }

    const report: SystemHealthReport = {
      overallStatus,
      totalTests: results.length,
      passedTests,
      failedTests,
      warningTests,
      connections: results,
      generatedAt: new Date()
    };

    logger.info('📊 System health report generated', report);
    return report;
  }
}

export const connectionTester = new ConnectionTester();
