import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppBottomNavigation from '@/app/components/AppBottomNavigation';
import { useI18n } from '@/contexts/I18nProvider';

const FONT_FAMILY = 'Signika Negative SC';

const getAllJobs = (isRTL: boolean) => [
  { 
    id: 'j1', 
    title: isRTL ? 'تحسين واجهة المستخدم' : 'UI Polish', 
    state: 'in-progress', 
    classLabel: 'B', 
    price: 1200, 
    rating: 4.2, 
    time: isRTL ? 'اليوم' : 'Today' 
  },
  { 
    id: 'j2', 
    title: isRTL ? 'توصيل الخليج الغربي' : 'Delivery West Bay', 
    state: 'completed', 
    classLabel: 'E', 
    price: 80, 
    rating: 4.8, 
    time: isRTL ? 'أمس' : 'Yesterday' 
  },
  { 
    id: 'j3', 
    title: isRTL ? 'إصلاح كهربائي' : 'Electrician Fix', 
    state: 'open', 
    classLabel: 'D', 
    price: 250, 
    rating: 4.5, 
    time: isRTL ? 'اليوم، 6 مساءً' : 'Today, 6 PM' 
  },
];

export default function MyJobsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const top = insets?.top || 0;
  const [tab, setTab] = useState<'open' | 'in-progress' | 'completed'>('open');

  const allJobs = getAllJobs(isRTL);
  const jobs = allJobs.filter(j => (tab === 'open' ? j.state === 'open' : tab === 'in-progress' ? j.state === 'in-progress' : j.state === 'completed'));

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    header: { paddingTop: top + 8, paddingBottom: 12, paddingHorizontal: 18, backgroundColor: '#BCFF31', borderBottomLeftRadius: 26 },
    title: { color: '#000', fontSize: 26, fontWeight: '900', fontFamily: FONT_FAMILY },
    tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#111' },
    tabBtn: { flex: 1, backgroundColor: '#000', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2a', paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderColor: '#BCFF31' },
    tabText: { color: '#fff', fontWeight: '900', fontFamily: FONT_FAMILY },
    list: { flex: 1, backgroundColor: '#111', padding: 16 },
    card: { backgroundColor: '#1b1b1b', borderRadius: 18, borderWidth: 1, borderColor: '#262626', padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 14 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    name: { color: '#fff', fontWeight: '900', fontFamily: FONT_FAMILY },
    stars: { flexDirection: 'row', gap: 2 },
    chip: { paddingHorizontal: 6, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#BCFF31', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(188,255,49,0.08)', marginLeft: 8 },
    chipText: { color: '#BCFF31', fontSize: 10, fontWeight: '900', fontFamily: FONT_FAMILY },
    titleText: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 8, fontFamily: FONT_FAMILY },
    meta: { color: '#BDBDBD', marginTop: 4, fontFamily: FONT_FAMILY },
    price: { color: '#BCFF31', fontWeight: '900', fontFamily: FONT_FAMILY },
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#BCFF31" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('myJobs')}</Text>
      </View>

      <View style={styles.tabs}>
        {(['open','in-progress','completed'] as const).map(k => (
          <TouchableOpacity key={k} onPress={() => setTab(k)} style={[styles.tabBtn, tab===k && styles.tabActive]}>
            <Text style={styles.tabText}>
              {k === 'open' ? (isRTL ? 'مفتوح' : 'open') :
               k === 'in-progress' ? (isRTL ? 'قيد التنفيذ' : 'in-progress') :
               (isRTL ? 'مكتمل' : 'completed')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {jobs.map(j => (
          <TouchableOpacity 
            key={j.id} 
            style={styles.card}
            onPress={() => router.push(`/(modals)/job/${j.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.row}>
              <View style={styles.left}>
                <View style={styles.avatar}><Ionicons name="person-outline" size={16} color="#000" /></View>
                <View>
                  <Text style={styles.name}>{j.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.chip}><Text style={styles.chipText}>{j.state}</Text></View>
                    <View style={styles.chip}><Text style={styles.chipText}>{j.classLabel}</Text></View>
                  </View>
                </View>
              </View>
              <Text style={styles.price}>QR {j.price}</Text>
            </View>
            <Text style={styles.meta}>{j.time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <AppBottomNavigation currentRoute="/my-jobs" />
    </View>
  );
}
