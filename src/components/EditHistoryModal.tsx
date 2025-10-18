import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { X, History, Clock } from 'lucide-react-native';

interface EditHistoryItem {
  text: string;
  editedAt: any;
}

interface EditHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  originalText: string;
  editHistory: EditHistoryItem[];
  currentText: string;
  createdAt: any;
}

export function EditHistoryModal({
  visible,
  onClose,
  originalText,
  editHistory,
  currentText,
  createdAt,
}: EditHistoryModalProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString(isRTL ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allVersions = [
    {
      text: originalText,
      timestamp: createdAt,
      label: isRTL ? 'النص الأصلي' : 'Original',
      isOriginal: true,
    },
    ...editHistory.map((item, index) => ({
      text: item.text,
      timestamp: item.editedAt,
      label: `${isRTL ? 'تعديل' : 'Edit'} ${index + 1}`,
      isOriginal: false,
    })),
    {
      text: currentText,
      timestamp: editHistory[editHistory.length - 1]?.editedAt,
      label: isRTL ? 'النسخة الحالية' : 'Current',
      isOriginal: false,
      isCurrent: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.surface }]}>
            <View style={styles.headerLeft}>
              <History size={24} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {isRTL ? 'سجل التعديلات' : 'Edit History'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.infoCard}>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {isRTL
                  ? `تم تعديل هذه الرسالة ${editHistory.length} ${
                      editHistory.length === 1 ? 'مرة' : 'مرات'
                    }`
                  : `This message has been edited ${editHistory.length} time${
                      editHistory.length === 1 ? '' : 's'
                    }`}
              </Text>
            </View>

            {allVersions.map((version, index) => (
              <View
                key={index}
                style={[
                  styles.versionCard,
                  {
                    backgroundColor: theme.surface,
                    borderLeftColor: version.isCurrent
                      ? theme.primary
                      : version.isOriginal
                      ? theme.textSecondary
                      : theme.border,
                  },
                ]}
              >
                {/* Version Header */}
                <View style={styles.versionHeader}>
                  <View
                    style={[
                      styles.versionBadge,
                      {
                        backgroundColor: version.isCurrent
                          ? theme.primary + '20'
                          : version.isOriginal
                          ? theme.textSecondary + '20'
                          : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.versionLabel,
                        {
                          color: version.isCurrent
                            ? theme.primary
                            : version.isOriginal
                            ? theme.textSecondary
                            : theme.textPrimary,
                        },
                      ]}
                    >
                      {version.label}
                    </Text>
                  </View>
                  <View style={styles.timestampContainer}>
                    <Clock
                      size={14}
                      color={theme.textSecondary}
                      style={styles.clockIcon}
                    />
                    <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                      {formatTimestamp(version.timestamp)}
                    </Text>
                  </View>
                </View>

                {/* Version Text */}
                <Text
                  style={[
                    styles.versionText,
                    {
                      color: theme.textPrimary,
                      fontWeight: version.isCurrent ? '500' : '400',
                    },
                  ]}
                >
                  {version.text}
                </Text>

                {/* Character Count */}
                <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                  {version.text.length} {isRTL ? 'حرف' : 'characters'}
                </Text>
              </View>
            ))}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  versionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    marginRight: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  versionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 20,
  },
});






