import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Shield } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';

const { width } = Dimensions.get('window');
const FONT_FAMILY = 'SignikaNegative_400Regular';

export interface CustomAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  type?: 'default' | 'success' | 'warning' | 'error' | 'info';
  onDismiss?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [],
  type = 'default',
  onDismiss,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { isRTL } = useI18n();

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'error':
        return theme.error;
      case 'info':
        return theme.info;
      default:
        return theme.primary;
    }
  };

  const handleButtonPress = (button: CustomAlertButton) => {
    button.onPress?.();
    onDismiss?.();
  };

  const defaultButtons: CustomAlertButton[] = buttons.length > 0 
    ? buttons 
    : [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View 
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }
          ]}
        />
        
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onDismiss}
        />

        <View style={[styles.alertContainer, { backgroundColor: theme.surface }]}>
          {/* Shield Icon */}
          <View style={[styles.shieldContainer, { 
            position: 'absolute',
            top: 16,
            [isRTL ? 'left' : 'right']: 16,
          }]}>
            <Shield 
              size={20} 
              color={getTypeColor()} 
              strokeWidth={2}
            />
          </View>

          {/* Type Indicator Bar */}
          <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(), opacity: isDarkMode ? 0.9 : 1 }]} />

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {title}
            </Text>
            
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              {message}
            </Text>
          </View>

          {/* Buttons */}
          <View style={[styles.buttonsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {defaultButtons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    {
                      backgroundColor: isDestructive 
                        ? theme.error 
                        : isCancel 
                        ? 'transparent'
                        : getTypeColor(),
                      borderWidth: isCancel ? 1.5 : 0,
                      borderColor: isCancel ? theme.textSecondary : 'transparent',
                      flex: 1,
                    }
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: isCancel ? theme.textSecondary : '#000000',
                        fontWeight: isCancel ? '600' : '700',
                      }
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  typeIndicator: {
    height: 4,
    width: '100%',
  },
  shieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontFamily: FONT_FAMILY,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonsContainer: {
    justifyContent: 'space-between',
    gap: 10,
    padding: 20,
    paddingTop: 0,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
});