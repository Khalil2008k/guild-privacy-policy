import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { jobService, Job } from '../../services/jobService';
import { Send, User, ArrowLeft, ArrowRight, MessageCircle, Coins, CheckCircle, XCircle } from 'lucide-react-native';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export default function JobDiscussionScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadJobAndMessages();
  }, [jobId]);

  const loadJobAndMessages = async () => {
    setLoading(true);
    try {
      if (!jobId) return;

      // Load job details
      const jobData = await jobService.getJobById(jobId as string);
      if (jobData) {
        setJob(jobData);

        // Load existing messages (in real implementation, from database)
        // For now, create sample conversation
        const sampleMessages: Message[] = [
          {
            id: '1',
            senderId: jobData.clientId,
            senderName: jobData.clientName,
            message: `Hi! I'm interested in your job "${jobData.title}". Can you tell me more about the requirements?`,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            type: 'text'
          },
          {
            id: '2',
            senderId: user?.uid || '',
            senderName: user?.displayName || 'You',
            message: `Sure! ${jobData.description}. Are you available to start immediately?`,
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            type: 'text'
          },
          {
            id: '3',
            senderId: jobData.clientId,
            senderName: jobData.clientName,
            message: 'Yes, I can start right away. What\'s your proposed timeline and rate?',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            type: 'text'
          }
        ];

        setMessages(sampleMessages);
      }
    } catch (error) {
      console.error('Error loading job discussion:', error);
      CustomAlertService.showError('Error', 'Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !job) return;

    setSending(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        senderId: user.uid,
        senderName: user.displayName || 'You',
        message: newMessage.trim(),
        timestamp: new Date(),
        type: 'text'
      };

      // Add message to local state
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // In real implementation, save to database
      // await jobService.sendMessage(jobId as string, message);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      CustomAlertService.showError('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
        { flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
          <User size={16} color={theme.primary} />
        </View>

        <View style={[
          styles.messageContent,
          { backgroundColor: isOwnMessage ? theme.primary : theme.surface }
        ]}>
          {!isOwnMessage && (
            <Text style={[styles.senderName, { color: theme.textSecondary }]}>
              {item.senderName}
            </Text>
          )}

          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? theme.buttonText : theme.textPrimary }
          ]}>
            {item.message}
          </Text>

          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {isRTL ? 'جارٍ التحميل...' : 'Loading discussion...'}
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {isRTL ? 'الوظيفة غير موجودة' : 'Job not found'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: adaptiveColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'DD', theme.primary + 'AA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}
      >
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            {isRTL ? <ArrowRight size={24} color="#000000" /> : <ArrowLeft size={24} color="#000000" />}
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
              <MessageCircle size={20} color="#000000" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                {isRTL ? 'مناقشة الوظيفة' : 'Job Discussion'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {job.title}
              </Text>
            </View>
          </View>

          <View style={[styles.budgetBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
            <Coins size={16} color="#000000" />
            <Text style={styles.budgetText}>
              {typeof job.budget === 'object' 
                ? `${job.budget.min}-${job.budget.max}` 
                : job.budget} QR
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={scrollViewRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.background,
              color: theme.textPrimary,
              borderColor: theme.border,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}
          placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
          placeholderTextColor={theme.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: newMessage.trim() ? theme.primary : theme.border,
            }
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Send
            size={20}
            color={newMessage.trim() ? theme.buttonText : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionsContainer, { backgroundColor: adaptiveColors.background, borderTopColor: adaptiveColors.border }]}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => {
            // Navigate to job acceptance
            router.push(`/(modals)/job-accept/${jobId}`);
          }}
        >
          <LinearGradient
            colors={[theme.primary, theme.primary + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptButtonGradient}
          >
            <CheckCircle size={20} color="#000000" />
            <Text style={styles.acceptButtonText}>
              {isRTL ? 'قبول الوظيفة' : 'Accept Job'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.declineButton, { borderColor: theme.error }]}
          onPress={() => router.back()}
        >
          <XCircle size={20} color={theme.error} />
          <Text style={[styles.declineButtonText, { color: theme.error }]}>
            {isRTL ? 'رفض' : 'Decline'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  headerGradient: {
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.7)',
    marginTop: 2,
  },
  budgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  budgetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 6,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

