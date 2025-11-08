/**
 * Link Preview Component
 * 
 * Displays a preview card for URLs in messages
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { LinkPreviewData } from '../utils/linkPreview';

interface LinkPreviewProps {
  preview: LinkPreviewData;
  isOwnMessage?: boolean;
}

export function LinkPreview({ preview, isOwnMessage = false }: LinkPreviewProps) {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  const handlePress = async () => {
    try {
      const canOpen = await Linking.canOpenURL(preview.url);
      if (canOpen) {
        await Linking.openURL(preview.url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.1)' : theme.background,
          borderColor: theme.border,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {preview.image && (
        <Image
          source={{ uri: preview.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          {preview.favicon && (
            <Image
              source={{ uri: preview.favicon }}
              style={styles.favicon}
              resizeMode="contain"
            />
          )}
          <Text
            style={[styles.siteName, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {preview.siteName || new URL(preview.url).hostname}
          </Text>
          <ExternalLink size={14} color={theme.textSecondary} />
        </View>

        {preview.title && (
          <Text
            style={[styles.title, { color: isOwnMessage ? '#000000' : theme.textPrimary }]}
            numberOfLines={2}
          >
            {preview.title}
          </Text>
        )}

        {preview.description && (
          <Text
            style={[styles.description, { color: isOwnMessage ? 'rgba(0,0,0,0.7)' : theme.textSecondary }]}
            numberOfLines={2}
          >
            {preview.description}
          </Text>
        )}

        <Text
          style={[styles.url, { color: theme.primary }]}
          numberOfLines={1}
        >
          {preview.url}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  content: {
    padding: 12,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  favicon: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  siteName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  url: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});







