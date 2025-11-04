/**
 * Voice Recording Service
 * Production-grade voice recording with Expo-AV
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
// COMMENT: PRIORITY 1 - Replace console statements with logger
import { logger } from '../utils/logger';

export interface VoiceRecordingResult {
  uri: string;
  size: number;
  duration: number;
}

/**
 * Start voice recording
 * Returns Recording instance that can be stopped later
 */
export async function startVoiceRecording(): Promise<Audio.Recording> {
  try {
    // Request permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Audio recording permission denied');
    }

    // Set audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create and prepare recording
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    await recording.startAsync();

    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('🎤 Voice recording started');
    return recording;
  } catch (error) {
    // COMMENT: PRIORITY 1 - Replace console.error with logger
    logger.error('❌ Error starting voice recording:', error);
    throw error;
  }
}

/**
 * Stop voice recording and return file info
 */
export async function stopVoiceRecording(
  recording: Audio.Recording
): Promise<VoiceRecordingResult> {
  try {
    // Stop and unload recording
    await recording.stopAndUnloadAsync();

    // Get file URI
    const uri = recording.getURI();
    if (!uri) {
      throw new Error('No URI from recording');
    }

    // Get file info
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('Recording file not found');
    }

    // Get duration from recording status
    const status = await recording.getStatusAsync();
    const duration = status.isLoaded ? status.durationMillis / 1000 : 0;

    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('✅ Voice recording stopped', { uri, size: info.size, duration });
    return {
      uri,
      size: info.size || 0,
      duration,
    };
  } catch (error) {
    // COMMENT: PRIORITY 1 - Replace console.error with logger
    logger.error('❌ Error stopping voice recording:', error);
    throw error;
  }
}

/**
 * Cancel recording without saving
 */
export async function cancelVoiceRecording(
  recording: Audio.Recording
): Promise<void> {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    // COMMENT: PRIORITY 1 - Replace console.log with logger
    logger.debug('🧹 Voice recording cancelled');
  } catch (error) {
    // COMMENT: PRIORITY 1 - Replace console.warn with logger
    logger.warn('⚠️ Error cancelling recording:', error);
  }
}








