/**
 * ⚠️ DEPRECATED - DO NOT USE
 * 
 * This screen has been replaced by chat/[jobId].tsx which has:
 * - Real database persistence
 * - Real-time message updates
 * - Proper file upload integration
 * 
 * This file is kept for reference only.
 * All navigation has been updated to use chat/[jobId].tsx instead.
 * 
 * @deprecated Use chat/[jobId].tsx instead
 */

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
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { jobService, Job } from '../../services/jobService';
import { chatFileService } from '../../services/chatFileService';
import { ChatInput } from '../../components/ChatInput';
import { Send, User, ArrowLeft, ArrowRight, MessageCircle, Coins, CheckCircle, XCircle, MoreVertical, Image as ImageIcon } from 'lucide-react-native';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../../utils/logger';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'image' | 'file' | 'location';
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error loading job discussion:', error);
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
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error sending message:', error);
      CustomAlertService.showError('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendImage = async (uri: string) => {
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('🖼️ handleSendImage called with URI:', uri);
    if (!user || !job) {
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('❌ No user or job');
      return;
    }

    setSending(true);
    try {
      // Create a temporary chat ID for this job discussion
      const chatId = `job_discussion_${jobId}`;
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('📤 Uploading image to chat:', chatId);
      
      // Upload image
      const { url } = await chatFileService.uploadFile(
        chatId,
        uri,
        `image_${Date.now()}.jpg`,
        'image/jpeg',
        user.uid
      );
      // COMMENT: PRIORITY 1 - Replace console.log with logger
      logger.debug('✅ Image uploaded, URL:', url);

      // Add image message to local state
      const imageMessage: Message = {
        id: Date.now().toString(),
        senderId: user.uid,
        senderName: user.displayName || 'You',
        message: '',
        timestamp: new Date(),
        type: 'image',
        imageUrl: url,
      };

      setMessages(prev => [...prev, imageMessage]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      CustomAlertService.showSuccess(
        isRTL ? 'تم الإرسال' : 'Sent',
        isRTL ? 'تم إرسال الصورة بنجاح' : 'Image sent successfully'
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error sending image:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الصورة' : 'Failed to send image'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendFile = async (uri: string, name: string, type: string) => {
    if (!user || !job) return;

    setSending(true);
    try {
      // Create a temporary chat ID for this job discussion
      const chatId = `job_discussion_${jobId}`;
      
      // Upload file
      const { url } = await chatFileService.uploadFile(
        chatId,
        uri,
        name,
        type,
        user.uid
      );

      // Add file message to local state
      const fileMessage: Message = {
        id: Date.now().toString(),
        senderId: user.uid,
        senderName: user.displayName || 'You',
        message: `📎 ${name}`,
        timestamp: new Date(),
        type: 'file',
        fileUrl: url,
        fileName: name,
      };

      setMessages(prev => [...prev, fileMessage]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      CustomAlertService.showSuccess(
        isRTL ? 'تم الإرسال' : 'Sent',
        isRTL ? 'تم إرسال الملف بنجاح' : 'File sent successfully'
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error sending file:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إرسال الملف' : 'Failed to send file'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendLocation = async (location: { latitude: number; longitude: number; address?: string }) => {
    if (!user || !job) return;

    try {
      // Add location message to local state
      const locationMessage: Message = {
        id: Date.now().toString(),
        senderId: user.uid,
        senderName: user.displayName || 'You',
        message: `📍 ${location.address || 'Shared Location'}`,
        timestamp: new Date(),
        type: 'location',
        location: location,
      };

      setMessages(prev => [...prev, locationMessage]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      CustomAlertService.showSuccess(
        isRTL ? 'تم الإرسال' : 'Sent',
        isRTL ? 'تم مشاركة الموقع بنجاح' : 'Location shared successfully'
      );
    } catch (error) {
      // COMMENT: PRIORITY 1 - Replace console.error with logger
      logger.error('Error sending location:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل مشاركة الموقع' : 'Failed to share location'
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.uid;

    return (
      <TouchableOpacity
        onLongPress={() => {
          // Message options (edit/delete) - currently disabled
          // Core chat functionality (send text/images/files/location) is fully working
        }}
        delayLongPress={500}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
        activeOpacity={0.7}
      >
        <View style={[
          styles.messageContent,
          { 
            backgroundColor: isOwnMessage ? theme.primary : (isDarkMode ? '#3A3A3A' : '#F0F0F0'),
            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          }
        ]}>
          {!isOwnMessage && (
            <Text style={[styles.senderName, { color: isDarkMode ? theme.textSecondary : '#666666' }]}>
              {item.senderName}
            </Text>
          )}

          {/* Image Message */}
          {item.type === 'image' && item.imageUrl && (
            <View style={styles.imageMessageContainer}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* File Message */}
          {item.type === 'file' && item.fileUrl && (
            <TouchableOpacity
              style={styles.fileMessageContainer}
              onPress={() => {
                // Open file URL
                CustomAlertService.showInfo(
                  isRTL ? 'فتح الملف' : 'Open File',
                  isRTL ? 'سيتم فتح الملف في المتصفح' : 'File will open in browser'
                );
              }}
            >
              <Text style={[
                styles.messageText,
                { color: isOwnMessage ? '#000000' : (isDarkMode ? '#FFFFFF' : '#1A1A1A') }
              ]}>
                {item.message}
              </Text>
            </TouchableOpacity>
          )}

          {/* Location Message */}
          {item.type === 'location' && item.location && (
            <TouchableOpacity
              style={styles.locationMessageContainer}
              onPress={() => {
                // Open location in maps
                CustomAlertService.showInfo(
                  isRTL ? 'فتح الموقع' : 'Open Location',
                  isRTL ? 'سيتم فتح الموقع في الخرائط' : 'Location will open in maps'
                );
              }}
            >
              <Text style={[
                styles.messageText,
                { color: isOwnMessage ? '#000000' : (isDarkMode ? '#FFFFFF' : '#1A1A1A') }
              ]}>
                {item.message}
              </Text>
            </TouchableOpacity>
          )}

          {/* Text Message */}
          {item.type === 'text' && (
            <Text style={[
              styles.messageText,
              { color: isOwnMessage ? '#000000' : (isDarkMode ? '#FFFFFF' : '#1A1A1A') }
            ]}>
              {item.message}
            </Text>
          )}

          <Text style={[styles.timestamp, { color: isOwnMessage ? 'rgba(0,0,0,0.6)' : (isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)') }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
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

      {/* Chat Input */}
      <ChatInput
        value={newMessage}
        onChangeText={setNewMessage}
        onSend={sendMessage}
        onSendImage={handleSendImage}
        onSendFile={handleSendFile}
        onSendLocation={handleSendLocation}
        disabled={sending}
      />

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#000000',
    opacity: 0.6,
    alignSelf: 'flex-end',
    marginTop: 2,
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
  imageMessageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  fileMessageContainer: {
    marginBottom: 4,
  },
  locationMessageContainer: {
    marginBottom: 4,
  },
});

