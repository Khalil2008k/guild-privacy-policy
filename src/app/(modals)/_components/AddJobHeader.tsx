/**
 * AddJobHeader Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 1453-1501)
 * Purpose: Renders the header section with title, subtitle, close button, and step indicator
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { X, Info } from 'lucide-react-native';
import { StepIndicator } from './StepIndicator';

interface AddJobHeaderProps {
  currentStep: number;
}

export const AddJobHeader: React.FC<AddJobHeaderProps> = ({ currentStep }) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[theme.primary, theme.primary + 'CC']}
      style={[styles.header, { paddingTop: insets.top + 12 }]}
    >
      <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={[styles.closeButton, { 
            marginRight: isRTL ? 0 : 0,
            marginLeft: isRTL ? 0 : 0,
          }]}
          onPress={() => router.back()}
        >
          <X size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={[styles.headerTitleContainer, { 
          marginRight: isRTL ? 0 : 20,
          marginLeft: isRTL ? 20 : 0,
        }]}>
          <Text style={[styles.headerTitle, { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }]}>
            {isRTL ? 'إضافة وظيفة جديدة' : 'Add New Job'}
          </Text>
          <Text style={[styles.headerSubtitle, { 
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }]}>
            {isRTL ? 'أضف وظيفة واجد المواهب المناسبة' : 'Post a job and find the right talent'}
          </Text>
        </View>
        
        <View style={[styles.headerActions, { 
          marginRight: isRTL ? 0 : 0,
          marginLeft: isRTL ? 0 : 0,
        }]}>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => router.push('/(modals)/job-posting-help')}
          >
            <Info size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
      
      <StepIndicator currentStep={currentStep} totalSteps={4} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});






