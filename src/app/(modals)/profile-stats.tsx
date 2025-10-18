/**
 * Profile Statistics Screen
 * Display user performance metrics, job stats, earnings
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { TrendingUp, Briefcase, DollarSign, Star, Award, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileStatsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const stats = {
    completedJobs: user?.completedJobs || 0,
    totalEarnings: user?.totalEarnings || 0,
    rating: user?.rating || 0,
    badges: user?.badges?.length || 0,
    guildMembers: user?.guildMembers || 0,
    successRate: user?.successRate || 0
  };
  
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <View style={{
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.border
    }}>
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{
          backgroundColor: `${color}20`,
          borderRadius: 12,
          padding: 10,
          marginRight: isRTL ? 0 : 15,
          marginLeft: isRTL ? 15 : 0
        }}>
          <Icon size={24} color={color} />
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: isRTL ? 'right' : 'left' }}>{label}</Text>
      </View>
      <Text style={{ color: theme.text, fontSize: 32, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>{value}</Text>
    </View>
  );
  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Statistics
        </Text>
        
        <StatCard icon={Briefcase} label="Completed Jobs" value={stats.completedJobs} color={theme.primary} />
        <StatCard icon={DollarSign} label="Total Earnings" value={`$${stats.totalEarnings}`} color="#10B981" />
        <StatCard icon={Star} label="Rating" value={`${stats.rating.toFixed(1)}/5.0`} color="#F59E0B" />
        <StatCard icon={TrendingUp} label="Success Rate" value={`${stats.successRate}%`} color="#3B82F6" />
        <StatCard icon={Award} label="Badges Earned" value={stats.badges} color="#8B5CF6" />
        <StatCard icon={Users} label="Guild Members" value={stats.guildMembers} color="#EC4899" />
      </View>
    </ScrollView>
  );
}





