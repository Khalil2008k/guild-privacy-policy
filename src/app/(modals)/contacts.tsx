import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Users, User, MessageSquare, Phone, Mail, Search, UserPlus } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContactsService, Contact } from '../../services/ContactsService';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

export default function ContactsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  const [isAdding, setIsAdding] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  // If we're adding a contact from scanned user profile
  useEffect(() => {
    if (params.action === 'add' && params.userId) {
      handleAddContact();
    }
  }, [params.action, params.userId]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const contactsList = await ContactsService.getContacts();
      setContacts(contactsList);
    } catch (error) {
      console.error('Error loading contacts:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'تعذر تحميل جهات الاتصال' : 'Could not load contacts'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const handleAddContact = async () => {
    if (!params.userId || !params.userName) return;
    
    setIsAdding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await ContactsService.addContact({
        userId: params.userId as string,
        name: params.userName as string,
        guild: params.userGuild as string,
        gid: params.userGid as string,
        profileImage: params.profileImage as string,
      });
      
      // Reload contacts
      await loadContacts();
      
      CustomAlertService.showSuccess(
        isRTL ? 'تم الإضافة' : 'Contact Added',
        isRTL 
          ? `تم إضافة ${params.userName} إلى جهات الاتصال بنجاح`
          : `${params.userName} has been added to your contacts successfully`,
        [
          {
            text: isRTL ? 'حسناً' : 'OK',
            style: 'default',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error adding contact:', error);
      CustomAlertService.showError(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'تعذر إضافة جهة الاتصال' : 'Could not add contact'
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    CustomAlertService.showConfirmation(
      isRTL ? 'حذف جهة الاتصال' : 'Delete Contact',
      isRTL 
        ? `هل أنت متأكد من حذف ${contactName} من جهات الاتصال؟`
        : `Are you sure you want to delete ${contactName} from your contacts?`,
      async () => {
        try {
          await ContactsService.deleteContact(contactId);
          await loadContacts();
          CustomAlertService.showSuccess(
            isRTL ? 'تم الحذف' : 'Deleted',
            isRTL ? 'تم حذف جهة الاتصال' : 'Contact deleted successfully'
          );
        } catch (error) {
          console.error('Error deleting contact:', error);
          CustomAlertService.showError(
            isRTL ? 'خطأ' : 'Error',
            isRTL ? 'تعذر حذف جهة الاتصال' : 'Could not delete contact'
          );
        }
      },
      undefined,
      isRTL
    );
  };

  const handleContactPress = (contact: Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(modals)/chat/[jobId]',
      params: {
        jobId: `user-${contact.userId}`,
        userId: contact.userId,
        userName: contact.name,
        userGuild: contact.guild
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={handleBack}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'جهات الاتصال' : 'Contacts'}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {isAdding ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="person-add" size={64} color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
              {isRTL ? 'جاري إضافة جهة الاتصال...' : 'Adding contact...'}
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>
              {isRTL ? 'جاري التحميل...' : 'Loading contacts...'}
            </Text>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.contactsContainer}>
            <MaterialIcons name="contacts" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {isRTL ? 'لا توجد جهات اتصال' : 'No Contacts'}
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              {isRTL 
                ? 'ستظهر جهات الاتصال هنا عند إضافتها'
                : 'Your contacts will appear here when added'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[styles.contactItem, { 
                  backgroundColor: adaptiveColors.surface, 
                  borderColor: adaptiveColors.border 
                }]}
                onPress={() => handleContactPress(contact)}
                activeOpacity={0.7}
              >
                {/* Avatar */}
                <View style={styles.contactAvatarContainer}>
                  {contact.profileImage && contact.profileImage !== 'No image' ? (
                    <Image 
                      source={{ uri: contact.profileImage }} 
                      style={styles.contactAvatarImage}
                    />
                  ) : (
                    <View style={[styles.contactAvatar, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[styles.contactAvatarText, { color: theme.primary }]}>
                        {contact.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  {contact.guild && (
                    <View style={[styles.guildBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.guildBadgeText}>
                        {contact.guild}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Contact Info */}
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: adaptiveColors.text }]}>
                    {contact.name}
                  </Text>
                  {contact.gid && (
                    <Text style={[styles.contactGid, { color: adaptiveColors.textSecondary }]}>
                      {isRTL ? 'معرف GUILD:' : 'GUILD ID:'} {contact.gid}
                    </Text>
                  )}
                  {contact.phoneNumber && (
                    <View style={styles.contactDetail}>
                      <Phone size={14} color={adaptiveColors.textSecondary} />
                      <Text style={[styles.contactDetailText, { color: adaptiveColors.textSecondary }]}>
                        {contact.phoneNumber}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={[styles.contactActionButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleContactPress(contact)}
                  >
                    <MessageSquare size={20} color="#000000" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.contactActionButton, { backgroundColor: 'rgba(255,0,0,0.1)' }]}
                    onPress={() => handleDeleteContact(contact.id, contact.name)}
                  >
                    <MaterialIcons name="delete" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    marginTop: 16,
    textAlign: 'center',
  },
  contactsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  contactsList: {
    paddingVertical: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  contactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  contactAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  guildBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  guildBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    color: '#000000',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  contactGid: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactDetailText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    marginLeft: 6,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
