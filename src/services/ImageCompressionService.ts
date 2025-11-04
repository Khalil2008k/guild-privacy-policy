/**
 * Image Compression Service
 * Compress images before upload to save bandwidth and storage
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png';
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  size: number; // bytes
  originalSize: number; // bytes
  compressionRatio: number; // percentage
}

class ImageCompressionServiceClass {
  private readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'jpeg',
  };

  /**
   * Compress an image
   */
  async compressImage(
    uri: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    try {
      logger.debug('🖼️ Compressing image:', uri);

      // Get original file size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const originalSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      // Merge options with defaults
      const opts = { ...this.DEFAULT_OPTIONS, ...options };

      // Compress image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: opts.maxWidth,
              height: opts.maxHeight,
            },
          },
        ],
        {
          compress: opts.quality,
          format: opts.format === 'png' 
            ? ImageManipulator.SaveFormat.PNG 
            : ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Get compressed file size
      const compressedInfo = await FileSystem.getInfoAsync(manipResult.uri);
      const compressedSize = compressedInfo.exists && 'size' in compressedInfo 
        ? compressedInfo.size 
        : 0;

      const compressionRatio = originalSize > 0
        ? ((originalSize - compressedSize) / originalSize) * 100
        : 0;

      logger.debug(`✅ Compressed: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)} (${compressionRatio.toFixed(1)}% reduction)`);

      return {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        size: compressedSize,
        originalSize,
        compressionRatio,
      };
    } catch (error) {
      logger.error('Error compressing image:', error);
      throw error;
    }
  }

  /**
   * Compress multiple images in parallel
   */
  async compressImages(
    uris: string[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    try {
      logger.debug(`🖼️ Compressing ${uris.length} images...`);

      const promises = uris.map(uri => this.compressImage(uri, options));
      const results = await Promise.all(promises);

      const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressed = results.reduce((sum, r) => sum + r.size, 0);
      const totalRatio = ((totalOriginal - totalCompressed) / totalOriginal) * 100;

      logger.debug(`✅ Compressed ${uris.length} images: ${this.formatBytes(totalOriginal)} → ${this.formatBytes(totalCompressed)} (${totalRatio.toFixed(1)}% reduction)`);

      return results;
    } catch (error) {
      logger.error('Error compressing images:', error);
      throw error;
    }
  }

  /**
   * Create thumbnail from image
   */
  async createThumbnail(
    uri: string,
    size: number = 200
  ): Promise<CompressionResult> {
    return this.compressImage(uri, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg',
    });
  }

  /**
   * Check if image needs compression
   */
  async needsCompression(
    uri: string,
    maxSize: number = 2 * 1024 * 1024 // 2MB
  ): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !('size' in fileInfo)) return false;
      return fileInfo.size > maxSize;
    } catch (error) {
      logger.error('Error checking file size:', error);
      return false;
    }
  }

  /**
   * Get optimal compression settings based on image size
   */
  async getOptimalSettings(uri: string): Promise<CompressionOptions> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !('size' in fileInfo)) {
        return this.DEFAULT_OPTIONS;
      }

      const sizeMB = fileInfo.size / (1024 * 1024);

      if (sizeMB > 10) {
        // Very large image
        return {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.6,
          format: 'jpeg',
        };
      } else if (sizeMB > 5) {
        // Large image
        return {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.7,
          format: 'jpeg',
        };
      } else if (sizeMB > 2) {
        // Medium image
        return {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          format: 'jpeg',
        };
      } else {
        // Small image - minimal compression
        return {
          maxWidth: 2560,
          maxHeight: 2560,
          quality: 0.9,
          format: 'jpeg',
        };
      }
    } catch (error) {
      logger.error('Error getting optimal settings:', error);
      return this.DEFAULT_OPTIONS;
    }
  }

  /**
   * Smart compression: automatically choose best settings
   */
  async smartCompress(uri: string): Promise<CompressionResult> {
    const needsCompression = await this.needsCompression(uri);
    
    if (!needsCompression) {
      logger.debug('✅ Image is small enough, skipping compression');
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
      
      return {
        uri,
        width: 0,
        height: 0,
        size,
        originalSize: size,
        compressionRatio: 0,
      };
    }

    const settings = await this.getOptimalSettings(uri);
    return this.compressImage(uri, settings);
  }

  /**
   * Format bytes to human-readable string
   * COMMENT: PRODUCTION HARDENING - Task 4.9 - Made public for external use
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Batch compress with progress callback
   */
  async compressWithProgress(
    uris: string[],
    onProgress: (current: number, total: number, result: CompressionResult) => void,
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    for (let i = 0; i < uris.length; i++) {
      const result = await this.compressImage(uris[i], options);
      results.push(result);
      onProgress(i + 1, uris.length, result);
    }

    return results;
  }
}

export const ImageCompressionService = new ImageCompressionServiceClass();
export default ImageCompressionService;








