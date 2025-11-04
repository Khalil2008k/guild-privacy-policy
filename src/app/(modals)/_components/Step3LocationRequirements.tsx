/**
 * Step3LocationRequirements Component
 * 
 * COMMENT: PRIORITY 1 - File Modularization
 * Extracted from add-job.tsx (lines 913-1128)
 * Purpose: Renders step 3 - Location & Requirements (Location, Remote, Experience, Skills, Requirements, Deliverables)
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../contexts/I18nProvider';
import { Globe, Crosshair, Map } from 'lucide-react-native';
import { getExperienceLevels } from '../_constants/jobFormConstants';

interface JobFormData {
  location: string;
  locationAr: string;
  isRemote: boolean;
  showOnMap: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  skills: string[];
  requirements: string;
  requirementsAr: string;
  deliverables: string;
  deliverablesAr: string;
  primaryLanguage: 'en' | 'ar' | 'both';
}

interface Step3LocationRequirementsProps {
  formData: JobFormData;
  focusedField: string | null;
  locationLoading: boolean;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onInputChange: (field: keyof JobFormData, value: any) => void;
  onFocusChange: (field: string | null) => void;
  onGetCurrentLocation: () => void;
  onOpenMapSelector: () => void;
}

export const Step3LocationRequirements: React.FC<Step3LocationRequirementsProps> = ({
  formData,
  focusedField,
  locationLoading,
  fadeAnim,
  slideAnim,
  scaleAnim,
  onInputChange,
  onFocusChange,
  onGetCurrentLocation,
  onOpenMapSelector,
}) => {
  const { theme } = useTheme();
  const { isRTL } = useI18n();

  // COMMENT: PRIORITY 1 - File Modularization - Use constants from _constants/jobFormConstants.ts
  const experienceLevels = getExperienceLevels(isRTL, theme.primary);

  return (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Text style={[styles.stepTitle, { 
        color: theme.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
      }]}>
        {isRTL ? 'الموقع والمتطلبات' : 'Location & Requirements'}
      </Text>

      {/* Location */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'الموقع' : 'Location'} *
        </Text>
        
        {/* Location Input Fields */}
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'location' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'مثال: الدوحة، قطر' : 'e.g. Doha, Qatar'}
            placeholderTextColor={theme.textSecondary}
            value={formData.location}
            onChangeText={(value) => onInputChange('location', value)}
            onFocus={() => onFocusChange('location')}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'locationAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'مثال: الدوحة، قطر' : 'مثال: الدوحة، قطر'}
            placeholderTextColor={theme.textSecondary}
            value={formData.locationAr}
            onChangeText={(value) => onInputChange('locationAr', value)}
            onFocus={() => onFocusChange('locationAr')}
          />
        ) : null}

        {/* Location Actions */}
        <View style={[styles.locationActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.locationButton, { 
              backgroundColor: theme.primary,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: 6,
            }]}
            onPress={onGetCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Crosshair size={16} color="#000000" />
            )}
            <Text style={[styles.locationButtonText, { 
              color: '#000000',
            }]}>
              {isRTL ? 'موقعي الحالي' : 'My Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.locationButton, { 
              backgroundColor: theme.surface, 
              borderColor: theme.border, 
              borderWidth: 1,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: 6,
            }]}
            onPress={onOpenMapSelector}
          >
            <Map size={16} color={theme.textPrimary} />
            <Text style={[styles.locationButtonText, { 
              color: theme.textPrimary,
            }]}>
              {isRTL ? 'اختيار من الخريطة' : 'Choose on Map'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Remote Work Toggle */}
      <TouchableOpacity
        style={[
          styles.remoteToggle,
          {
            backgroundColor: formData.isRemote ? theme.primary : theme.surface,
            borderColor: formData.isRemote ? theme.primary : theme.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        onPress={() => onInputChange('isRemote', !formData.isRemote)}
      >
        <View style={{
          marginRight: isRTL ? 0 : 8,
          marginLeft: isRTL ? 8 : 0,
        }}>
          <Globe size={20} color={formData.isRemote ? '#000000' : theme.textPrimary} />
        </View>
        <Text
          style={[
            styles.remoteText,
            {
              color: formData.isRemote ? '#000000' : theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {isRTL ? 'عمل عن بُعد' : 'Remote Work'}
        </Text>
      </TouchableOpacity>

      {/* Experience Level */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'مستوى الخبرة المطلوب' : 'Required Experience Level'}
        </Text>
        <View style={[styles.experienceContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {experienceLevels.map((level) => {
            const IconComponent = level.icon;
            return (
              <TouchableOpacity
                key={level.key}
                style={[
                  styles.experienceCard,
                  {
                    backgroundColor: formData.experienceLevel === level.key ? theme.primary : theme.surface,
                    borderColor: formData.experienceLevel === level.key ? theme.primary : theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  },
                ]}
                onPress={() => onInputChange('experienceLevel', level.key)}
              >
                <IconComponent
                  size={18}
                  color={formData.experienceLevel === level.key ? '#000000' : theme.textPrimary}
                />
                <Text
                  style={[
                    styles.experienceText,
                    {
                      color: formData.experienceLevel === level.key ? '#000000' : theme.textPrimary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Requirements */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'المتطلبات' : 'Requirements'}
        </Text>
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'requirements' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'اكتب المتطلبات المطلوبة...' : 'Write the required qualifications...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.requirements}
            onChangeText={(value) => onInputChange('requirements', value)}
            onFocus={() => onFocusChange('requirements')}
            multiline
            numberOfLines={3}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'requirementsAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'اكتب المتطلبات المطلوبة...' : 'اكتب المتطلبات المطلوبة...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.requirementsAr}
            onChangeText={(value) => onInputChange('requirementsAr', value)}
            onFocus={() => onFocusChange('requirementsAr')}
            multiline
            numberOfLines={3}
          />
        ) : null}
      </View>

      {/* Deliverables */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { 
          color: theme.textPrimary,
          textAlign: isRTL ? 'right' : 'left',
        }]}>
          {isRTL ? 'المخرجات المتوقعة' : 'Expected Deliverables'}
        </Text>
        {formData.primaryLanguage === 'en' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'deliverables' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            placeholder={isRTL ? 'اكتب المخرجات المتوقعة...' : 'Write the expected deliverables...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.deliverables}
            onChangeText={(value) => onInputChange('deliverables', value)}
            onFocus={() => onFocusChange('deliverables')}
            multiline
            numberOfLines={3}
          />
        ) : null}
        
        {formData.primaryLanguage === 'ar' || formData.primaryLanguage === 'both' ? (
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: focusedField === 'deliverablesAr' ? theme.primary : theme.border,
                color: theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
                marginTop: formData.primaryLanguage === 'both' ? 12 : 0,
              },
            ]}
            placeholder={isRTL ? 'اكتب المخرجات المتوقعة...' : 'اكتب المخرجات المتوقعة...'}
            placeholderTextColor={theme.textSecondary}
            value={formData.deliverablesAr}
            onChangeText={(value) => onInputChange('deliverablesAr', value)}
            onFocus={() => onFocusChange('deliverablesAr')}
            multiline
            numberOfLines={3}
          />
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
    marginBottom: 12,
  },
  locationActions: {
    gap: 12,
    marginTop: 12,
  },
  locationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remoteToggle: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: 24,
  },
  remoteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  experienceContainer: {
    gap: 12,
  },
  experienceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  experienceText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

