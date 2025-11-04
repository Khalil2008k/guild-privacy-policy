/**
 * Message Status Indicator Component
 * 
 * COMMENT: ADVANCED FEATURE - Copied from reference chat system
 * Purpose: Advanced message status indicator with all states
 * Source: C:\Users\Admin\Desktop\chat\react-native-chat\src\components\MessageStatusIndicator.js
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Check, CheckCheck, Clock, XCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface MessageStatusIndicatorProps {
  message: {
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    readBy?: string[] | Record<string, any>;
    [key: string]: any;
  };
  isOwnMessage: boolean;
  isMedia?: boolean; // For media messages, make checkmarks white
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  message,
  isOwnMessage,
  isMedia = false,
}) => {
  const { theme } = useTheme();

  if (!isOwnMessage) return null;

  const status = message.status || 'sent'; // sending, sent, delivered, read, failed
  const readBy = message.readBy || [];
  const readCount = Array.isArray(readBy) ? readBy.length : Object.keys(readBy || {}).length;
  
  // For media messages, use white color for checkmarks
  const checkColor = isMedia ? '#FFFFFF' : theme.textSecondary;
  const readColor = isMedia ? '#FFFFFF' : theme.primary;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <ActivityIndicator size={12} color={isMedia ? '#FFFFFF' : theme.textSecondary} />;
      case 'sent':
        return <Check size={14} color={checkColor} />;
      case 'delivered':
        return (
          <View style={styles.doubleCheck}>
            <CheckCheck size={14} color={checkColor} />
          </View>
        );
      case 'read':
        return (
          <View style={styles.doubleCheck}>
            <CheckCheck size={14} color={readColor} />
          </View>
        );
      case 'failed':
        return <XCircle size={14} color={theme.error} />;
      default:
        return <Check size={14} color={checkColor} />;
    }
  };

  return (
    <View style={styles.container}>
      {getStatusIcon()}
      {readCount > 0 && status === 'read' && (
        <Text style={[styles.readCount, { color: theme.primary }]}>
          {readCount}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    gap: 4,
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readCount: {
    fontSize: 10,
    fontWeight: '500',
  },
});

