import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function ExploreScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 12 }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Explore</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={() => router.push('/(modals)/job-posting')}>
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.textPrimary }]}>Post Job</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={() => router.push('/(modals)/leads-feed')}>
          <Ionicons name="search-outline" size={24} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.textPrimary }]}>Browse Jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={() => router.push('/(modals)/guild-map')}>
          <Ionicons name="map-outline" size={24} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.textPrimary }]}>Guild Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={() => router.push('/(modals)/guilds')}>
          <Ionicons name="people-outline" size={24} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.textPrimary }]}>Guilds</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={() => router.push('/(modals)/notifications')}>
          <Ionicons name="notifications-outline" size={24} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.textPrimary }]}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={() => router.push('/(modals)/settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.textPrimary }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16, fontFamily: 'Signika Negative SC' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 6 },
  cardText: { fontSize: 14, fontWeight: '700', fontFamily: 'Signika Negative SC' },
});
