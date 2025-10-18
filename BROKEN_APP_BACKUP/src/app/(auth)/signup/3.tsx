import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { router } from 'expo-router';

export default function SignupStep3() {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const validate = (): boolean => {
    const next: { password?: string; confirm?: string } = {};
    if (!password || password.length < 6) next.password = 'Min 6 chars';
    if (confirm !== password) next.confirm = 'Does not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const finish = () => {
    if (!validate()) return;
    // Here we would call signup API/Firebase, then route
    router.replace('/(auth)/signin');
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('signup') || 'Sign up'} — 3/3</Text>

        <View style={styles.field}> 
          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: errors.password ? theme.error : theme.border }]}
          />
          {!!errors.password && <Text style={[styles.error, { color: theme.error }]}>{errors.password}</Text>}
        </View>

        <View style={styles.field}> 
          <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••"
            secureTextEntry
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: errors.confirm ? theme.error : theme.border }]}
          />
          {!!errors.confirm && <Text style={[styles.error, { color: theme.error }]}>{errors.confirm}</Text>}
        </View>

        <TouchableOpacity style={[styles.cta, { backgroundColor: theme.primary }] } onPress={finish}>
          <Text style={[styles.ctaText, { color: theme.buttonText }]}>Create account</Text>
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


