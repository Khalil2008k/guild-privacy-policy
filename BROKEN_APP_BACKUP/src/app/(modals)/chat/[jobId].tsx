import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const FONT_FAMILY = 'Signika Negative SC';

export default function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();

  const mockMessages = [
    {
      id: '1',
      text: 'Hello! I\'m interested in this job.',
      sender: 'client',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      text: 'Great! I can start working on this project immediately.',
      sender: 'freelancer',
      timestamp: '10:32 AM'
    },
    {
      id: '3',
      text: 'Perfect! Let\'s discuss the details.',
      sender: 'client',
      timestamp: '10:35 AM'
    }
  ];

  const renderMessage = ({ item }: any) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'client' ? styles.clientMessage : styles.freelancerMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'client'
          ? [styles.clientBubble, { backgroundColor: theme.primary }]
          : [styles.freelancerBubble, { backgroundColor: theme.surfaceSecondary }]
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'client' ? { color: theme.surface } : { color: theme.text }
        ]}>
          {item.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
        {item.timestamp}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Ionicons name="person-outline" size={24} color={theme.primary} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>Job Chat</Text>
            <Text style={[styles.jobId, { color: theme.textSecondary }]}>Job #{jobId}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={mockMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceSecondary }]}>
          <Text style={[styles.inputText, { color: theme.textSecondary }]}>
            Type your message...
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="send" size={20} color={theme.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  jobId: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  clientMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  freelancerMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  clientBubble: {
    borderBottomRightRadius: 4,
  },
  freelancerBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
  },
  inputText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
