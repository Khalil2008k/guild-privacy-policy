/**
 * Enhanced Message Bubble with WhatsApp Features
 * - Reactions
 * - Reply
 * - Forward
 * - Edit
 * - Delete for everyone
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import {
  Reply,
  Forward,
  Edit3,
  Trash2,
  MoreVertical,
  Copy,
  Share2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { EnhancedMessage, MessageReaction } from '../services/HybridChatService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  message: EnhancedMessage;
  isOwnMessage: boolean;
  theme: any;
  onReply: (message: EnhancedMessage) => void;
  onForward: (message: EnhancedMessage) => void;
  onEdit: (message: EnhancedMessage) => void;
  onDelete: (message: EnhancedMessage, deleteForEveryone: boolean) => void;
  onReact: (message: EnhancedMessage, emoji: string) => void;
  onCopy: (text: string) => void;
  repliedMessage?: EnhancedMessage;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function EnhancedMessageBubble({
  message,
  isOwnMessage,
  theme,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onReact,
  onCopy,
  repliedMessage,
}: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowActions(true);
  };

  const handleReaction = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReact(message, emoji);
    setShowReactions(false);
  };

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActions(false);
    action();
  };

  // Group reactions by emoji
  const groupedReactions: { [emoji: string]: MessageReaction[] } = {};
  if (message.reactions) {
    message.reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction);
    });
  }

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
    ]}>
      {/* Message Bubble */}
      <TouchableWithoutFeedback onLongPress={handleLongPress}>
        <View style={[
          styles.bubble,
          isOwnMessage
            ? [styles.ownBubble, { backgroundColor: theme.primary }]
            : [styles.otherBubble, { backgroundColor: theme.surface }],
          message.deletedForEveryone && styles.deletedBubble,
        ]}>
          {/* Forwarded Badge */}
          {message.forwarded && (
            <View style={styles.forwardedBadge}>
              <Forward size={12} color={isOwnMessage ? '#FFFFFF' : theme.textSecondary} />
              <Text style={[
                styles.forwardedText,
                { color: isOwnMessage ? '#FFFFFF' : theme.textSecondary },
              ]}>
                Forwarded
              </Text>
            </View>
          )}

          {/* Reply Preview */}
          {message.replyTo && repliedMessage && (
            <View style={[
              styles.replyPreview,
              { borderLeftColor: isOwnMessage ? '#FFFFFF' : theme.primary },
            ]}>
              <Text style={[
                styles.replyName,
                { color: isOwnMessage ? '#FFFFFF' : theme.textPrimary },
              ]}>
                {repliedMessage.senderName}
              </Text>
              <Text
                style={[
                  styles.replyText,
                  { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                ]}
                numberOfLines={1}
              >
                {repliedMessage.text}
              </Text>
            </View>
          )}

          {/* Message Content */}
          {!message.deletedForEveryone ? (
            <>
              {/* Image */}
              {/* COMMENT: PRODUCTION HARDENING - Task 4.9 - Use OptimizedImage for message images */}
              {message.fileType?.startsWith('image/') && message.fileUrl && (
                <OptimizedImage
                  source={{ uri: message.fileUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                  compression={{ maxWidth: 800, maxHeight: 800, quality: 0.85 }}
                />
              )}

              {/* Text */}
              {message.text && (
                <Text style={[
                  styles.messageText,
                  { color: isOwnMessage ? '#FFFFFF' : theme.textPrimary },
                ]}>
                  {message.text}
                </Text>
              )}

              {/* File */}
              {message.fileType && !message.fileType.startsWith('image/') && (
                <View style={styles.fileContainer}>
                  <Text style={[
                    styles.fileName,
                    { color: isOwnMessage ? '#FFFFFF' : theme.textPrimary },
                  ]}>
                    📎 {message.fileName || 'File'}
                  </Text>
                </View>
              )}

              {/* Location */}
              {message.location && (
                <View style={styles.locationContainer}>
                  <Text style={[
                    styles.locationText,
                    { color: isOwnMessage ? '#FFFFFF' : theme.textPrimary },
                  ]}>
                    📍 {message.location.address || 'Location'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={[
              styles.deletedText,
              { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
            ]}>
              🚫 This message was deleted
            </Text>
          )}

          {/* Timestamp and Status */}
          <View style={styles.footer}>
            {message.editedAt && (
              <Text style={[
                styles.editedText,
                { color: isOwnMessage ? 'rgba(255,255,255,0.6)' : theme.textSecondary },
              ]}>
                edited
              </Text>
            )}
            <Text style={[
              styles.timestamp,
              { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
            ]}>
              {formatTime(message.timestamp)}
            </Text>
            {isOwnMessage && (
              <Text style={styles.readStatus}>
                {message.read ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Reactions */}
      {Object.keys(groupedReactions).length > 0 && (
        <View style={[
          styles.reactionsContainer,
          isOwnMessage ? styles.reactionsRight : styles.reactionsLeft,
        ]}>
          {Object.entries(groupedReactions).map(([emoji, reactions]) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.reactionBubble, { backgroundColor: theme.surface }]}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {reactions.length > 1 && (
                <Text style={[styles.reactionCount, { color: theme.textSecondary }]}>
                  {reactions.length}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Reactions Modal */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReactions(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.reactionsModal, { backgroundColor: theme.surface }]}>
              {QUICK_REACTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.quickReaction}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Actions Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowActions(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.actionsModal, { backgroundColor: theme.surface }]}>
              {/* React */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setShowActions(false);
                  setShowReactions(true);
                }}
              >
                <Text style={styles.actionEmoji}>😊</Text>
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                  React
                </Text>
              </TouchableOpacity>

              {/* Reply */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction(() => onReply(message))}
              >
                <Reply size={20} color={theme.textPrimary} />
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                  Reply
                </Text>
              </TouchableOpacity>

              {/* Forward */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction(() => onForward(message))}
              >
                <Forward size={20} color={theme.textPrimary} />
                <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                  Forward
                </Text>
              </TouchableOpacity>

              {/* Copy */}
              {message.text && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAction(() => onCopy(message.text || ''))}
                >
                  <Copy size={20} color={theme.textPrimary} />
                  <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                    Copy
                  </Text>
                </TouchableOpacity>
              )}

              {/* Edit (own messages only) */}
              {isOwnMessage && !message.deletedForEveryone && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleAction(() => onEdit(message))}
                >
                  <Edit3 size={20} color={theme.textPrimary} />
                  <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              )}

              {/* Delete */}
              {isOwnMessage && !message.deletedForEveryone && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(() => onDelete(message, false))}
                  >
                    <Trash2 size={20} color={theme.error} />
                    <Text style={[styles.actionText, { color: theme.error }]}>
                      Delete for me
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction(() => onDelete(message, true))}
                  >
                    <Trash2 size={20} color={theme.error} />
                    <Text style={[styles.actionText, { color: theme.error }]}>
                      Delete for everyone
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

function formatTime(timestamp: any): string {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  deletedBubble: {
    opacity: 0.6,
  },
  forwardedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  forwardedText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
  },
  messageImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  fileContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  fileName: {
    fontSize: 14,
  },
  locationContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  locationText: {
    fontSize: 14,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  editedText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
  },
  readStatus: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  reactionsRight: {
    justifyContent: 'flex-end',
  },
  reactionsLeft: {
    justifyContent: 'flex-start',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsModal: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickReaction: {
    padding: 8,
  },
  quickReactionEmoji: {
    fontSize: 28,
  },
  actionsModal: {
    width: SCREEN_WIDTH * 0.7,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});








