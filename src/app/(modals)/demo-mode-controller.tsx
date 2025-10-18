/**
 * Demo Mode Controller
 * Admin portal for controlling demo mode and payment system settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Settings, 
  DollarSign, 
  Shield, 
  Database, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { BackendAPI } from '../../config/backend';
import { CustomAlertService } from '../../services/CustomAlertService';

const FONT_FAMILY = 'Signika Negative SC';

interface DemoModeSettings {
  isDemoMode: boolean;
  betaCoinsPerUser: number;
  pspApiEnabled: boolean;
  pspApiProvider: string;
  pspApiKey: string;
  pspApiSecret: string;
  supportedCurrencies: string[];
  supportedPaymentMethods: string[];
  conversionRate: number; // Guild Coins to USD
}

interface PSPProvider {
  id: string;
  name: string;
  description: string;
  supportedCurrencies: string[];
  fees: {
    deposit: number;
    withdrawal: number;
    payment: number;
  };
}

export default function DemoModeController() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();

  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [settings, setSettings] = useState<DemoModeSettings>({
    isDemoMode: true,
    betaCoinsPerUser: 300,
    pspApiEnabled: false,
    pspApiProvider: '',
    pspApiKey: '',
    pspApiSecret: '',
    supportedCurrencies: ['Guild Coins', 'USD', 'EUR', 'QR'],
    supportedPaymentMethods: ['card', 'bank_transfer'],
    conversionRate: 1.0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pspProviders] = useState<PSPProvider[]>([
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Global payment processing',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      fees: { deposit: 2.9, withdrawal: 0.25, payment: 2.9 }
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Digital wallet and payment processing',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      fees: { deposit: 2.9, withdrawal: 1.0, payment: 2.9 }
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Payment processing for businesses',
      supportedCurrencies: ['USD', 'CAD', 'GBP', 'AUD'],
      fees: { deposit: 2.6, withdrawal: 0.0, payment: 2.6 }
    }
  ]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await BackendAPI.get('/admin/demo-mode-settings');
      
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error loading demo mode settings:', error);
      CustomAlertService.showError('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await BackendAPI.post('/admin/demo-mode-settings', settings);
      
      if (response.data.success) {
        CustomAlertService.showSuccess('Success', 'Settings saved successfully');
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      CustomAlertService.showError('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleDemoMode = async (enabled: boolean) => {
    if (enabled) {
      // Switching to demo mode
      Alert.alert(
        isRTL ? 'تفعيل وضع التجربة' : 'Enable Demo Mode',
        isRTL 
          ? 'سيتم تفعيل وضع التجربة مع عملات GUILD. جميع بيانات المستخدمين والمحافظ ستُحفظ.'
          : 'Demo mode will be enabled with Guild Coins. All user data and wallets will be preserved.',
        [
          { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
          { 
            text: isRTL ? 'تفعيل' : 'Enable', 
            style: 'default',
            onPress: () => setSettings(prev => ({ ...prev, isDemoMode: true }))
          }
        ]
      );
    } else {
      // Switching to real money mode
      Alert.alert(
        isRTL ? 'تعطيل وضع التجربة' : 'Disable Demo Mode',
        isRTL 
          ? 'سيتم تعطيل وضع التجربة والانتقال إلى المال الحقيقي. تأكد من تكوين PSP API.'
          : 'Demo mode will be disabled and switched to real money. Ensure PSP API is configured.',
        [
          { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
          { 
            text: isRTL ? 'تعطيل' : 'Disable', 
            style: 'destructive',
            onPress: () => setSettings(prev => ({ ...prev, isDemoMode: false }))
          }
        ]
      );
    }
  };

  const handlePSPProviderChange = (providerId: string) => {
    const provider = pspProviders.find(p => p.id === providerId);
    if (provider) {
      setSettings(prev => ({
        ...prev,
        pspApiProvider: providerId,
        supportedCurrencies: provider.supportedCurrencies
      }));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: adaptiveColors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.primary} translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: adaptiveColors.text }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: adaptiveColors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.primary} translucent />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: adaptiveColors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={adaptiveColors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: adaptiveColors.text }]}>
          {isRTL ? 'تحكم وضع التجربة' : 'Demo Mode Controller'}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Demo Mode Toggle */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: adaptiveColors.text }]}>
              {isRTL ? 'وضع التجربة' : 'Demo Mode'}
            </Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: adaptiveColors.text }]}>
                {isRTL ? 'تفعيل وضع التجربة' : 'Enable Demo Mode'}
              </Text>
              <Text style={[styles.settingDescription, { color: adaptiveColors.textSecondary }]}>
                {isRTL 
                  ? 'استخدم عملات GUILD للاختبار. جميع البيانات ستُحفظ.'
                  : 'Use Guild Coins for testing. All data will be preserved.'
                }
              </Text>
            </View>
            <Switch
              value={settings.isDemoMode}
              onValueChange={toggleDemoMode}
              trackColor={{ false: adaptiveColors.border, true: theme.primary + '40' }}
              thumbColor={settings.isDemoMode ? theme.primary : adaptiveColors.textSecondary}
            />
          </View>

          {settings.isDemoMode && (
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: adaptiveColors.text }]}>
                  {isRTL ? 'عملات الاختبار لكل مستخدم' : 'Beta Coins Per User'}
                </Text>
                <Text style={[styles.settingDescription, { color: adaptiveColors.textSecondary }]}>
                  {isRTL 
                    ? 'عدد عملات GUILD التي يحصل عليها كل مستخدم جديد'
                    : 'Number of Guild Coins each new user receives'
                  }
                </Text>
              </View>
              <TextInput
                style={[styles.numberInput, { 
                  backgroundColor: adaptiveColors.background, 
                  borderColor: adaptiveColors.border,
                  color: adaptiveColors.text
                }]}
                value={settings.betaCoinsPerUser.toString()}
                onChangeText={(text) => setSettings(prev => ({ 
                  ...prev, 
                  betaCoinsPerUser: parseInt(text) || 300 
                }))}
                keyboardType="numeric"
                placeholder="300"
                placeholderTextColor={adaptiveColors.textSecondary}
              />
            </View>
          )}
        </View>

        {/* PSP API Configuration */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: adaptiveColors.text }]}>
              {isRTL ? 'تكامل PSP API' : 'PSP API Integration'}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: adaptiveColors.text }]}>
                {isRTL ? 'تفعيل PSP API' : 'Enable PSP API'}
              </Text>
              <Text style={[styles.settingDescription, { color: adaptiveColors.textSecondary }]}>
                {isRTL 
                  ? 'تفعيل معالجة المدفوعات الحقيقية'
                  : 'Enable real payment processing'
                }
              </Text>
            </View>
            <Switch
              value={settings.pspApiEnabled}
              onValueChange={(enabled) => setSettings(prev => ({ ...prev, pspApiEnabled: enabled }))}
              trackColor={{ false: adaptiveColors.border, true: theme.primary + '40' }}
              thumbColor={settings.pspApiEnabled ? theme.primary : adaptiveColors.textSecondary}
            />
          </View>

          {settings.pspApiEnabled && (
            <>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: adaptiveColors.text }]}>
                  {isRTL ? 'مزود PSP' : 'PSP Provider'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
                  {pspProviders.map((provider) => (
                    <TouchableOpacity
                      key={provider.id}
                      style={[
                        styles.providerCard,
                        { 
                          backgroundColor: adaptiveColors.background,
                          borderColor: settings.pspApiProvider === provider.id ? theme.primary : adaptiveColors.border
                        }
                      ]}
                      onPress={() => handlePSPProviderChange(provider.id)}
                    >
                      <Text style={[styles.providerName, { color: adaptiveColors.text }]}>
                        {provider.name}
                      </Text>
                      <Text style={[styles.providerDescription, { color: adaptiveColors.textSecondary }]}>
                        {provider.description}
                      </Text>
                      <Text style={[styles.providerFees, { color: theme.primary }]}>
                        {provider.fees.payment}% fee
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: adaptiveColors.text }]}>
                  {isRTL ? 'مفتاح API' : 'API Key'}
                </Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: adaptiveColors.background, 
                    borderColor: adaptiveColors.border,
                    color: adaptiveColors.text
                  }]}
                  value={settings.pspApiKey}
                  onChangeText={(text) => setSettings(prev => ({ ...prev, pspApiKey: text }))}
                  placeholder={isRTL ? 'أدخل مفتاح API' : 'Enter API key'}
                  placeholderTextColor={adaptiveColors.textSecondary}
                  secureTextEntry
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: adaptiveColors.text }]}>
                  {isRTL ? 'سر API' : 'API Secret'}
                </Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: adaptiveColors.background, 
                    borderColor: adaptiveColors.border,
                    color: adaptiveColors.text
                  }]}
                  value={settings.pspApiSecret}
                  onChangeText={(text) => setSettings(prev => ({ ...prev, pspApiSecret: text }))}
                  placeholder={isRTL ? 'أدخل سر API' : 'Enter API secret'}
                  placeholderTextColor={adaptiveColors.textSecondary}
                  secureTextEntry
                />
              </View>
            </>
          )}
        </View>

        {/* Conversion Rate */}
        <View style={[styles.section, { backgroundColor: adaptiveColors.surface, borderColor: adaptiveColors.border }]}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: adaptiveColors.text }]}>
              {isRTL ? 'سعر التحويل' : 'Conversion Rate'}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: adaptiveColors.text }]}>
                {isRTL ? 'Guild Coins إلى USD' : 'Guild Coins to USD'}
              </Text>
              <Text style={[styles.settingDescription, { color: adaptiveColors.textSecondary }]}>
                {isRTL 
                  ? 'سعر تحويل عملة GUILD إلى الدولار الأمريكي'
                  : 'Conversion rate from Guild Coins to US Dollar'
                }
              </Text>
            </View>
            <TextInput
              style={[styles.numberInput, { 
                backgroundColor: adaptiveColors.background, 
                borderColor: adaptiveColors.border,
                color: adaptiveColors.text
              }]}
              value={settings.conversionRate.toString()}
              onChangeText={(text) => setSettings(prev => ({ 
                ...prev, 
                conversionRate: parseFloat(text) || 1.0 
              }))}
              keyboardType="numeric"
              placeholder="1.0"
              placeholderTextColor={adaptiveColors.textSecondary}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={saveSettings}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={adaptiveColors.buttonText} />
          ) : (
            <CheckCircle size={20} color={adaptiveColors.buttonText} />
          )}
          <Text style={[styles.saveButtonText, { color: adaptiveColors.buttonText }]}>
            {saving 
              ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
              : (isRTL ? 'حفظ الإعدادات' : 'Save Settings')
            }
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: FONT_FAMILY,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_FAMILY,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    width: 80,
    textAlign: 'center',
  },
  providerScroll: {
    marginTop: 8,
  },
  providerCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 120,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  providerDescription: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  providerFees: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
});



