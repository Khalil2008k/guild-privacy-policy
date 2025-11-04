/**
 * Chat Export Modal Component
 * 
 * Allows users to export chat messages in various formats (PDF, text) with optional media
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FileText, Download, X, Check, Image as ImageIcon, File, FileDown } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { chatExportService } from '../services/chatExportService';

export type ExportFormat = 'text' | 'pdf';
export type ExportOptions = {
  includeMedia: boolean;
  includeTimestamps: boolean;
  includeUserNames: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
};

interface ChatExportModalProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  chatName?: string;
  messages: any[];
  onExportComplete?: (format: ExportFormat) => void;
}

export function ChatExportModal({
  visible,
  onClose,
  chatId,
  chatName = 'Chat',
  messages,
  onExportComplete,
}: ChatExportModalProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('text');
  const [options, setOptions] = useState<ExportOptions>({
    includeMedia: false,
    includeTimestamps: true,
    includeUserNames: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const handleExport = async () => {
    if (!chatId || messages.length === 0) return;

    setIsExporting(true);
    setExportProgress(isRTL ? 'جاري التصدير...' : 'Exporting...');

    try {
      if (selectedFormat === 'text') {
        await chatExportService.exportAsText(chatId, chatName, messages, options);
      } else if (selectedFormat === 'pdf') {
        await chatExportService.exportAsPDF(chatId, chatName, messages, options);
      }

      setExportProgress(isRTL ? 'تم التصدير بنجاح!' : 'Export completed!');
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress('');
        onExportComplete?.(selectedFormat);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error exporting chat:', error);
      setExportProgress(isRTL ? 'فشل التصدير' : 'Export failed');
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress('');
      }, 2000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <FileDown size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'تصدير المحادثة' : 'Export Chat'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Export Format Selection */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {isRTL ? 'تنسيق التصدير' : 'Export Format'}
            </Text>
            <View style={styles.formatContainer}>
              <TouchableOpacity
                style={[
                  styles.formatOption,
                  {
                    backgroundColor: selectedFormat === 'text' ? theme.primary + '20' : theme.background,
                    borderColor: selectedFormat === 'text' ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedFormat('text')}
              >
                <FileText size={24} color={selectedFormat === 'text' ? theme.primary : theme.textSecondary} />
                <Text
                  style={[
                    styles.formatOptionText,
                    {
                      color: selectedFormat === 'text' ? theme.primary : theme.textPrimary,
                      fontWeight: selectedFormat === 'text' ? '600' : '400',
                    },
                  ]}
                >
                  {isRTL ? 'نص' : 'Text'}
                </Text>
                {selectedFormat === 'text' && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                    <Check size={16} color="#000000" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formatOption,
                  {
                    backgroundColor: selectedFormat === 'pdf' ? theme.primary + '20' : theme.background,
                    borderColor: selectedFormat === 'pdf' ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedFormat('pdf')}
              >
                <File size={24} color={selectedFormat === 'pdf' ? theme.primary : theme.textSecondary} />
                <Text
                  style={[
                    styles.formatOptionText,
                    {
                      color: selectedFormat === 'pdf' ? theme.primary : theme.textPrimary,
                      fontWeight: selectedFormat === 'pdf' ? '600' : '400',
                    },
                  ]}
                >
                  PDF
                </Text>
                {selectedFormat === 'pdf' && (
                  <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                    <Check size={16} color="#000000" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Export Options */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
              {isRTL ? 'خيارات التصدير' : 'Export Options'}
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setOptions({ ...options, includeTimestamps: !options.includeTimestamps })}
              >
                <View style={[styles.checkbox, { borderColor: options.includeTimestamps ? theme.primary : theme.border }]}>
                  {options.includeTimestamps && (
                    <View style={[styles.checkboxInner, { backgroundColor: theme.primary }]}>
                      <Check size={14} color="#000000" />
                    </View>
                  )}
                </View>
                <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                  {isRTL ? 'تضمين الطوابع الزمنية' : 'Include timestamps'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setOptions({ ...options, includeUserNames: !options.includeUserNames })}
              >
                <View style={[styles.checkbox, { borderColor: options.includeUserNames ? theme.primary : theme.border }]}>
                  {options.includeUserNames && (
                    <View style={[styles.checkboxInner, { backgroundColor: theme.primary }]}>
                      <Check size={14} color="#000000" />
                    </View>
                  )}
                </View>
                <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                  {isRTL ? 'تضمين أسماء المستخدمين' : 'Include user names'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setOptions({ ...options, includeMedia: !options.includeMedia })}
              >
                <View style={[styles.checkbox, { borderColor: options.includeMedia ? theme.primary : theme.border }]}>
                  {options.includeMedia && (
                    <View style={[styles.checkboxInner, { backgroundColor: theme.primary }]}>
                      <Check size={14} color="#000000" />
                    </View>
                  )}
                </View>
                <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                  {isRTL ? 'تضمين الوسائط (صور، ملفات)' : 'Include media (images, files)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Export Info */}
            <View style={[styles.infoContainer, { backgroundColor: theme.background }]}>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {isRTL 
                  ? `سيتم تصدير ${messages.length} رسالة في تنسيق ${selectedFormat === 'text' ? 'نص' : 'PDF'}`
                  : `Will export ${messages.length} messages in ${selectedFormat.toUpperCase()} format`
                }
              </Text>
            </View>

            {isExporting && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.progressText, { color: theme.textPrimary }]}>
                  {exportProgress}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.background }]}
              onPress={onClose}
              disabled={isExporting}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportButton,
                { backgroundColor: theme.primary },
                isExporting && styles.exportButtonDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting || messages.length === 0}
            >
              <Download size={20} color="#000000" />
              <Text style={[styles.exportButtonText, { color: '#000000' }]}>
                {isRTL ? 'تصدير' : 'Export'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 500,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formatOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    position: 'relative',
  },
  formatOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  infoContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

