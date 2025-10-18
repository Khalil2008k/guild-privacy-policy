import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { router } from 'expo-router';

export default function SignupStep2() {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  const validate = (): boolean => {
    const next: { fullName?: string; phone?: string } = {};
    if (!fullName.trim()) next.fullName = 'Required';
    if (!phone.trim()) next.phone = 'Required';
    if (phone && phone.length < 7) next.phone = 'Too short';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextStep = () => {
    if (!validate()) return;
    router.push('/(auth)/signup/3');
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('signup') || 'Sign up'} — 2/3</Text>

        <View style={styles.field}> 
          <Text style={[styles.label, { color: theme.textSecondary }]}>Full name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: errors.fullName ? theme.error : theme.border }]}
          />
          {!!errors.fullName && <Text style={[styles.error, { color: theme.error }]}>{errors.fullName}</Text>}
        </View>

        <View style={styles.field}> 
          <Text style={[styles.label, { color: theme.textSecondary }]}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="5551234"
            keyboardType="phone-pad"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: errors.phone ? theme.error : theme.border }]}
          />
          {!!errors.phone && <Text style={[styles.error, { color: theme.error }]}>{errors.phone}</Text>}
        </View>

        <TouchableOpacity style={[styles.cta, { backgroundColor: theme.primary }] } onPress={nextStep}>
          <Text style={[styles.ctaText, { color: theme.buttonText }]}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, fontFamily: 'Signika Negative SC' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 6, fontFamily: 'Signika Negative SC' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'Signika Negative SC' },
  error: { marginTop: 6, fontSize: 12, fontFamily: 'Signika Negative SC' },
  cta: { marginTop: 10, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '700', fontFamily: 'Signika Negative SC' },
});


