/**
 * Support Chat Screen
 * AI-powered support chat with streaming responses
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { SupportChatService } from '../../services/SupportChatService';
import { useAIStream } from '../../hooks/useAIStream';
import { AIChatBubble } from '../../components/AIChatBubble';
import { SmartActions } from '../../components/SmartActions';
import { ChatInput } from '../../components/ChatInput';
import { ArrowLeft, MessageSquare } from 'lucide-react-native';
import { logger } from '../../utils/logger';

export default function SupportChatScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');

  // Get or create support chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        const supportChatId = await SupportChatService.getOrCreateSupportChat();
        setChatId(supportChatId);
      } catch (error: any) {
        logger.error('Error initializing support chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Use AI stream hook
  const { messages, sendMessage, isConnected, isStreaming, error } = useAIStream(chatId || '');

  // Handle send message
  const handleSendMessage = () => {
    if (!inputText.trim() || !isConnected) {
      return;
    }

    sendMessage(inputText.trim());
    setInputText('');
  };

  // Handle smart action
  const handleSmartAction = (action: string) => {
    if (!isConnected) {
      return;
    }
    sendMessage(action);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading support chat...
        </Text>
      </View>
    );
  }

  if (!chatId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textPrimary }]}>
          Failed to load support chat
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
          paddingTop: insets.top + 10
        }
      ]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.primary} />
          </TouchableOpacity>
          
          <View style={[styles.headerCenter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MessageSquare size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'دعم GUILD' : 'GUILD Support'}
            </Text>
          </View>

          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#4CAF50' : '#FF5722' }
            ]} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {isConnected ? (isRTL ? 'متصل' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AIChatBubble
            message={item.text}
            isStreaming={item.isStreaming || (item.type === 'streaming')}
            confidenceScore={item.confidenceScore}
            senderId={item.senderId}
            isOwnMessage={item.senderId === user?.uid}
          />
        )}
        contentContainerStyle={styles.messagesContent}
        inverted={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Smart Actions */}
      {messages.length === 0 && (
        <SmartActions onActionPress={handleSmartAction} />
      )}

      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>{error}</Text>
        </View>
      )}

      {/* Input */}
      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSendMessage}
        onSendImage={() => {}} // Support chat doesn't support images yet
        onSendFile={() => {}} // Support chat doesn't support files yet
        placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
        disabled={!isConnected || isStreaming}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 16
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    padding: 8
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4
  },
  statusText: {
    fontSize: 12
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center'
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 16
  },
  errorContainer: {
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8
  }
});

