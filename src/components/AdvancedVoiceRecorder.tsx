import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff, CheckCircle, XCircle, Lock } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { logger } from '../utils/logger';

interface AdvancedVoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export function AdvancedVoiceRecorder({ onRecordingComplete, onCancel }: AdvancedVoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnimationsRef = useRef<Animated.Value[]>([]);
  const waveformInterval = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  
  // Initialize waveform animations (20 bars) - only once
  if (waveformAnimationsRef.current.length === 0) {
    for (let i = 0; i < 20; i++) {
      waveformAnimationsRef.current.push(new Animated.Value(5));
    }
  }
  
  const waveformAnimations = waveformAnimationsRef.current;

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (waveformInterval.current) {
        clearInterval(waveformInterval.current);
      }
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  useEffect(() => {
    // Pulsing animation for recording indicator
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start waveform animation
      waveformInterval.current = setInterval(() => {
        waveformAnimations.forEach((anim, index) => {
          // Random height for each bar (simulates audio levels)
          const targetHeight = Math.random() * 25 + 5;
          Animated.timing(anim, {
            toValue: targetHeight,
            duration: 150,
            useNativeDriver: false, // Layout animations can't use native driver
          }).start();
        });
      }, 100);
    } else {
      pulseAnim.setValue(1);
      // Reset waveform to base height
      if (waveformInterval.current) {
        clearInterval(waveformInterval.current);
        waveformInterval.current = null;
      }
      waveformAnimations.forEach(anim => anim.setValue(5));
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRTL ? 'إذن مطلوب' : 'Permission Required',
          isRTL ? 'إذن الميكروفون مطلوب لتسجيل الرسائل الصوتية.' : 'Microphone permission is required to record voice notes.'
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setIsLocked(false);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      logger.debug('🎤 Advanced voice recording started');
    } catch (err) {
      logger.error('❌ Failed to start recording:', err);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل بدء التسجيل' : 'Failed to start recording'
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      setIsRecording(false);
      setIsLocked(false);
      
      // Stop waveform animation
      if (waveformInterval.current) {
        clearInterval(waveformInterval.current);
        waveformInterval.current = null;
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      const finalDuration = recordingDuration;
      setRecordingDuration(0);

      if (uri && finalDuration > 0) {
        logger.debug(`🎤 Recording complete: ${finalDuration}s`);
        onRecordingComplete(uri, finalDuration);
      } else {
        logger.warn('⚠️ Recording cancelled or too short');
      }
    } catch (error) {
      logger.error('❌ Failed to stop recording:', error);
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل إيقاف التسجيل' : 'Failed to stop recording'
      );
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      await stopRecording();
    }
    onCancel();
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initial state - show start button
  if (!isRecording) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.error }]}
          onPress={startRecording}
          activeOpacity={0.8}
        >
          <Mic size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>
            {isRTL ? 'اضغط للتسجيل' : 'Tap to Record'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Recording state - show recording UI
  return (
    <View style={[styles.recordingContainer, { backgroundColor: theme.surface }]}>
      <View style={styles.recordingIndicator}>
        <Animated.View
          style={[
            styles.recordingDot,
            {
              backgroundColor: theme.error,
              opacity: pulseAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Text style={[styles.recordingText, { color: theme.error }]}>
          {formatDuration(recordingDuration)}
        </Text>
        {isLocked && (
          <View style={styles.lockIndicator}>
            <Lock size={16} color={theme.primary} />
          </View>
        )}
      </View>

      {/* Real-time Waveform Visualization */}
      <View style={styles.waveformContainer}>
        {waveformAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: anim,
                backgroundColor: theme.primary,
              },
            ]}
          />
        ))}
      </View>

      {!isLocked && (
        <TouchableOpacity
          style={styles.lockButton}
          onPress={toggleLock}
          activeOpacity={0.7}
        >
          <Text style={[styles.lockButtonText, { color: theme.textSecondary }]}>
            {isRTL ? 'اسحب للقفل' : 'Slide to Lock'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
          onPress={stopRecording}
          activeOpacity={0.7}
        >
          <CheckCircle size={32} color={theme.primary} />
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>
            {isRTL ? 'إرسال' : 'Send'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
          onPress={cancelRecording}
          activeOpacity={0.7}
        >
          <XCircle size={32} color={theme.error} />
          <Text style={[styles.actionButtonText, { color: theme.error }]}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  startButton: {
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 15,
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordingContainer: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  lockIndicator: {
    marginLeft: 8,
    padding: 4,
  },
  lockButton: {
    marginBottom: 20,
    padding: 8,
  },
  lockButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  actionButtonText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginVertical: 20,
    gap: 3,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#000000',
    minHeight: 5,
  },
});

