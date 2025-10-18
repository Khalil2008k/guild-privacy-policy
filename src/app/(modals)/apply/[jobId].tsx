import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { CustomAlertService } from '../../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, FileText, DollarSign, Clock, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

export default function ApplyScreen() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [coverLetter, setCoverLetter] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [timeline, setTimeline] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = () => {
    if (!coverLetter.trim() || !proposedPrice.trim() || !timeline.trim()) {
      CustomAlertService.showError('Missing Information', 'Please fill in all fields to submit your application.');
      return;
    }

    // Here you would typically send the application data to your backend
    CustomAlertService.showSuccess(
      'Application Submitted!',
      'Your application has been sent successfully. You will be notified when the client responds.',
      [
        {
          text: 'OK',
          style: 'default',
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    CustomAlertService.showSuccess(
      isSaved ? 'Job Unsaved' : 'Job Saved',
      isSaved ? 'This job has been removed from your saved jobs.' : 'This job has been saved to your favorites.'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Apply for Job</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.surfaceSecondary }]}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={20}
            color={isSaved ? theme.error : theme.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Job Application</Text>
          <Text style={[styles.jobId, { color: theme.textSecondary }]}>Job #{jobId}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Cover Letter</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Tell the client why you're the perfect fit for this job
          </Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: theme.background,
              color: theme.textPrimary,
              borderColor: theme.border
            }]}
            placeholder="Write your cover letter here..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={6}
            value={coverLetter}
            onChangeText={setCoverLetter}
            textAlignVertical="top"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => {}}
            enablesReturnKeyAutomatically={true}
            autoCapitalize="sentences"
            autoCorrect={true}
            spellCheck={true}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Proposal</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="cash-outline" size={20} color={theme.primary} />
            </View>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.background,
                color: theme.textPrimary,
                borderColor: theme.border
              }]}
              placeholder="Proposed price (QAR)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={proposedPrice}
              onChangeText={setProposedPrice}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => {}}
              enablesReturnKeyAutomatically={true}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
            </View>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.background,
                color: theme.textPrimary,
                borderColor: theme.border
              }]}
              placeholder="Timeline (e.g., 2 weeks)"
              placeholderTextColor={theme.textSecondary}
              value={timeline}
              onChangeText={setTimeline}
              returnKeyType="done"
              blurOnSubmit={false}
              onSubmitEditing={() => {}}
              enablesReturnKeyAutomatically={true}
              autoCapitalize="sentences"
              autoCorrect={true}
              spellCheck={true}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
          >
            <Ionicons name="send" size={20} color="#000000" />
            <Text style={[styles.submitButtonText, { color: '#000000' }]}>
              Submit Application
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 15,
  },
  jobId: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    minHeight: 120,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputIcon: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});
