import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';

const FONT_FAMILY = 'Signika Negative SC';
const { width } = Dimensions.get('window');

interface UnifiedAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface UnifiedAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: UnifiedAlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function UnifiedAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  type = 'info',
  onDismiss,
  autoHide = false,
  autoHideDelay = 3000,
}: UnifiedAlertProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Auto-hide timer
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Clear any existing timer
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }

      // Start entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Set auto-hide timer if enabled
      if (autoHide && onDismiss) {
        autoHideTimer.current = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);
      }
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      slideAnim.setValue(50);
    }

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [visible, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
    
    // Exit animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const handleButtonPress = (button: UnifiedAlertButton) => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
    
    if (button.onPress) {
      button.onPress();
    }
    handleDismiss();
  };

  const handleBackdropPress = () => {
    const cancelButton = buttons.find(btn => btn.style === 'cancel');
    if (cancelButton) {
      handleButtonPress(cancelButton);
    } else {
      handleDismiss();
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return theme.primary;
      default: return theme.primary;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    const baseStyle = {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
    };

    switch (buttonStyle) {
      case 'destructive':
        return {
          backgroundColor: '#F44336',
          borderColor: '#F44336',
          color: '#FFFFFF',
        };
      case 'cancel':
        return {
          ...baseStyle,
          backgroundColor: isDarkMode ? '#2D2D2D' : '#F5F5F5',
          borderColor: isDarkMode ? '#444444' : '#E0E0E0',
          color: isDarkMode ? '#CCCCCC' : '#666666',
        };
      default:
        return {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          color: '#000000',
        };
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: opacityAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <Animated.View
              style={[
                styles.alertBox,
                {
                  backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                  borderColor: getTypeColor(),
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                },
              ]}
            >
              {/* Header with Shield Icon */}
              <View style={[styles.header, { borderBottomColor: getTypeColor() + '20' }]}>
                <View style={styles.headerLeft}>
                  {/* GUILD Shield Icon */}
                  <View style={[styles.shieldContainer, { backgroundColor: getTypeColor() + '15' }]}>
                    <MaterialIcons name="security" size={24} color={getTypeColor()} />
                  </View>
                  
                  {/* Type Icon */}
                  <View style={[styles.typeIconContainer, { backgroundColor: getTypeColor() + '10' }]}>
                    <Ionicons name={getTypeIcon() as any} size={20} color={getTypeColor()} />
                  </View>
                  
                  <Text style={[
                    styles.title,
                    { 
                      color: isDarkMode ? '#FFFFFF' : '#000000',
                      fontFamily: FONT_FAMILY,
                      textAlign: isRTL ? 'right' : 'left',
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
                  <Ionicons name="close" size={18} color={isDarkMode ? '#FFFFFF' : '#666666'} />
                </TouchableOpacity>
              </View>

              {/* Message */}
              {message && (
                <View style={styles.messageContainer}>
                  <Text style={[
                    styles.message,
                    { 
                      color: isDarkMode ? '#CCCCCC' : '#666666',
                      fontFamily: FONT_FAMILY,
                      textAlign: isRTL ? 'right' : 'left',
                    }
                  ]}>
                    {message}
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={[
                styles.buttonsContainer,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                {buttons.map((button, index) => {
                  const buttonStyle = getButtonStyle(button.style);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        {
                          backgroundColor: buttonStyle.backgroundColor,
                          borderColor: buttonStyle.borderColor,
                          borderWidth: 1,
                        },
                        buttons.length === 1 && styles.singleButton,
                      ]}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.buttonText,
                        { 
                          color: buttonStyle.color,
                          fontFamily: FONT_FAMILY 
                        }
                      ]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    flex: 1,
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
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shieldContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIconContainer: {
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
    lineHeight: 24,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  singleButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Hook for easier usage
export const useUnifiedAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: UnifiedAlertButton[];
    type?: 'success' | 'error' | 'warning' | 'info';
    autoHide?: boolean;
    autoHideDelay?: number;
  }>({
    visible: false,
    title: '',
  });

  const showAlert = (
    title: string,
    message?: string,
    buttons?: UnifiedAlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info',
    options?: { autoHide?: boolean; autoHideDelay?: number }
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
      type,
      autoHide: options?.autoHide,
      autoHideDelay: options?.autoHideDelay,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <UnifiedAlert
      {...alertConfig}
      onDismiss={hideAlert}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};
