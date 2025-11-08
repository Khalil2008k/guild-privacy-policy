/**
 * Smart Actions Component
 * Quick reply suggestions for support chat
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { 
  CreditCard, 
  Wallet, 
  Briefcase, 
  Bug, 
  HelpCircle,
  MessageSquare
} from 'lucide-react-native';

interface SmartAction {
  id: string;
  label: string;
  labelAr?: string;
  icon: React.ComponentType<any>;
  action: string;
}

const SMART_ACTIONS: SmartAction[] = [
  {
    id: 'payment',
    label: 'Payment Help',
    labelAr: 'مساعدة الدفع',
    icon: CreditCard,
    action: 'I need help with payment'
  },
  {
    id: 'coins',
    label: 'Coin & Wallet',
    labelAr: 'العملات والمحفظة',
    icon: Wallet,
    action: 'I have questions about coins and wallet'
  },
  {
    id: 'jobs',
    label: 'Jobs & Guilds',
    labelAr: 'الوظائف والنقابات',
    icon: Briefcase,
    action: 'I need help with jobs or guilds'
  },
  {
    id: 'bug',
    label: 'Report Bug',
    labelAr: 'الإبلاغ عن خطأ',
    icon: Bug,
    action: 'I found a bug or issue'
  },
  {
    id: 'general',
    label: 'General Help',
    labelAr: 'مساعدة عامة',
    icon: HelpCircle,
    action: 'I need general assistance'
  }
];

interface SmartActionsProps {
  onActionPress: (action: string) => void;
}

export const SmartActions: React.FC<SmartActionsProps> = ({ onActionPress }) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
      >
        {SMART_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                { 
                  backgroundColor: theme.surface,
                  borderColor: theme.border
                }
              ]}
              onPress={() => onActionPress(action.action)}
              activeOpacity={0.7}
            >
              <Icon size={20} color={theme.primary} />
              <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>
                {isRTL ? action.labelAr : action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 8
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 8
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500'
  }
});


