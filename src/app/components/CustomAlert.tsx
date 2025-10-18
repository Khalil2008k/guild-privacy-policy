import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  onDismiss?: () => void;
}

const FONT_FAMILY = 'Signika Negative SC';

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
}: CustomAlertProps) {
  const insets = useSafeAreaInsets();
  const top = insets?.top || 0;
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();

  const handleButtonPress = (button: CustomAlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleBackdropPress = () => {
    // Check if there's a cancel button, if so, trigger it, otherwise dismiss
    const cancelButton = buttons.find(btn => btn.style === 'cancel');
    if (cancelButton) {
      handleButtonPress(cancelButton);
    } else if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />
      
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View style={[styles.container, { paddingTop: top + 20 }]}>
          <TouchableOpacity 
            activeOpacity={1}
            style={[
              styles.alertBox,
              {
                backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                borderColor: theme.primary,
              }
            ]}
          >
            {/* Header with Shield and Close */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.shieldContainer, { backgroundColor: theme.primary + '20' }]}>
                  <MaterialIcons name="security" size={20} color={theme.primary} />
                </View>
                <Text style={[
                  styles.title,
                  { 
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    fontFamily: FONT_FAMILY 
                  }
                ]}>
                  {title}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F5F5' }]}
                onPress={handleBackdropPress}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={isDarkMode ? '#FFFFFF' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* Message */}
            {message && (
              <Text style={[
                styles.message,
                { 
                  color: isDarkMode ? '#CCCCCC' : '#666666',
                  fontFamily: FONT_FAMILY 
                }
              ]}>
                {message}
              </Text>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && [styles.cancelButton, { borderColor: isDarkMode ? '#444444' : '#E0E0E0' }],
                    button.style === 'default' && [styles.defaultButton, { backgroundColor: theme.primary }],
                    buttons.length === 1 && styles.singleButton,
                    index === 0 && buttons.length > 1 && styles.firstButton,
                    index === buttons.length - 1 && buttons.length > 1 && styles.lastButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style === 'cancel' && [styles.cancelButtonText, { color: isDarkMode ? '#CCCCCC' : '#666666' }],
                    button.style === 'default' && styles.defaultButtonText,
                    { fontFamily: FONT_FAMILY }
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 2,
    padding: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shieldContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
    textAlign: 'left',
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  defaultButton: {
    backgroundColor: '#BCFF31',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  destructiveButton: {
    backgroundColor: '#FF4444',
  },
  singleButton: {
    flex: 1,
  },
  firstButton: {
    marginRight: 4,
  },
  lastButton: {
    marginLeft: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  defaultButtonText: {
    color: '#000000',
  },
  cancelButtonText: {
    color: '#666666',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

