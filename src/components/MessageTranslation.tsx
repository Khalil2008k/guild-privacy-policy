/**
 * Message Translation Component
 * 
 * Displays translated message text with auto-detect and manual language selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Languages, Globe, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { translateMessage, detectLanguage } from '../services/translationService';

interface MessageTranslationProps {
  originalText: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  isOwnMessage?: boolean;
  compact?: boolean;
}

export function MessageTranslation({
  originalText,
  sourceLanguage,
  targetLanguage,
  isOwnMessage = false,
  compact = false,
}: MessageTranslationProps) {
  const { theme } = useTheme();
  const { isRTL, locale } = useI18n();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(sourceLanguage || null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect language on mount if not provided
  useEffect(() => {
    if (!sourceLanguage && originalText) {
      detectLanguage(originalText).then((lang) => {
        setDetectedLanguage(lang);
      }).catch(() => {
        // Silent fail - user can still manually translate
      });
    }
  }, [originalText, sourceLanguage]);

  // Auto-translate if language is different from user's locale
  useEffect(() => {
    if (!detectedLanguage || !originalText || !locale) return;
    
    const userLang = (locale || 'en').split('-')[0]; // Extract base language (e.g., 'en' from 'en-US')
    const detectedLang = (detectedLanguage || 'en').split('-')[0];
    
    // Auto-translate if languages differ and target language matches user locale
    if (detectedLang !== userLang && targetLanguage === userLang) {
      handleTranslate();
    }
  }, [detectedLanguage, targetLanguage, locale]);

  const handleTranslate = async () => {
    if (!originalText || isTranslating) return;

    setIsTranslating(true);
    setError(null);

    try {
      const targetLang = targetLanguage || (locale ? locale.split('-')[0] : 'en');
      const result = await translateMessage(originalText, detectedLanguage || 'auto', targetLang);
      
      setTranslatedText(result.translatedText);
      setDetectedLanguage(result.detectedLanguage || detectedLanguage);
      setShowTranslation(true);
    } catch (err: any) {
      setError(err.message || 'Translation failed');
      setTranslatedText(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggle = () => {
    if (translatedText) {
      setShowTranslation(!showTranslation);
    } else {
      handleTranslate();
    }
  };

  if (!originalText || originalText.trim().length === 0) {
    return null;
  }

  const displayText = showTranslation && translatedText ? translatedText : originalText;

  if (compact) {
    // Globe icon removed per user request
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.translationContainer, { backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.05)' : theme.surface }]}>
        {showTranslation && translatedText ? (
          <>
            <Text
              style={[
                styles.translatedText,
                {
                  color: isOwnMessage ? '#000000' : theme.textPrimary,
                },
              ]}
            >
              {translatedText}
            </Text>
            <View style={styles.translationFooter}>
              <Text
                style={[
                  styles.originalTextHint,
                  {
                    color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary,
                  },
                ]}
              >
                {isRTL ? 'النص الأصلي' : 'Original'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowTranslation(false)}
                style={styles.toggleButton}
              >
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color: isOwnMessage ? '#000000' : theme.primary,
                    },
                  ]}
                >
                  {isRTL ? 'عرض النص الأصلي' : 'Show original'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text
              style={[
                styles.originalText,
                {
                  color: isOwnMessage ? '#000000' : theme.textPrimary,
                },
              ]}
            >
              {originalText}
            </Text>
            {detectedLanguage && detectedLanguage !== (targetLanguage || (locale ? locale.split('-')[0] : 'en')) && (
              <View style={styles.translationFooter}>
                <Languages
                  size={12}
                  color={isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.detectedLanguage,
                    {
                      color: isOwnMessage ? 'rgba(0,0,0,0.6)' : theme.textSecondary,
                    },
                  ]}
                >
                  {detectedLanguage}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        onPress={handleTranslate}
        style={[
          styles.translateButton,
          {
            backgroundColor: isOwnMessage ? 'rgba(0,0,0,0.1)' : theme.primary + '20',
          },
        ]}
        disabled={isTranslating}
      >
        {isTranslating ? (
          <ActivityIndicator size={14} color={isOwnMessage ? '#000000' : theme.primary} />
        ) : (
          <>
            <Globe size={14} color={isOwnMessage ? '#000000' : theme.primary} />
            <Text
              style={[
                styles.translateButtonText,
                {
                  color: isOwnMessage ? '#000000' : theme.primary,
                },
              ]}
            >
              {isRTL ? 'ترجمة' : 'Translate'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 6,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  translationContainer: {
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  translatedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  originalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  originalTextHint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  translationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  detectedLanguage: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    alignSelf: 'flex-start',
  },
  translateButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  toggleButton: {
    padding: 4,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
});

