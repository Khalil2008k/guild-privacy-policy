/**
 * Chat Context - Real-time chat state management
 * Integrates Socket.IO with Firebase for production-grade messaging
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { chatService } from '../services/chatService';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlertService } from '../services/CustomAlertService';

interface Message {
  id: string;
  tempId?: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
  attachments?: string[];
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  readBy: string[];
}

interface Chat {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  jobId?: string;
  guildId?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: number;
  isActive: boolean;
}

interface TypingStatus {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

interface ChatContextValue {
  // State
  chats: Chat[];
  currentChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  isConnected: boolean;
  unreadCount: number;
  
  // Actions
  sendMessage: (chatId: string, text: string, type?: Message['type'], attachments?: string[]) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createDirectChat: (recipientId: string) => Promise<Chat>;
  createJobChat: (jobId: string, participants: string[]) => Promise<Chat>;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  loadMoreMessages: (chatId: string) => Promise<void>;
  retryMessage: (chatId: string, messageId: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  
  // Voice calls
  initiateCall: (chatId: string, recipientId: string) => void;
  acceptCall: (roomId: string) => void;
  rejectCall: (roomId: string) => void;
  endCall: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const messageQueue = useRef<Message[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      initializeSocket();
      loadChats();
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  /**
   * Initialize socket connection and listeners
   */
  const initializeSocket = async () => {
    await socketService.connect();
    
    // Connection events
    socketService.on('connected', () => {
      setIsConnected(true);
      processMessageQueue();
    });
    
    socketService.on('disconnected', () => {
      setIsConnected(false);
    });
    
    // Chat events
    socketService.on('chat:message:new', handleNewMessage);
    socketService.on('chat:message:sent', handleMessageSent);
    socketService.on('chat:message:optimistic', handleOptimisticMessage);
    socketService.on('chat:message:delivered', handleMessageDelivered);
    socketService.on('chat:message:read', handleMessageRead);
    socketService.on('chat:typing:update', handleTypingUpdate);
    socketService.on('chat:messages:history', handleMessagesHistory);
    socketService.on('chat:error', handleChatError);
    
    // Notification events
    socketService.on('notification:count', ({ count }) => {
      setUnreadCount(count);
    });
  };

  /**
   * Load user's chats
   */
  const loadChats = async () => {
    try {
      const userChats = await chatService.getUserChats();
      setChats(userChats);
      
      // Calculate total unread count
      const total = userChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  /**
   * Handle new incoming message
   */
  const handleNewMessage = (data: any) => {
    const { chatId, message } = data;
    
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
    
    // Update chat's last message
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? {
            ...chat,
            lastMessage: {
              text: message.text,
              senderId: message.senderId,
              timestamp: new Date(message.createdAt)
            },
            unreadCount: chat.unreadCount + 1
          }
        : chat
    ));
    
    // Show notification if not in current chat
    if (currentChat?.id !== chatId) {
      showNotification(message);
    }
  };

  /**
   * Handle message sent confirmation
   */
  const handleMessageSent = (data: any) => {
    const { tempId, message } = data;
    
    setMessages(prev => {
      const chatMessages = prev[message.chatId] || [];
      return {
        ...prev,
        [message.chatId]: chatMessages.map(msg => 
          msg.tempId === tempId 
            ? { ...message, tempId: undefined, status: 'sent' }
            : msg
        )
      };
    });
  };

  /**
   * Handle optimistic message update
   */
  const handleOptimisticMessage = (data: any) => {
    const { tempId, chatId, message } = data;
    
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), { ...message, tempId, status: 'sending' }]
    }));
  };

  /**
   * Handle message delivered
   */
  const handleMessageDelivered = (data: any) => {
    const { messageId, status, userId } = data;
    
    // Update message status
    Object.keys(messages).forEach(chatId => {
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      }));
    });
  };

  /**
   * Handle messages read
   */
  const handleMessageRead = (data: any) => {
    const { chatId, userId } = data;
    
    setMessages(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(msg => ({
        ...msg,
        readBy: msg.readBy.includes(userId) ? msg.readBy : [...msg.readBy, userId]
      }))
    }));
  };

  /**
   * Handle typing status update
   */
  const handleTypingUpdate = (data: TypingStatus) => {
    const { chatId, userId, isTyping } = data;
    
    setTypingUsers(prev => {
      const chatTypingUsers = prev[chatId] || [];
      
      if (isTyping && !chatTypingUsers.includes(userId)) {
        return { ...prev, [chatId]: [...chatTypingUsers, userId] };
      } else if (!isTyping && chatTypingUsers.includes(userId)) {
        return { ...prev, [chatId]: chatTypingUsers.filter(id => id !== userId) };
      }
      
      return prev;
    });
  };

  /**
   * Handle chat messages history
   */
  const handleMessagesHistory = (data: any) => {
    const { chatId, messages: historyMessages } = data;
    
    setMessages(prev => ({
      ...prev,
      [chatId]: historyMessages
    }));
  };

  /**
   * Handle chat error
   */
  const handleChatError = (error: any) => {
    console.error('Chat error:', error);
    CustomAlertService.showError('Chat Error', error.error || 'An error occurred');
  };

  /**
   * Send a message
   */
  const sendMessage = async (
    chatId: string, 
    text: string, 
    type: Message['type'] = 'TEXT',
    attachments?: string[]
  ) => {
    if (!user) return;
    
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage: Message = {
      id: tempId,
      tempId,
      chatId,
      senderId: user.uid,
      text,
      type,
      attachments,
      status: 'sending',
      createdAt: new Date(),
      readBy: [user.uid]
    };
    
    // Add to queue if offline
    if (!isConnected) {
      messageQueue.current.push(tempMessage);
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), tempMessage]
      }));
      return;
    }
    
    // Add optimistic message to UI
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), tempMessage]
    }));

    // Send via socket
    socketService.sendMessage(chatId, { text, type, attachments });

    // Auto-update status after 3 seconds if no response
    setTimeout(() => {
      setMessages(prev => {
        const chatMessages = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: chatMessages.map(msg =>
            msg.tempId === tempId
              ? { ...msg, tempId: undefined, status: 'sent' }
              : msg
          )
        };
      });
    }, 3000);
  };

  /**
   * Mark messages as read
   */
  const markAsRead = async (chatId: string) => {
    socketService.markMessagesAsRead(chatId);
    
    // Update local state
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ));
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - (chats.find(c => c.id === chatId)?.unreadCount || 0)));
  };

  /**
   * Create direct chat
   */
  const createDirectChat = async (recipientId: string): Promise<Chat> => {
    try {
      const chat = await chatService.createDirectChat(recipientId);
      setChats(prev => [...prev, chat]);
      return chat;
    } catch (error) {
      console.error('Error creating direct chat:', error);
      throw error;
    }
  };

  /**
   * Create job chat
   */
  const createJobChat = async (jobId: string, participants: string[]): Promise<Chat> => {
    try {
      const chat = await chatService.createJobChat(jobId, participants);
      setChats(prev => [...prev, chat]);
      return chat;
    } catch (error) {
      console.error('Error creating job chat:', error);
      throw error;
    }
  };

  /**
   * Join chat room
   */
  const joinChat = (chatId: string) => {
    socketService.joinChat(chatId);
    setCurrentChat(chats.find(c => c.id === chatId) || null);
  };

  /**
   * Leave chat room
   */
  const leaveChat = (chatId: string) => {
    socketService.leaveChat(chatId);
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  /**
   * Start typing indicator
   */
  const startTyping = (chatId: string) => {
    socketService.startTyping(chatId);
    
    // Clear existing timeout
    if (typingTimeouts.current[chatId]) {
      clearTimeout(typingTimeouts.current[chatId]);
    }
    
    // Auto-stop after 3 seconds
    typingTimeouts.current[chatId] = setTimeout(() => {
      stopTyping(chatId);
    }, 3000);
  };

  /**
   * Stop typing indicator
   */
  const stopTyping = (chatId: string) => {
    socketService.stopTyping(chatId);
    
    if (typingTimeouts.current[chatId]) {
      clearTimeout(typingTimeouts.current[chatId]);
      delete typingTimeouts.current[chatId];
    }
  };

  /**
   * Load more messages
   */
  const loadMoreMessages = async (chatId: string) => {
    try {
      const currentMessages = messages[chatId] || [];
      const lastMessageId = currentMessages[0]?.id;
      
      const olderMessages = await chatService.getChatMessages(chatId, 50, lastMessageId);
      
      setMessages(prev => ({
        ...prev,
        [chatId]: [...olderMessages, ...currentMessages]
      }));
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  /**
   * Retry failed message
   */
  const retryMessage = async (chatId: string, messageId: string) => {
    const message = messages[chatId]?.find(m => m.id === messageId);
    if (!message) return;
    
    // Remove failed message
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId].filter(m => m.id !== messageId)
    }));
    
    // Resend
    await sendMessage(chatId, message.text, message.type, message.attachments);
  };

  /**
   * Delete message (local only for now)
   */
  const deleteMessage = async (chatId: string, messageId: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId].filter(m => m.id !== messageId)
    }));
  };

  /**
   * Process queued messages
   */
  const processMessageQueue = () => {
    while (messageQueue.current.length > 0) {
      const message = messageQueue.current.shift()!;
      socketService.sendMessage(message.chatId, {
        text: message.text,
        type: message.type,
        attachments: message.attachments
      });
    }
  };

  /**
   * Show notification for new message
   */
  const showNotification = (message: Message) => {
    // This would integrate with push notifications
    console.log('New message notification:', message);
  };

  // Voice call methods
  const initiateCall = (chatId: string, recipientId: string) => {
    socketService.initiateCall(chatId, recipientId);
  };

  const acceptCall = (roomId: string) => {
    socketService.acceptCall(roomId);
  };

  const rejectCall = (roomId: string) => {
    socketService.rejectCall(roomId);
  };

  const endCall = (roomId: string) => {
    socketService.endCall(roomId);
  };

  const value: ChatContextValue = {
    // State
    chats,
    currentChat,
    messages,
    typingUsers,
    isConnected,
    unreadCount,
    
    // Actions
    sendMessage,
    markAsRead,
    createDirectChat,
    createJobChat,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    loadMoreMessages,
    retryMessage,
    deleteMessage,
    
    // Voice calls
    initiateCall,
    acceptCall,
    rejectCall,
    endCall
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

