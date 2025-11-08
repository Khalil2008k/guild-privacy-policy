/**
 * AI Chat Bubble Component
 * Renders AI messages with streaming support
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Bot, Sparkles } from 'lucide-react-native';

interface AIChatBubbleProps {
  message: string;
  isStreaming?: boolean;
  confidenceScore?: number;
  senderId: string;
  isOwnMessage?: boolean;
}

export const AIChatBubble: React.FC<AIChatBubbleProps> = ({
  message,
  isStreaming = false,
  confidenceScore,
  senderId,
  isOwnMessage = false
}) => {
  const { theme } = useTheme();
  const isAI = senderId === 'support_bot';
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for streaming
  useEffect(() => {
    if (isStreaming) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      fadeAnim.setValue(1);
    }
  }, [isStreaming, fadeAnim]);

  if (isOwnMessage) {
    // User message - render normally
    return (
      <View style={[styles.container, styles.userContainer, { backgroundColor: theme.primary }]}>
        <Text style={[styles.text, { color: '#000000' }]}>{message}</Text>
      </View>
    );
  }

  // AI message
  return (
    <Animated.View 
      style={[
        styles.container, 
        styles.aiContainer, 
        { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.aiHeader}>
        <View style={[styles.aiIcon, { backgroundColor: theme.primary }]}>
          <Bot size={16} color="#000000" />
        </View>
        <Text style={[styles.aiLabel, { color: theme.textSecondary }]}>
          AI Assistant
        </Text>
        {confidenceScore !== undefined && (
          <View style={styles.confidenceBadge}>
            <Sparkles size={12} color={theme.primary} />
            <Text style={[styles.confidenceText, { color: theme.primary }]}>
              {Math.round(confidenceScore * 100)}%
            </Text>
          </View>
        )}
        {isStreaming && (
          <View style={styles.streamingIndicator}>
            <View style={[styles.streamingDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.streamingText, { color: theme.textSecondary }]}>
              Typing...
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.text, { color: theme.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8
  },
  userContainer: {
    alignSelf: 'flex-end',
    marginLeft: 'auto'
  },
  aiContainer: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
    borderWidth: 1
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)'
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4
  },
  streamingText: {
    fontSize: 10,
    fontStyle: 'italic'
  },
  text: {
    fontSize: 14,
    lineHeight: 20
  }
});


