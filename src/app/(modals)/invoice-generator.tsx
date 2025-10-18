import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { CustomAlertService } from '../../services/CustomAlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const FONT_FAMILY = 'Signika Negative SC';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  paymentTerms: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  taxRate: number;
  paymentTerms: string;
  isDefault: boolean;
}

export default function InvoiceGeneratorScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [selectedTab, setSelectedTab] = useState<'create' | 'templates' | 'history'>('create');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    currency: 'QAR',
    taxRate: 5, // Default 5% VAT for Qatar
    paymentTerms: 'Net 30',
    items: [],
  });

  // Mock data
  const invoiceTemplates: InvoiceTemplate[] = [
    {
      id: 'template_1',
      name: 'Web Development',
      description: 'Standard web development project template',
      items: [
        { description: 'Frontend Development', quantity: 1, unitPrice: 15000 },
        { description: 'Backend Development', quantity: 1, unitPrice: 12000 },
        { description: 'Database Setup', quantity: 1, unitPrice: 3000 },
        { description: 'Testing & Deployment', quantity: 1, unitPrice: 2000 },
      ],
      taxRate: 5,
      paymentTerms: 'Net 30',
      isDefault: true,
    },
    {
      id: 'template_2',
      name: 'Mobile App Development',
      description: 'Complete mobile application development',
      items: [
        { description: 'UI/UX Design', quantity: 1, unitPrice: 8000 },
        { description: 'iOS Development', quantity: 1, unitPrice: 20000 },
        { description: 'Android Development', quantity: 1, unitPrice: 18000 },
        { description: 'App Store Deployment', quantity: 1, unitPrice: 2000 },
      ],
      taxRate: 5,
      paymentTerms: 'Net 15',
      isDefault: false,
    },
    {
      id: 'template_3',
      name: 'Consulting Services',
      description: 'Hourly consulting and advisory services',
      items: [
        { description: 'Technical Consultation', quantity: 10, unitPrice: 500 },
        { description: 'Project Planning', quantity: 5, unitPrice: 600 },
        { description: 'Code Review', quantity: 3, unitPrice: 400 },
      ],
      taxRate: 5,
      paymentTerms: 'Net 15',
      isDefault: false,
    },
  ];

  const invoiceHistory: Invoice[] = [
    {
      id: 'inv_001',
      invoiceNumber: 'INV-2025-001',
      clientName: 'TechCorp Solutions',
      clientEmail: 'billing@techcorp.com',
      projectTitle: 'E-commerce Platform Development',
      issueDate: '2025-09-15',
      dueDate: '2025-10-15',
      status: 'sent',
      items: [
        { id: '1', description: 'Frontend Development', quantity: 1, unitPrice: 15000, total: 15000 },
        { id: '2', description: 'Backend Development', quantity: 1, unitPrice: 12000, total: 12000 },
      ],
      subtotal: 27000,
      taxRate: 5,
      taxAmount: 1350,
      totalAmount: 28350,
      currency: 'QAR',
      paymentTerms: 'Net 30',
    },
    {
      id: 'inv_002',
      invoiceNumber: 'INV-2025-002',
      clientName: 'StartupHub Qatar',
      clientEmail: 'finance@startuphub.qa',
      projectTitle: 'Mobile App UI/UX Design',
      issueDate: '2025-09-10',
      dueDate: '2025-09-25',
      status: 'paid',
      items: [
        { id: '1', description: 'UI/UX Design', quantity: 1, unitPrice: 8000, total: 8000 },
        { id: '2', description: 'Prototype Development', quantity: 1, unitPrice: 4000, total: 4000 },
      ],
      subtotal: 12000,
      taxRate: 5,
      taxAmount: 600,
      totalAmount: 12600,
      currency: 'QAR',
      paymentTerms: 'Net 15',
    },
    {
      id: 'inv_003',
      invoiceNumber: 'INV-2025-003',
      clientName: 'Digital Innovations LLC',
      clientEmail: 'accounts@digitalinnovations.com',
      projectTitle: 'Website Maintenance - Q3 2025',
      issueDate: '2025-08-30',
      dueDate: '2025-09-30',
      status: 'overdue',
      items: [
        { id: '1', description: 'Monthly Maintenance', quantity: 3, unitPrice: 1500, total: 4500 },
        { id: '2', description: 'Security Updates', quantity: 1, unitPrice: 2000, total: 2000 },
      ],
      subtotal: 6500,
      taxRate: 5,
      taxAmount: 325,
      totalAmount: 6825,
      currency: 'QAR',
      paymentTerms: 'Net 30',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return theme.textSecondary;
      case 'sent': return theme.info;
      case 'paid': return theme.success;
      case 'overdue': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const calculateInvoiceTotal = () => {
    const items = currentInvoice.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * ((currentInvoice.taxRate || 0) / 100);
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setCurrentInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateInvoiceItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: (prev.items || []).map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const removeInvoiceItem = (itemId: string) => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.id !== itemId),
    }));
  };

  const applyTemplate = (template: InvoiceTemplate) => {
    const items = template.items.map(item => ({
      id: Date.now().toString() + Math.random(),
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    
    setCurrentInvoice(prev => ({
      ...prev,
      items,
      taxRate: template.taxRate,
      paymentTerms: template.paymentTerms,
    }));
    setShowTemplateModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const generateInvoice = () => {
    if (!currentInvoice.clientName || !currentInvoice.projectTitle || !currentInvoice.items?.length) {
      CustomAlertService.showError(
        isRTL ? 'معلومات ناقصة' : 'Missing Information',
        isRTL ? 'يرجى ملء جميع الحقول المطلوبة وإضافة عنصر واحد على الأقل' : 'Please fill in all required fields and add at least one item'
      );
      return;
    }

    const { subtotal, taxAmount, total } = calculateInvoiceTotal();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceHistory.length + 1).padStart(3, '0')}`;
    
    CustomAlertService.showSuccess(
      isRTL ? 'تم إنشاء الفاتورة' : 'Invoice Generated',
      isRTL ? `تم إنشاء الفاتورة رقم ${invoiceNumber} بنجاح` : `Invoice ${invoiceNumber} has been generated successfully`,
      [
        { text: isRTL ? 'إرسال' : 'Send', style: 'default', onPress: () => console.log('Send invoice') },
        { text: isRTL ? 'حفظ كمسودة' : 'Save as Draft', style: 'default', onPress: () => console.log('Save as draft') },
        { text: isRTL ? 'معاينة' : 'Preview', style: 'default', onPress: () => console.log('Preview invoice') },
      ]
    );
  };

  const renderCreateInvoice = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Client Information */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          {isRTL ? 'معلومات العميل' : 'Client Information'}
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'اسم العميل *' : 'Client Name *'}
          </Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
            value={currentInvoice.clientName || ''}
            onChangeText={(text) => setCurrentInvoice(prev => ({ ...prev, clientName: text }))}
            placeholder={isRTL ? 'أدخل اسم العميل' : 'Enter client name'}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
          </Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
            value={currentInvoice.clientEmail || ''}
            onChangeText={(text) => setCurrentInvoice(prev => ({ ...prev, clientEmail: text }))}
            placeholder={isRTL ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            {isRTL ? 'عنوان المشروع *' : 'Project Title *'}
          </Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
            value={currentInvoice.projectTitle || ''}
            onChangeText={(text) => setCurrentInvoice(prev => ({ ...prev, projectTitle: text }))}
            placeholder={isRTL ? 'أدخل عنوان المشروع' : 'Enter project title'}
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      </View>

      {/* Invoice Items */}
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'عناصر الفاتورة' : 'Invoice Items'}
          </Text>
          <TouchableOpacity
            style={[styles.templateButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
            onPress={() => setShowTemplateModal(true)}
          >
            <Ionicons name="document-text" size={16} color={theme.primary} />
            <Text style={[styles.templateButtonText, { color: theme.primary }]}>
              {isRTL ? 'قوالب' : 'Templates'}
            </Text>
          </TouchableOpacity>
        </View>

        {(currentInvoice.items || []).map((item, index) => (
          <View key={item.id} style={[styles.invoiceItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemNumber, { color: theme.textSecondary }]}>
                {isRTL ? `العنصر ${index + 1}` : `Item ${index + 1}`}
              </Text>
              <TouchableOpacity
                onPress={() => removeInvoiceItem(item.id)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={16} color={theme.error} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
              value={item.description}
              onChangeText={(text) => updateInvoiceItem(item.id, 'description', text)}
              placeholder={isRTL ? 'وصف الخدمة' : 'Service description'}
              placeholderTextColor={theme.textSecondary}
            />

            <View style={styles.itemRow}>
              <View style={styles.itemField}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'الكمية' : 'Qty'}
                </Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                  value={item.quantity.toString()}
                  onChangeText={(text) => updateInvoiceItem(item.id, 'quantity', parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.itemField}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'السعر' : 'Price'}
                </Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                  value={item.unitPrice.toString()}
                  onChangeText={(text) => updateInvoiceItem(item.id, 'unitPrice', parseFloat(text) || 0)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.itemField}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  {isRTL ? 'المجموع' : 'Total'}
                </Text>
                <Text style={[styles.itemTotal, { color: theme.primary }]}>
                  {currentInvoice.currency} {item.total.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addItemButton, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
          onPress={addInvoiceItem}
        >
          <Ionicons name="add" size={20} color={theme.primary} />
          <Text style={[styles.addItemText, { color: theme.primary }]}>
            {isRTL ? 'إضافة عنصر' : 'Add Item'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Invoice Summary */}
      {(currentInvoice.items || []).length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {isRTL ? 'ملخص الفاتورة' : 'Invoice Summary'}
          </Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {isRTL ? 'المجموع الفرعي:' : 'Subtotal:'}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {currentInvoice.currency} {calculateInvoiceTotal().subtotal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {isRTL ? `الضريبة (${currentInvoice.taxRate}%):` : `Tax (${currentInvoice.taxRate}%):`}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {currentInvoice.currency} {calculateInvoiceTotal().taxAmount.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.textPrimary }]}>
              {isRTL ? 'المجموع الكلي:' : 'Total Amount:'}
            </Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>
              {currentInvoice.currency} {calculateInvoiceTotal().total.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor: theme.primary }]}
        onPress={generateInvoice}
      >
        <Ionicons name="document-text" size={20} color="#000000" />
        <Text style={[styles.generateButtonText, { color: '#000000' }]}>
          {isRTL ? 'إنشاء الفاتورة' : 'Generate Invoice'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );

  const renderTemplates = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {invoiceTemplates.map((template) => (
        <View key={template.id} style={[styles.templateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.templateHeader}>
            <View style={styles.templateInfo}>
              <Text style={[styles.templateName, { color: theme.textPrimary }]}>
                {template.name}
              </Text>
              <Text style={[styles.templateDescription, { color: theme.textSecondary }]}>
                {template.description}
              </Text>
            </View>
            {template.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.defaultBadgeText, { color: theme.primary }]}>
                  {isRTL ? 'افتراضي' : 'Default'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.templateItems}>
            {template.items.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.templateItemRow}>
                <Text style={[styles.templateItemDesc, { color: theme.textSecondary }]}>
                  {item.description}
                </Text>
                <Text style={[styles.templateItemPrice, { color: theme.textPrimary }]}>
                  QAR {(item.quantity * item.unitPrice).toLocaleString()}
                </Text>
              </View>
            ))}
            {template.items.length > 3 && (
              <Text style={[styles.moreItems, { color: theme.textSecondary }]}>
                +{template.items.length - 3} {isRTL ? 'عنصر آخر' : 'more items'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.useTemplateButton, { backgroundColor: theme.primary }]}
            onPress={() => applyTemplate(template)}
          >
            <Text style={[styles.useTemplateButtonText, { color: '#000000' }]}>
              {isRTL ? 'استخدام القالب' : 'Use Template'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {invoiceHistory.map((invoice) => (
        <View key={invoice.id} style={[styles.invoiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceInfo}>
              <Text style={[styles.invoiceNumber, { color: theme.primary }]}>
                {invoice.invoiceNumber}
              </Text>
              <Text style={[styles.clientName, { color: theme.textPrimary }]}>
                {invoice.clientName}
              </Text>
              <Text style={[styles.projectTitle, { color: theme.textSecondary }]}>
                {invoice.projectTitle}
              </Text>
            </View>
            <View style={styles.invoiceStatus}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(invoice.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(invoice.status) }
                ]}>
                  {invoice.status === 'draft' ? (isRTL ? 'مسودة' : 'Draft') :
                   invoice.status === 'sent' ? (isRTL ? 'مرسلة' : 'Sent') :
                   invoice.status === 'paid' ? (isRTL ? 'مدفوعة' : 'Paid') :
                   (isRTL ? 'متأخرة' : 'Overdue')}
                </Text>
              </View>
              <Text style={[styles.invoiceAmount, { color: theme.primary }]}>
                {invoice.currency} {invoice.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.invoiceDates}>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {isRTL ? 'تاريخ الإصدار:' : 'Issued:'} {invoice.issueDate}
            </Text>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {isRTL ? 'تاريخ الاستحقاق:' : 'Due:'} {invoice.dueDate}
            </Text>
          </View>

          <View style={styles.invoiceActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 1 }]}
              onPress={() => console.log('View invoice:', invoice.id)}
            >
              <Ionicons name="eye-outline" size={16} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                {isRTL ? 'عرض' : 'View'}
              </Text>
            </TouchableOpacity>

            {invoice.status === 'draft' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.success + '20', borderColor: theme.success, borderWidth: 1 }]}
                onPress={() => console.log('Send invoice:', invoice.id)}
              >
                <Ionicons name="send-outline" size={16} color={theme.success} />
                <Text style={[styles.actionButtonText, { color: theme.success }]}>
                  {isRTL ? 'إرسال' : 'Send'}
                </Text>
              </TouchableOpacity>
            )}

            {invoice.status === 'sent' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning, borderWidth: 1 }]}
                onPress={() => console.log('Mark as paid:', invoice.id)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.warning} />
                <Text style={[styles.actionButtonText, { color: theme.warning }]}>
                  {isRTL ? 'تم الدفع' : 'Mark Paid'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.info + '20', borderColor: theme.info, borderWidth: 1 }]}
              onPress={() => console.log('Download invoice:', invoice.id)}
            >
              <Ionicons name="download-outline" size={16} color={theme.info} />
              <Text style={[styles.actionButtonText, { color: theme.info }]}>
                {isRTL ? 'تحميل' : 'Download'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'CC']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="document-text" size={28} color="#000000" />
            <Text style={[styles.headerTitle, { color: '#000000' }]}>
              {isRTL ? 'منشئ الفواتير' : 'Invoice Generator'}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: '#000000CC' }]}>
            {isRTL ? 'إنشاء وإدارة الفواتير المهنية' : 'Create & Manage Professional Invoices'}
          </Text>
        </View>
        
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {[
          { key: 'create', label: isRTL ? 'إنشاء' : 'Create', icon: 'add-circle-outline' },
          { key: 'templates', label: isRTL ? 'القوالب' : 'Templates', icon: 'document-text-outline' },
          { key: 'history', label: isRTL ? 'السجل' : 'History', icon: 'time-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              {
                backgroundColor: selectedTab === tab.key ? theme.primary : 'transparent',
                borderColor: selectedTab === tab.key ? theme.primary : 'transparent',
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTab(tab.key as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.key ? '#000000' : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: selectedTab === tab.key ? '#000000' : theme.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {selectedTab === 'create' && renderCreateInvoice()}
      {selectedTab === 'templates' && renderTemplates()}
      {selectedTab === 'history' && renderHistory()}

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.templateModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {isRTL ? 'اختر قالب' : 'Select Template'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowTemplateModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={invoiceTemplates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalTemplateItem, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => applyTemplate(item)}
                >
                  <Text style={[styles.modalTemplateName, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.modalTemplateDesc, { color: theme.textSecondary }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.modalTemplateItems, { color: theme.textSecondary }]}>
                    {item.items.length} {isRTL ? 'عنصر' : 'items'}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  templateButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  invoiceItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  itemField: {
    flex: 1,
  },
  itemTotal: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addItemText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  generateButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
  },
  // Template styles
  templateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  templateDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  templateItems: {
    marginBottom: 16,
  },
  templateItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  templateItemDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    flex: 1,
  },
  templateItemPrice: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  moreItems: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  useTemplateButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  useTemplateButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  // History styles
  invoiceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  clientName: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  projectTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
  },
  invoiceStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
  },
  invoiceDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateModal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalTemplateItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    margin: 8,
  },
  modalTemplateName: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalTemplateDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginBottom: 8,
  },
  modalTemplateItems: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
});
