import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Briefcase, DollarSign, MessageCircle, Award, Settings, BellRing, X, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface InAppNotificationBannerProps {
  visible: boolean;
  type: 'job' | 'payment' | 'message' | 'offer' | 'achievement' | 'system';
  title: string;
  body: string;
  onPress?: () => void;
  onDismiss: () => void;
  autoDismiss?: boolean;
  duration?: number;
  isRead?: boolean; // Optional: show/hide status dot
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  visible,
  type,
  title,
  body,
  onPress,
  onDismiss,
  autoDismiss = true,
  duration = 4000,
  isRead = false,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      if (autoDismiss) {
        const timer = setTimeout(() => {
          dismissBanner();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      slideAnim.setValue(-200);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const dismissBanner = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    dismissBanner();
    onPress?.();
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'job':
        return { Icon: Briefcase, color: theme.primary, bgColor: theme.primary + '15' };
      case 'payment':
        return { Icon: DollarSign, color: '#4CAF50', bgColor: '#4CAF5015' };
      case 'message':
        return { Icon: MessageCircle, color: '#2196F3', bgColor: '#2196F315' };
      case 'offer':
        return { Icon: BellRing, color: '#FF9800', bgColor: '#FF980015' };
      case 'achievement':
        return { Icon: Award, color: '#FFD700', bgColor: '#FFD70015' };
      case 'system':
        return { Icon: Settings, color: '#9C27B0', bgColor: '#9C27B015' };
      default:
        return { Icon: BellRing, color: theme.primary, bgColor: theme.primary + '15' };
    }
  };

  if (!visible) return null;

  const { Icon, color, bgColor } = getIconAndColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[
          styles.banner,
          {
            backgroundColor: theme.surface,
            shadowColor: theme.textPrimary,
            borderLeftColor: color,
          },
        ]}
      >
        {/* App Icon (Shield) with Status Dot */}
        <View style={styles.iconWrapper}>
          <View style={[styles.appIconContainer, { backgroundColor: theme.primary + '15' }]}>
            <Shield size={22} color={theme.primary} strokeWidth={2.5} />
          </View>
          {/* Status Dot - only shown if notification is unread */}
          {!isRead && (
            <View style={[styles.statusDot, { backgroundColor: color, borderColor: theme.surface }]} />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.appName, { color: theme.primary }]}>GUILD</Text>
            <Text style={[styles.titleSeparator, { color: theme.textSecondary }]}> · </Text>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={2}>
            {body}
          </Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            dismissBanner();
          }}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleSeparator: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

