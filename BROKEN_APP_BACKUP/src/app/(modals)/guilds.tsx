import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';
import { useI18n } from '@/contexts/I18nProvider';
import { useTheme } from '@/contexts/ThemeContext';

const FONT_FAMILY = 'Signika Negative SC';

const getMockGuilds = (t: any, isRTL: boolean) => [
  { 
    id: 'g1', 
    name: isRTL ? 'مطوري الدوحة' : 'Doha Developers', 
    members: 128, 
    rating: 4.7, 
    desc: isRTL ? 'الواجهة الأمامية • الخلفية • المحمول' : 'Frontend • Backend • Mobile' 
  },
  { 
    id: 'g2', 
    name: isRTL ? 'المهنيين المهرة قطر' : 'Handy Pros Qatar', 
    members: 86, 
    rating: 4.4, 
    desc: isRTL ? 'كهرباء • سباكة • تكييف' : 'Electric • Plumbing • AC' 
  },
  { 
    id: 'g3', 
    name: isRTL ? 'مجموعة التصميم' : 'Design Collective', 
    members: 203, 
    rating: 4.9, 
    desc: isRTL ? 'تصميم واجهة • علامة تجارية • حركة' : 'UI/UX • Brand • Motion' 
  },
];

export default function Guilds() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const top = insets?.top || 0;
  const bottom = insets?.bottom || 0;
  const goBack = useCallback(() => router.back(), []);
  const goMap = useCallback(() => router.push('/(modals)/guild-map'), []);
  const mockGuilds = getMockGuilds(t, isRTL);

  const { theme, isDarkMode } = useTheme();
  
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    topBar: { paddingTop: top + 8, paddingBottom: 12, paddingHorizontal: 18, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandText: { color: theme.buttonText, fontSize: 24, fontWeight: '900', letterSpacing: 1.1, fontFamily: FONT_FAMILY },
    squareBtn: { width: 40, height: 40, backgroundColor: theme.buttonText, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

    header: { backgroundColor: theme.primary, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, borderBottomLeftRadius: 26 },
    title: { color: theme.buttonText, fontSize: 28, fontWeight: '900', fontFamily: FONT_FAMILY },
    sub: { color: theme.buttonText, opacity: 0.9, fontSize: 13, fontFamily: FONT_FAMILY },

    list: { flex: 1, backgroundColor: theme.surfaceSecondary, padding: 16 },
    card: { backgroundColor: theme.surface, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.border, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 14, overflow: 'hidden' },
    glow: { position: 'absolute', inset: 0, borderRadius: 18, borderWidth: 1, borderColor: theme.primary, opacity: 0.14, shadowColor: theme.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 10 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTop: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    name: { color: theme.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONT_FAMILY },
    desc: { color: theme.textSecondary, fontSize: 13, marginTop: 4, fontFamily: FONT_FAMILY },
    meta: { color: theme.primary, fontWeight: '900', fontSize: 12, fontFamily: FONT_FAMILY },
    actions: { padding: 16, flexDirection: 'row', gap: 10 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.surface, borderColor: theme.primary, borderWidth: 1.25, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
    pillText: { color: theme.primary, fontWeight: '800', fontFamily: FONT_FAMILY },
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.primary} />
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <MaterialIcons name="security" size={22} color={theme.buttonText} />
          <Text style={styles.brandText}>{t('guilds')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={goMap} style={styles.squareBtn}>
            <Ionicons name="map-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{t('discover')} {t('guilds').toLowerCase()} {isRTL ? 'بالقرب منك' : 'near you'}</Text>
        <Text style={styles.sub}>{isRTL ? 'انضم إلى مجموعات موثوقة لتنمية شبكتك' : 'join trusted groups to grow your network'}</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {mockGuilds.map(g => (
          <TouchableOpacity 
            key={g.id} 
            style={styles.card}
            onPress={() => router.push(`/(modals)/guild/${g.id}`)}
            activeOpacity={0.9}
          >
            <View style={styles.glow} />
            <View style={[styles.cardTop, styles.row]}>
              <View>
                <Text style={styles.name}>{g.name}</Text>
                <Text style={styles.desc}>{g.desc}</Text>
              </View>
              <Text style={styles.meta}>{g.members} {isRTL ? 'أعضاء' : 'members'} • {g.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.pill}
                onPress={() => router.push(`/(modals)/guild/${g.id}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="people-outline" size={18} color={theme.primary} />
                <Text style={styles.pillText}>{isRTL ? 'عرض' : 'view'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pill}
                onPress={() => router.push('/(main)/chat')}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbox-outline" size={18} color={theme.primary} />
                <Text style={styles.pillText}>{isRTL ? 'محادثة' : 'chat'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <AppBottomNavigation currentRoute="/guilds" />
    </View>
  );
}
