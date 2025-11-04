/**
 * Enterprise-Grade Chat Data Models
 * Complete type definitions for advanced chat features
 */

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type MessageType = 'text' | 'voice' | 'image' | 'video' | 'file' | 'location' | 'contact';
export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type ChatType = 'direct' | 'group' | 'channel' | 'bot';
export type Category = 'work' | 'family' | 'friends' | 'other';

export interface PresenceData {
  status: PresenceStatus;
  lastSeen: Date;
  isTyping: boolean;
  typingPreview?: string;
}

export interface MessageMetadata {
  duration?: number; // for voice/video in seconds
  fileSize?: number; // in bytes
  fileName?: string;
  thumbnail?: string; // URL or base64
  mimeType?: string;
  width?: number; // for images/videos
  height?: number; // for images/videos
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface LastMessage {
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
  type: MessageType;
  metadata?: MessageMetadata;
  reactions?: Reaction[];
  mentions?: string[];
  links?: string[];
  isEdited: boolean;
  isForwarded: boolean;
  replyTo?: string; // message ID
}

export interface ChatCounts {
  unread: number;
  mentions: number;
  total: number;
  media: number;
  files: number;
  replies: number;
}

export interface ChatSettings {
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  customColor?: string;
  customEmoji?: string;
  notificationSound?: string;
  priority: Priority;
}

export interface SecuritySettings {
  isEncrypted: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  selfDestructTimer?: number; // in seconds
  screenshotProtection: boolean;
}

export interface ChatMetadata {
  category?: Category;
  tags?: string[];
  folder?: string;
  streak?: number; // days of continuous chatting
  avgResponseTime?: number; // in seconds
  lastActivity?: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SyncStatus {
  deliveryStatus: DeliveryStatus;
  networkQuality: NetworkQuality;
  isSyncing: boolean;
  lastSyncTime?: Date;
}

export interface EnhancedChat {
  // Core
  id: string;
  name: string;
  avatar?: string;
  type: ChatType;
  
  // Presence
  presence: PresenceData;
  
  // Message
  lastMessage?: LastMessage;
  
  // Counts
  counts: ChatCounts;
  
  // Settings
  settings: ChatSettings;
  
  // Security
  security: SecuritySettings;
  
  // Metadata
  metadata: ChatMetadata;
  
  // Sync
  sync: SyncStatus;
  
  // Participants (for groups)
  participants?: string[];
  participantCount?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Helper type for chat transformations
export interface ChatTransformOptions {
  userId: string;
  currentTime: Date;
  timezone: string;
}

// AI Summary types
export interface AISummary {
  text: string;
  confidence: number;
  keywords: string[];
}

// Typing indicator
export interface TypingIndicator {
  userId: string;
  userName: string;
  chatId: string;
  startedAt: Date;
  preview?: string;
}

// Read receipt
export interface ReadReceipt {
  userId: string;
  userName: string;
  readAt: Date;
}











