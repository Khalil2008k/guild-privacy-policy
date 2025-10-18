import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Key, Copy, Download, RefreshCw, Check, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';

interface BackupCode {
  id: string;
  code: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
}

export default function BackupCodeGeneratorScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // State
  const [loading, setLoading] = useState(false);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [userPhone, setUserPhone] = useState('+974 5555 1234'); // Mock phone number

  // Timer effect for resend countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Generate backup codes
  const generateBackupCodes = () => {
    const codes: BackupCode[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push({
        id: `backup_${Date.now()}_${i}`,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        isUsed: false,
        createdAt: new Date(),
      });
    }
    return codes;
  };

  // Handle generate new codes
  const handleGenerateNewCodes = async () => {
    try {
      setGeneratingCodes(true);
      
      // Show confirmation alert first
      showAlert(
        t('backupCodeGenerator.generateNewTitle'),
        t('backupCodeGenerator.generateNewMessage'),
        'warning',
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('backupCodeGenerator.generate'), 
            style: 'destructive',
            onPress: () => proceedWithGeneration()
          }
        ]
      );
    } catch (error) {
      console.error('Error generating codes:', error);
      showAlert('Error', 'Failed to generate backup codes. Please try again.', 'error');
    } finally {
      setGeneratingCodes(false);
    }
  };

  const proceedWithGeneration = () => {
    // Simulate API call
    setTimeout(() => {
      const newCodes = generateBackupCodes();
      setBackupCodes(newCodes);
      showAlert(
        'Backup Codes Generated',
        'New backup codes have been generated successfully. Please save them in a secure location.',
        'success'
      );
    }, 1000);
  };

  // Handle send SMS verification
  const handleSendSMS = async () => {
    try {
      setSendingSMS(true);
      
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowVerification(true);
      setResendTimer(60);
      
      showAlert(
        t('backupCodeGenerator.verificationCodeSent'),
        t('backupCodeGenerator.verificationCodeSentMessage', { phone: userPhone }),
        'success'
      );
    } catch (error) {
      console.error('Error sending SMS:', error);
      showAlert(t('backupCodeGenerator.error'), t('backupCodeGenerator.sendSMSError'), 'error');
    } finally {
      setSendingSMS(false);
    }
  };

  // Handle verify SMS code
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Invalid Code', 'Please enter a valid 6-digit verification code.', 'warning');
      return;
    }

    try {
      setVerifyingCode(true);
      
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (verificationCode === '123456') {
        setShowVerification(false);
        setVerificationCode('');
        
        // Generate backup codes after successful verification
        const newCodes = generateBackupCodes();
        setBackupCodes(newCodes);
        
        showAlert(
          'Phone Verified Successfully',
          'Your phone number has been verified. Backup codes have been generated.',
          'success'
        );
      } else {
        showAlert('Invalid Code', 'The verification code you entered is incorrect.', 'error');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      showAlert('Error', 'Failed to verify code. Please try again.', 'error');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Handle copy code
  const handleCopyCode = (code: string) => {
    // In a real app, you would use Clipboard API
    showAlert('Code Copied', `Backup code "${code}" copied to clipboard.`, 'success');
  };

  // Handle download codes
  const handleDownloadCodes = () => {
    showAlert(
      'Download Backup Codes',
      'Backup codes will be downloaded as a secure PDF file.',
      'info'
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    phoneInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    phoneIcon: {
      marginRight: 12,
    },
    phoneText: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    phoneNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.primary,
      fontFamily: FONT_FAMILY,
    },
    description: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
      marginBottom: 16,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
    },
    buttonTextSecondary: {
      color: theme.textPrimary,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    verificationContainer: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    verificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
      textAlign: 'center',
    },
    codeInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 18,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      letterSpacing: 2,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    verificationButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    verificationButton: {
      flex: 1,
    },
    resendText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textAlign: 'center',
      marginTop: 8,
    },
    codesContainer: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
    },
    codesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    codesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    codesCount: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    codesList: {
      gap: 8,
    },
    codeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
    },
    codeItemUsed: {
      opacity: 0.5,
    },
    codeText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: theme.textPrimary,
      fontFamily: 'monospace',
    },
    codeTextUsed: {
      textDecorationLine: 'line-through',
      color: theme.textSecondary,
    },
    copyButton: {
      padding: 8,
    },
    codesActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
    },
    warningCard: {
      backgroundColor: '#FFF3CD',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    warningText: {
      fontSize: 14,
      color: '#856404',
      fontFamily: FONT_FAMILY,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('backupCodeGenerator.title'),
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Phone Verification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backupCodeGenerator.phoneVerification')}</Text>
          
          <View style={styles.card}>
            <View style={styles.phoneInfo}>
              <Ionicons 
                name="phone-portrait-outline" 
                size={24} 
                color={theme.primary}
                style={styles.phoneIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.phoneText}>Registered Phone:</Text>
                <Text style={styles.phoneNumber}>{userPhone}</Text>
              </View>
            </View>

            <Text style={styles.description}>
              To generate backup codes, we need to verify your registered phone number for security purposes.
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                (sendingSMS || resendTimer > 0) && styles.buttonDisabled
              ]}
              onPress={handleSendSMS}
              disabled={sendingSMS || resendTimer > 0}
            >
              {sendingSMS ? (
                <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
              ) : (
                <Ionicons name="send" size={20} color={getContrastTextColor(theme.primary)} />
              )}
              <Text style={styles.buttonText}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SMS Verification */}
          {showVerification && (
            <View style={styles.verificationContainer}>
              <Text style={styles.verificationTitle}>Enter Verification Code</Text>
              
              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <View style={styles.verificationButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary, styles.verificationButton]}
                  onPress={() => setShowVerification(false)}
                >
                  <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.verificationButton, verifyingCode && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={verifyingCode}
                >
                  {verifyingCode ? (
                    <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
                  ) : (
                    <Ionicons name="checkmark" size={20} color={getContrastTextColor(theme.primary)} />
                  )}
                  <Text style={styles.buttonText}>Verify</Text>
                </TouchableOpacity>
              </View>

              {resendTimer > 0 && (
                <Text style={styles.resendText}>
                  You can request a new code in {resendTimer} seconds
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Backup Codes Section */}
        {backupCodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Backup Codes</Text>

            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                ⚠️ Save these codes in a secure location. Each code can only be used once and will be your only way to access your account if you lose your phone.
              </Text>
            </View>

            <View style={styles.codesContainer}>
              <View style={styles.codesHeader}>
                <Text style={styles.codesTitle}>Backup Codes</Text>
                <Text style={styles.codesCount}>
                  {backupCodes.filter(c => !c.isUsed).length} / {backupCodes.length} available
                </Text>
              </View>

              <View style={styles.codesList}>
                {backupCodes.map((code) => (
                  <View 
                    key={code.id} 
                    style={[styles.codeItem, code.isUsed && styles.codeItemUsed]}
                  >
                    <Text style={[styles.codeText, code.isUsed && styles.codeTextUsed]}>
                      {code.code}
                    </Text>
                    {!code.isUsed && (
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => handleCopyCode(code.code)}
                      >
                        <Ionicons name="copy-outline" size={20} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.codesActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary, styles.actionButton]}
                  onPress={handleDownloadCodes}
                >
                  <Ionicons name="download-outline" size={20} color={theme.textPrimary} />
                  <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.actionButton, generatingCodes && styles.buttonDisabled]}
                  onPress={handleGenerateNewCodes}
                  disabled={generatingCodes}
                >
                  {generatingCodes ? (
                    <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
                  ) : (
                    <MaterialIcons name="refresh" size={20} color={getContrastTextColor(theme.primary)} />
                  )}
                  <Text style={styles.buttonText}>Generate New</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <AlertComponent />
    </View>
  );
}
