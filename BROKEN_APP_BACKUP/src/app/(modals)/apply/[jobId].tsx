import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const FONT_FAMILY = 'Signika Negative SC';

export default function ApplyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams();

  const [coverLetter, setCoverLetter] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [timeline, setTimeline] = useState('');

  const handleSubmit = () => {
    if (!coverLetter.trim() || !proposedPrice.trim() || !timeline.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields to submit your application.');
      return;
    }

    // Here you would typically send the application data to your backend
    Alert.alert(
      'Application Submitted!',
      'Your application has been sent successfully. You will be notified when the client responds.',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Apply for Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Job Application</Text>
          <Text style={[styles.jobId, { color: theme.textSecondary }]}>Job #{jobId}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Cover Letter</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Tell the client why you're the perfect fit for this job
          </Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: theme.surfaceSecondary,
              color: theme.text,
              borderColor: theme.border
            }]}
            placeholder="Write your cover letter here..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={6}
            value={coverLetter}
            onChangeText={setCoverLetter}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Proposal</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="cash-outline" size={20} color={theme.primary} />
            </View>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.surfaceSecondary,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Proposed price (QAR)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={proposedPrice}
              onChangeText={setProposedPrice}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
            </View>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.surfaceSecondary,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Timeline (e.g., 2 weeks)"
              placeholderTextColor={theme.textSecondary}
              value={timeline}
              onChangeText={setTimeline}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
          >
            <Ionicons name="send" size={20} color={theme.surface} />
            <Text style={[styles.submitButtonText, { color: theme.surface }]}>
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
    borderBottomColor: '#e0e0e0',
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
