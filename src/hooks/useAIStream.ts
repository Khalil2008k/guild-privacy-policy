/**
 * useAIStream Hook
 * Hook for handling AI streaming responses via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';
import { auth } from '../config/firebase';

export interface AIStreamMessage {
  id: string;
  text: string;
  senderId: string;
  type: 'text' | 'ai' | 'streaming';
  confidenceScore?: number;
  isStreaming?: boolean;
}

export interface UseAIStreamReturn {
  messages: AIStreamMessage[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
}

export function useAIStream(chatId: string): UseAIStreamReturn {
  const [messages, setMessages] = useState<AIStreamMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const streamingMessageRef = useRef<AIStreamMessage | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !chatId || chatId.trim() === '') {
      return;
    }

    let socket: Socket | null = null;

    // Async function to initialize socket
    const initializeSocket = async () => {
      try {
        // Get backend URL from environment or use default
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://guild-yf7q.onrender.com';
        
        // Get auth token
        const token = await currentUser.getIdToken();
        
        // Connect to Socket.IO server
        socket = io(backendUrl, {
          transports: ['websocket', 'polling'],
          auth: {
            token: token
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
          logger.info('✅ AI Support WebSocket connected');
          setIsConnected(true);
          setError(null);

          // Join support chat room
          socket.emit('support:join', {
            chatId,
            userId: currentUser.uid
          });
        });

        socket.on('disconnect', () => {
          logger.info('❌ AI Support WebSocket disconnected');
          setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
          logger.error('❌ AI Support WebSocket connection error:', err);
          setError('Connection failed. Please try again.');
          setIsConnected(false);
        });

        // Support chat events
        socket.on('support:joined', (data: { chatId: string }) => {
          logger.info('✅ Joined support chat:', data.chatId);
        });

        socket.on('support:error', (data: { message: string }) => {
          logger.error('❌ Support chat error:', data.message);
          setError(data.message);
        });

        // Stream events
        socket.on('support:stream', (data: {
          type: 'stream' | 'complete' | 'error';
          data: string;
          confidenceScore?: number;
          messageId?: string;
        }) => {
          if (data.type === 'stream') {
            // Update streaming message
            setIsStreaming(true);
            
            if (!streamingMessageRef.current) {
              // Create new streaming message
              const newMessage: AIStreamMessage = {
                id: `streaming_${Date.now()}`,
                text: data.data,
                senderId: 'support_bot',
                type: 'streaming',
                confidenceScore: data.confidenceScore,
                isStreaming: true
              };
              
              streamingMessageRef.current = newMessage;
              setMessages(prev => [...prev, newMessage]);
            } else {
              // Append to existing streaming message
              streamingMessageRef.current.text += data.data;
              setMessages(prev => {
                const updated = [...prev];
                const index = updated.findIndex(m => m.id === streamingMessageRef.current?.id);
                if (index !== -1) {
                  updated[index] = { ...streamingMessageRef.current };
                }
                return updated;
              });
            }
          } else if (data.type === 'complete') {
            // Mark streaming as complete
            setIsStreaming(false);
            
            if (streamingMessageRef.current) {
              streamingMessageRef.current.isStreaming = false;
              streamingMessageRef.current.type = 'ai';
              if (data.messageId) {
                streamingMessageRef.current.id = data.messageId;
              }
              streamingMessageRef.current = null;
            }
          } else if (data.type === 'error') {
            setIsStreaming(false);
            setError(data.data);
            streamingMessageRef.current = null;
          }
        });

        // Message sent event
        socket.on('support:message:sent', (data: {
          messageId: string;
          senderId: string;
          text: string;
          type: string;
          confidenceScore?: number;
        }) => {
          const newMessage: AIStreamMessage = {
            id: data.messageId,
            text: data.text,
            senderId: data.senderId,
            type: data.senderId === 'support_bot' ? 'ai' : 'text',
            confidenceScore: data.confidenceScore
          };

          setMessages(prev => {
            // Remove streaming message if exists
            const filtered = prev.filter(m => m.id !== streamingMessageRef.current?.id);
            return [...filtered, newMessage];
          });

          streamingMessageRef.current = null;
        });

      } catch (error: any) {
        logger.error('Error initializing WebSocket:', error);
        setError('Connection failed. Please try again.');
        setIsConnected(false);
      }
    };

    // Initialize socket
    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, [chatId]);

  // Send message
  const sendMessage = useCallback((text: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !socketRef.current || !isConnected) {
      logger.warn('Cannot send message: not connected');
      return;
    }

    // Add user message to UI immediately (optimistic update)
    const userMessage: AIStreamMessage = {
      id: `user_${Date.now()}`,
      text,
      senderId: currentUser.uid,
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setError(null);

    // Send to server
    logger.info('📤 Sending message to AI Support', { chatId, text: text.substring(0, 50) });
    socketRef.current.emit('support:message', {
      chatId,
      userId: currentUser.uid,
      text
    });
  }, [chatId, isConnected]);

  return {
    messages,
    sendMessage,
    isConnected,
    isStreaming,
    error
  };
}

