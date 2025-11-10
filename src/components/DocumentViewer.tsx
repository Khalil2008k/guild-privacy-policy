import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, Download, FileText } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { CustomAlertService } from '../services/CustomAlertService';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DocumentViewerProps {
  visible: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: 'pdf' | 'doc' | 'docx';
}

export function DocumentViewer({
  visible,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: DocumentViewerProps) {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      logger.debug('DocumentViewer: Opened', { fileName, fileType, fileUrl: fileUrl?.substring(0, 100) });
    } else {
      setLoading(false);
      setError(null);
    }
  }, [visible, fileName, fileType, fileUrl]);

  // State for local file path (after download)
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  
  // Download file to local storage first (for authenticated URLs)
  useEffect(() => {
    if (visible && fileUrl && !localFileUri) {
      const downloadAndCache = async () => {
        try {
          setLoading(true);
          logger.debug('DocumentViewer: Downloading file to cache', { fileUrl: fileUrl.substring(0, 100) });
          
          // Get cache directory
          const cacheDir = FileSystem.cacheDirectory;
          if (!cacheDir) {
            throw new Error('Cache directory not available');
          }
          
          // Create safe filename
          const safeFilename = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const localUri = `${cacheDir}${safeFilename}`;
          
          // Download file
          const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri);
          
          if (downloadResult.status === 200) {
            logger.debug('DocumentViewer: File downloaded successfully', { localUri });
            setLocalFileUri(localUri);
          } else {
            throw new Error(`Download failed with status: ${downloadResult.status}`);
          }
        } catch (error: any) {
          logger.error('DocumentViewer: Error downloading file:', error);
          // Continue with direct URL if download fails
          setLocalFileUri(null);
        } finally {
          setLoading(false);
        }
      };
      
      downloadAndCache();
    } else if (!visible) {
      // Clear local file when modal closes
      setLocalFileUri(null);
    }
  }, [visible, fileUrl, fileName, localFileUri]);

  // Generate viewer URL based on file type
  const getViewerUrl = () => {
    if (!fileUrl) {
      logger.error('DocumentViewer: No file URL provided');
      return '';
    }
    
    // Use local file if available, otherwise use direct URL
    const urlToUse = localFileUri || fileUrl;
    
    logger.debug('DocumentViewer: Getting viewer URL', { fileType, usingLocal: !!localFileUri, url: urlToUse.substring(0, 100) });
    
    if (fileType === 'pdf') {
      // For PDF, try direct URL first (works better with local files)
      // If using remote URL, try Google Docs Viewer as fallback
      if (localFileUri) {
        // Local file - use direct URL (WebView can render local PDFs)
        return `file://${localFileUri}`;
      } else {
        // Remote URL - try Google Docs Viewer
        return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      }
    } else if (fileType === 'doc' || fileType === 'docx') {
      // For DOC/DOCX, use Google Docs Viewer
      // Note: Google Docs Viewer requires publicly accessible URLs
      // If the URL requires authentication, it may not work
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    return urlToUse;
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Show loading message
      CustomAlertService.showInfo(
        isRTL ? 'جاري التنزيل' : 'Downloading',
        isRTL ? 'جاري تنزيل الملف...' : 'Downloading file...'
      );

      // Get document directory
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!docDir) {
        throw new Error('Document directory not available');
      }

      // Create safe filename
      const safeFilename = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileUri = `${docDir}${safeFilename}`;

      // Download file
      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);

      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri);
        } else {
          // Fallback: Open with system default app
          const canOpen = await Linking.canOpenURL(fileUri);
          if (canOpen) {
            await Linking.openURL(fileUri);
          } else {
            CustomAlertService.showInfo(
              isRTL ? 'تم التنزيل' : 'Downloaded',
              isRTL ? `تم حفظ الملف في: ${fileUri}` : `File saved to: ${fileUri}`
            );
          }
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error: any) {
      logger.error('Error downloading document:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل تنزيل الملف' : 'Failed to download file'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInBrowser = async () => {
    try {
      const canOpen = await Linking.canOpenURL(fileUrl);
      if (canOpen) {
        await Linking.openURL(fileUrl);
      } else {
        CustomAlertService.showError(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'لا يمكن فتح الملف' : 'Cannot open file'
        );
      }
    } catch (error: any) {
      logger.error('Error opening file in browser:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل فتح الملف' : 'Failed to open file'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <FileText size={24} color={theme.primary} />
              <Text
                style={[styles.fileName, { color: theme.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {fileName}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: theme.surface }]}
                onPress={handleDownload}
                disabled={loading}
              >
                <Download size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: theme.surface }]}
                onPress={onClose}
              >
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* WebView Container */}
          <View style={styles.webViewContainer}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  {isRTL ? 'جاري تحميل المستند...' : 'Loading document...'}
                </Text>
              </View>
            )}
            
            {error ? (
              <View style={styles.errorContainer}>
                <FileText size={48} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: theme.primary }]}
                  onPress={handleOpenInBrowser}
                >
                  <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                    {isRTL ? 'فتح في المتصفح' : 'Open in Browser'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : !loading && getViewerUrl() ? (
              <WebView
                key={localFileUri || fileUrl} // Force remount when file changes
                source={{ uri: getViewerUrl() }}
                style={styles.webView}
                onLoadStart={() => {
                  setLoading(true);
                  setError(null);
                  const viewerUrl = getViewerUrl();
                  logger.debug('DocumentViewer: Loading started', { url: viewerUrl?.substring(0, 150) });
                }}
                onLoadEnd={() => {
                  setLoading(false);
                  logger.debug('DocumentViewer: Loading ended');
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  logger.error('WebView error:', nativeEvent);
                  setError(nativeEvent.description || 'Failed to load document. The file may require authentication or be inaccessible.');
                  setLoading(false);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  logger.error('WebView HTTP error:', nativeEvent);
                  setError(`HTTP Error: ${nativeEvent.statusCode}. The file may require authentication.`);
                  setLoading(false);
                }}
                onMessage={(event) => {
                  logger.debug('WebView message:', event.nativeEvent.data);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                mixedContentMode="always"
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                // Allow navigation to handle redirects
                onShouldStartLoadWithRequest={(request) => {
                  logger.debug('WebView navigation request:', request.url?.substring(0, 100));
                  return true;
                }}
                // Add user agent to help with compatibility
                userAgent={Platform.select({
                  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                  android: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                  default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                })}
                renderError={(errorDomain, errorCode, errorDesc) => {
                  logger.error('WebView render error:', { errorDomain, errorCode, errorDesc });
                  setError(`Failed to render document: ${errorDesc || 'Unknown error'}. Try opening in browser.`);
                  setLoading(false);
                  return (
                    <View style={styles.errorContainer}>
                      <FileText size={48} color={theme.error} />
                      <Text style={[styles.errorText, { color: theme.error }]}>
                        {errorDesc || 'Failed to load document'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.primary }]}
                        onPress={handleOpenInBrowser}
                      >
                        <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                          {isRTL ? 'فتح في المتصفح' : 'Open in Browser'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.9,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

