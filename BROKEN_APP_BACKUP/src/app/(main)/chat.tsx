import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/contexts/I18nProvider';

const { width, height } = Dimensions.get('window');
const FONT_FAMILY = 'Signika Negative SC';

export default function ChatScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  // Mock chat data
  const chats = [
    {
      id: 1,
      name: 'John Smith',
      lastMessage: isRTL ? 'شكراً لتقديمك! نود تحديد موعد للمقابلة.' : 'Thanks for applying! We\'d like to schedule an interview.',
      time: isRTL ? 'منذ دقيقتين' : '2m ago',
      unread: 2,
      avatar: 'JS',
      online: true,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      lastMessage: isRTL ? 'ملفك الشخصي رائع! دعنا نناقش المشروع.' : 'Your portfolio looks great! Let\'s discuss the project.',
      time: isRTL ? 'منذ ساعة' : '1h ago',
      unread: 0,
      avatar: 'SJ',
      online: false,
    },
    {
      id: 3,
      name: 'Mike Chen',
      lastMessage: isRTL ? 'أتطلع للعمل معك!' : 'Looking forward to working with you!',
      time: isRTL ? 'منذ 3 ساعات' : '3h ago',
      unread: 1,
      avatar: 'MC',
      online: true,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "dark-content" : "dark-content"}
        backgroundColor={theme.primary}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: theme.primary }]}>
        <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
          {t('messages')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={[styles.content, { backgroundColor: isDarkMode ? '#111111' : theme.surface }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Spacing */}
        <View style={styles.topSpacer} />
        
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={[
              styles.chatItem,
              {
                backgroundColor: isDarkMode ? '#1b1b1b' : theme.surface,
                borderWidth: 1,
                borderColor: isDarkMode ? '#262626' : theme.border,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 12,
              }
            ]}
            onPress={() => router.push(`/(modals)/chat/${chat.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={[styles.avatarText, { color: theme.buttonText }]}>
                  {chat.avatar}
                </Text>
              </View>
              {chat.online && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={[styles.chatName, { color: theme.textPrimary }]}>
                  {chat.name}
                </Text>
                <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
                  {chat.time}
                </Text>
              </View>

              <Text
                style={[styles.lastMessage, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {chat.lastMessage}
              </Text>
            </View>

            {chat.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.unreadText, { color: '#000000' }]}>
                  {chat.unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#BCFF31',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  content: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: FONT_FAMILY,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  bottomSpacer: {
    height: 100,
  },
  topSpacer: {
    height: 20,
  },
});
