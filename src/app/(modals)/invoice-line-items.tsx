import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Edit, Save, X, DollarSign, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nProvider';
import { useCustomAlert } from '../../components/CustomAlert';
import { getContrastTextColor } from '../../utils/colorUtils';

const FONT_FAMILY = 'SignikaNegative_400Regular';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  taxRate: number; // percentage
  total: number;
  category: 'service' | 'product' | 'expense' | 'other';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  currency: string;
  notes?: string;
}

const SAMPLE_INVOICE: Invoice = {
  id: 'inv_001',
  invoiceNumber: 'INV-2024-001',
  clientName: 'Tech Solutions Qatar',
  clientEmail: 'billing@techsolutions.qa',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  status: 'draft',
  currency: 'QAR',
  notes: 'Payment terms: Net 30 days. Late payments subject to 1.5% monthly service charge.',
  lineItems: [
    {
      id: 'item_1',
      description: 'Mobile App Development - Frontend',
      quantity: 40,
      unitPrice: 150,
      discount: 10,
      taxRate: 5,
      total: 0,
      category: 'service'
    },
    {
      id: 'item_2', 
      description: 'Backend API Development',
      quantity: 30,
      unitPrice: 180,
      discount: 0,
      taxRate: 5,
      total: 0,
      category: 'service'
    },
    {
      id: 'item_3',
      description: 'UI/UX Design Consultation',
      quantity: 15,
      unitPrice: 120,
      discount: 5,
      taxRate: 5,
      total: 0,
      category: 'service'
    }
  ],
  subtotal: 0,
  totalDiscount: 0,
  totalTax: 0,
  grandTotal: 0
};

export default function InvoiceLineItemsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { t } = useI18n();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const adaptiveColors = {
    background: isDarkMode ? theme.background : '#FFFFFF',
    text: isDarkMode ? theme.text : '#1A1A1A',
    textSecondary: isDarkMode ? theme.textSecondary : '#666666',
    surface: isDarkMode ? theme.surface : '#F8F9FA',
    border: isDarkMode ? theme.border : 'rgba(0,0,0,0.08)',
    primary: theme.primary,
    buttonText: '#000000',
  };

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<Invoice>(SAMPLE_INVOICE);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceLineItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InvoiceLineItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    taxRate: 5,
    category: 'service'
  });

  // Calculate totals
  useEffect(() => {
    calculateInvoiceTotals();
  }, [invoice.lineItems]);

  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const updatedItems = invoice.lineItems.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemAfterDiscount = itemSubtotal - itemDiscount;
      const itemTax = (itemAfterDiscount * item.taxRate) / 100;
      const itemTotal = itemAfterDiscount + itemTax;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;

      return { ...item, total: itemTotal };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    setInvoice(prev => ({
      ...prev,
      lineItems: updatedItems,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal
    }));
  };

  // Handle add/edit item
  const handleSaveItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitPrice) {
      showAlert('Validation Error', 'Please fill in all required fields.', 'warning');
      return;
    }

    const item: InvoiceLineItem = {
      id: editingItem?.id || `item_${Date.now()}`,
      description: newItem.description!,
      quantity: newItem.quantity!,
      unitPrice: newItem.unitPrice!,
      discount: newItem.discount || 0,
      taxRate: newItem.taxRate || 5,
      category: newItem.category || 'service',
      total: 0 // Will be calculated
    };

    if (editingItem) {
      // Update existing item
      setInvoice(prev => ({
        ...prev,
        lineItems: prev.lineItems.map(i => i.id === editingItem.id ? item : i)
      }));
    } else {
      // Add new item
      setInvoice(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, item]
      }));
    }

    // Reset form
    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 5,
      category: 'service'
    });
    setEditingItem(null);
    setShowAddItemModal(false);
  };

  // Handle edit item
  const handleEditItem = (item: InvoiceLineItem) => {
    setEditingItem(item);
    setNewItem({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      category: item.category
    });
    setShowAddItemModal(true);
  };

  // Handle delete item
  const handleDeleteItem = (itemId: string) => {
    showAlert(
      'Delete Item',
      'Are you sure you want to delete this line item?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setInvoice(prev => ({
              ...prev,
              lineItems: prev.lineItems.filter(item => item.id !== itemId)
            }));
          }
        }
      ]
    );
  };

  // Handle save invoice
  const handleSaveInvoice = async () => {
    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showAlert(
        'Invoice Saved',
        `Invoice ${invoice.invoiceNumber} has been saved successfully.`,
        'success'
      );
    } catch (error) {
      console.error('Error saving invoice:', error);
      showAlert('Save Error', 'Failed to save invoice. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle send invoice
  const handleSendInvoice = async () => {
    if (invoice.lineItems.length === 0) {
      showAlert('No Items', 'Please add at least one line item before sending.', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInvoice(prev => ({ ...prev, status: 'sent' }));
      
      showAlert(
        'Invoice Sent',
        `Invoice has been sent to ${invoice.clientEmail}`,
        'success'
      );
    } catch (error) {
      console.error('Error sending invoice:', error);
      showAlert('Send Error', 'Failed to send invoice. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return theme.success;
      case 'sent': return theme.info;
      case 'overdue': return theme.error;
      case 'cancelled': return theme.textSecondary;
      default: return theme.warning;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: InvoiceLineItem['category']) => {
    switch (category) {
      case 'service': return 'construct-outline';
      case 'product': return 'cube-outline';
      case 'expense': return 'receipt-outline';
      default: return 'ellipse-outline';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${invoice.currency}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    invoiceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    invoiceInfo: {
      flex: 1,
    },
    invoiceNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    clientName: {
      fontSize: 16,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginTop: 4,
    },
    clientEmail: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      fontFamily: FONT_FAMILY,
      textTransform: 'uppercase',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateItem: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    dateValue: {
      fontSize: 14,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      fontWeight: '500',
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 12,
    },
    addItemButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    addItemText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
    },
    lineItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    itemInfo: {
      flex: 1,
    },
    itemDescription: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 4,
    },
    itemCategory: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    itemActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: theme.background,
    },
    itemDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    itemTotal: {
      alignItems: 'flex-end',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    totalLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.primary,
      fontFamily: FONT_FAMILY,
    },
    summaryCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    grandTotalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
    },
    grandTotalValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.primary,
      fontFamily: FONT_FAMILY,
    },
    footer: {
      backgroundColor: theme.surface,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    footerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    footerButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    footerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
      marginLeft: 8,
    },
    footerButtonTextSecondary: {
      color: theme.textPrimary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    formGroup: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.textPrimary,
      fontFamily: FONT_FAMILY,
      borderWidth: 1,
      borderColor: theme.border,
    },
    formRow: {
      flexDirection: 'row',
      gap: 12,
    },
    formRowItem: {
      flex: 1,
    },
    categorySelector: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    categoryButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      alignItems: 'center',
    },
    categoryButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      fontFamily: FONT_FAMILY,
      textTransform: 'capitalize',
    },
    categoryButtonTextActive: {
      color: getContrastTextColor(theme.primary),
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalButtonSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: getContrastTextColor(theme.primary),
      fontFamily: FONT_FAMILY,
    },
    modalButtonTextSecondary: {
      color: theme.textPrimary,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Invoice Line Items',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontFamily: FONT_FAMILY },
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.clientName}>{invoice.clientName}</Text>
            <Text style={styles.clientEmail}>{invoice.clientEmail}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={styles.statusText}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Issue Date</Text>
            <Text style={styles.dateValue}>{invoice.issueDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{invoice.dueDate.toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Line Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => setShowAddItemModal(true)}
          >
            <Ionicons name="add" size={20} color={getContrastTextColor(theme.primary)} />
            <Text style={styles.addItemText}>Add Line Item</Text>
          </TouchableOpacity>

          {invoice.lineItems.map((item) => (
            <View key={item.id} style={styles.lineItem}>
              <View style={styles.itemHeader}>
                <View style={styles.categoryIcon}>
                  <Ionicons 
                    name={getCategoryIcon(item.category)} 
                    size={16} 
                    color={theme.primary} 
                  />
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditItem(item)}
                  >
                    <Ionicons name="pencil" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Ionicons name="trash" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>QTY</Text>
                  <Text style={styles.detailValue}>{item.quantity}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>UNIT PRICE</Text>
                  <Text style={styles.detailValue}>{formatCurrency(item.unitPrice)}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>DISCOUNT</Text>
                  <Text style={styles.detailValue}>{item.discount}%</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>TAX</Text>
                  <Text style={styles.detailValue}>{item.taxRate}%</Text>
                </View>
              </View>

              <View style={styles.itemTotal}>
                <Text style={styles.totalLabel}>Line Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Invoice Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Discount</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(invoice.totalDiscount)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Tax</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.totalTax)}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonSecondary]}
            onPress={handleSaveInvoice}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.textPrimary} />
            ) : (
              <Ionicons name="save" size={20} color={theme.textPrimary} />
            )}
            <Text style={[styles.footerButtonText, styles.footerButtonTextSecondary]}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleSendInvoice}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={getContrastTextColor(theme.primary)} />
            ) : (
              <Ionicons name="send" size={20} color={getContrastTextColor(theme.primary)} />
            )}
            <Text style={styles.footerButtonText}>
              {loading ? 'Sending...' : 'Send Invoice'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={showAddItemModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Line Item' : 'Add Line Item'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddItemModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newItem.description}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, description: text }))}
                  placeholder="Enter item description"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowItem}>
                  <Text style={styles.formLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newItem.quantity?.toString()}
                    onChangeText={(text) => setNewItem(prev => ({ ...prev, quantity: parseInt(text) || 0 }))}
                    placeholder="1"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formRowItem}>
                  <Text style={styles.formLabel}>Unit Price *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newItem.unitPrice?.toString()}
                    onChangeText={(text) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(text) || 0 }))}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowItem}>
                  <Text style={styles.formLabel}>Discount (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newItem.discount?.toString()}
                    onChangeText={(text) => setNewItem(prev => ({ ...prev, discount: parseFloat(text) || 0 }))}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formRowItem}>
                  <Text style={styles.formLabel}>Tax Rate (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newItem.taxRate?.toString()}
                    onChangeText={(text) => setNewItem(prev => ({ ...prev, taxRate: parseFloat(text) || 0 }))}
                    placeholder="5"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categorySelector}>
                  {(['service', 'product', 'expense', 'other'] as const).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        newItem.category === category && styles.categoryButtonActive
                      ]}
                      onPress={() => setNewItem(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        newItem.category === category && styles.categoryButtonTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowAddItemModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSaveItem}
              >
                <Text style={styles.modalButtonText}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertComponent />
    </View>
  );
}
