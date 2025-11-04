import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { firebaseSMSService } from '@/services/firebaseSMSService';
import { detectBuildEnvironment, logEnvironmentInfo } from '@/utils/environmentDetection';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '@/utils/logger';

export default function FirebaseSMSTestScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testEnvironmentDetection = () => {
    addResult('🔍 Testing Environment Detection...');
    logEnvironmentInfo();
    const env = detectBuildEnvironment();
    addResult(`✅ Environment: ${env.environment}`);
    addResult(`✅ Can Use Native Firebase: ${env.canUseNativeFirebase}`);
    addResult(`✅ Should Use Expo Firebase reCAPTCHA: ${env.shouldUseExpoFirebaseRecaptcha}`);
  };

  const testSendSMS = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsLoading(true);
    addResult(`📱 Testing SMS send to ${phoneNumber}...`);

    try {
      const result = await firebaseSMSService.sendVerificationCode(phoneNumber);
      setVerificationId(result.verificationId);
      addResult(`✅ SMS sent successfully via ${result.method}`);
      addResult(`📱 Verification ID: ${result.verificationId.substring(0, 20)}...`);
      
      // Show mock code if using mock SMS
      if (result.method === 'backend-only' && result.verificationId.startsWith('mock_verification_')) {
        addResult(`🧪 MOCK SMS: Use verification code: 123456`);
        setVerificationCode('123456'); // Auto-fill for testing
      }
    } catch (error: any) {
      addResult(`❌ SMS send failed: ${error.message}`);
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('SMS test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testVerifyCode = async () => {
    if (!verificationId || !verificationCode.trim()) {
      Alert.alert('Error', 'Please enter verification code');
      return;
    }

    setIsLoading(true);
    addResult(`📱 Testing code verification...`);

    try {
      await firebaseSMSService.verifyCode(verificationId, verificationCode);
      addResult(`✅ Code verification successful!`);
    } catch (error: any) {
      addResult(`❌ Code verification failed: ${error.message}`);
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Verification test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTest = async () => {
    setTestResults([]);
    addResult('🧪 Starting Full Firebase SMS Test...');
    
    // Test 1: Environment Detection
    testEnvironmentDetection();
    
    // Test 2: SMS Send
    await testSendSMS();
    
    // Test 3: Code Verification (if SMS was sent)
    if (verificationId) {
      addResult('📱 Waiting 2 seconds before verification test...');
      setTimeout(async () => {
        await testVerifyCode();
      }, 2000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>🧪 Firebase SMS Test</Text>
        
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Phone Number:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1234567890"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text }]}>Verification Code:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={testEnvironmentDetection}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Environment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.secondary }]}
            onPress={testSendSMS}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Send SMS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.accent }]}
            onPress={testVerifyCode}
            disabled={isLoading || !verificationId}
          >
            <Text style={styles.buttonText}>Verify Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.success }]}
            onPress={runFullTest}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Run Full Test</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: theme.text }]}>Test Results:</Text>
          {testResults.map((result, index) => (
            <Text key={index} style={[styles.result, { color: theme.textSecondary }]}>
              {result}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  result: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
