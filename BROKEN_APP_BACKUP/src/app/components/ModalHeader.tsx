import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ModalHeaderProps {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}

export default function ModalHeader({ title, right, onBack }: ModalHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, backgroundColor: theme.primary }]}> 
      <TouchableOpacity
        style={[styles.back, { borderColor: '#000' }]}
        onPress={onBack || (() => (router.canGoBack() ? router.back() : router.push('/(main)/home')))}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={18} color={theme.primary} />
      </TouchableOpacity>
      <Text style={[styles.title]}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    color: '#000',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Signika Negative SC',
  },
  right: { minWidth: 42, alignItems: 'flex-end' },
});


