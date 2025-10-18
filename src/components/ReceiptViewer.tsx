/**
 * 📄 ENTERPRISE RECEIPT VIEWER COMPONENT
 * 
 * Features:
 * - Digital receipt display with verification
 * - QR code for verification
 * - Share & download functionality
 * - Print-ready layout
 * - Fee breakdown display
 * - Theme support (light/dark)
 * - RTL support
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { CustomAlertService } from '../services/CustomAlertService';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Download, Share2, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { RTLText, RTLView } from '../app/components/primitives/primitives';
import { Receipt, walletAPIClient } from '../services/walletAPIClient';

interface ReceiptViewerProps {
  receipt: Receipt;
  onClose?: () => void;
}

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ receipt, onClose }) => {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  
  // ==========================================================================
  // VERIFY RECEIPT
  // ==========================================================================
  
  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await walletAPIClient.verifyReceipt(
        receipt.receiptNumber,
        receipt.digitalSignature
      );
      setVerified(result.isValid);
      
      if (result.isValid) {
        CustomAlertService.showSuccess('Receipt Verified ✅', result.message);
      } else {
        CustomAlertService.showError('Verification Failed ❌', result.message);
      }
    } catch (error) {
      CustomAlertService.showError('Verification Error', 'Failed to verify receipt');
      console.error('Receipt verification error:', error);
    } finally {
      setVerifying(false);
    }
  };
  
  // ==========================================================================
  // SHARE RECEIPT
  // ==========================================================================
  
  const handleShare = async () => {
    try {
      const message = `
GUILD Receipt

Receipt #: ${receipt.receiptNumber}
Transaction #: ${receipt.transactionId}
Date: ${new Date(receipt.issuedAt).toLocaleString()}

User: ${receipt.fullName}
GID: ${receipt.guildId}

Type: ${receipt.type}
Amount: ${receipt.amount} ${receipt.currency}

${receipt.fees ? `
Fees:
- Platform: ${receipt.fees.platform} ${receipt.currency}
- Escrow: ${receipt.fees.escrow} ${receipt.currency}
- Zakat: ${receipt.fees.zakat} ${receipt.currency}
Total Fees: ${receipt.fees.total} ${receipt.currency}
` : ''}

Issued by: GUILD Platform
Digital Signature: ${receipt.digitalSignature.substring(0, 20)}...

This is an official receipt from GUILD Platform.
Verify at: https://guild.qa/verify/${receipt.receiptNumber}
      `.trim();
      
      await Share.share({
        message,
        title: `GUILD Receipt ${receipt.receiptNumber}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };
  
  // ==========================================================================
  // DOWNLOAD RECEIPT (Future: Generate PDF)
  // ==========================================================================
  
  const handleDownload = () => {
    CustomAlertService.showInfo(
      'Download Receipt',
      'PDF download feature coming soon!',
      [
        { text: 'Share Instead', style: 'default', onPress: handleShare },
        { text: 'Cancel', style: 'default' }
      ]
    );
  };
  
  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header with branding */}
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Shield size={48} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.headerTitle}>GUILD</Text>
        <Text style={styles.headerSubtitle}>Official Receipt</Text>
      </LinearGradient>
      
      {/* Receipt Content */}
      <View style={[styles.receiptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        
        {/* Receipt Number */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Receipt Number</Text>
          <Text style={[styles.value, { color: theme.text }]}>{receipt.receiptNumber}</Text>
        </View>
        
        {/* Transaction Number */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Transaction Number</Text>
          <Text style={[styles.value, { color: theme.text }]}>{receipt.transactionId}</Text>
        </View>
        
        {/* Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Date & Time</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {new Date(receipt.issuedAt).toLocaleString('en-US', {
              dateStyle: 'long',
              timeStyle: 'short'
            })}
          </Text>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        {/* User Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>User Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{receipt.fullName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>GID:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{receipt.guildId}</Text>
          </View>
          
          {receipt.govId && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Gov ID:</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{receipt.govId}</Text>
            </View>
          )}
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        {/* Transaction Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction Details</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Type:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{receipt.type}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Status:</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: receipt.status === 'SUCCESS' ? theme.success + '20' : theme.warning + '20' 
            }]}>
              <Text style={[styles.statusText, { 
                color: receipt.status === 'SUCCESS' ? theme.success : theme.warning 
              }]}>
                {receipt.status}
              </Text>
            </View>
          </View>
          
          <View style={[styles.amountRow, { backgroundColor: theme.background }]}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Gross Amount:</Text>
            <Text style={[styles.amountValue, { color: theme.text }]}>
              {receipt.currency} {receipt.amount.toFixed(2)}
            </Text>
          </View>
        </View>
        
        {/* Fees Breakdown (if applicable) */}
        {receipt.fees && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Fee Breakdown</Text>
              
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Platform Fee (5%):</Text>
                <Text style={[styles.feeValue, { color: theme.text }]}>
                  {receipt.currency} {receipt.fees.platform.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Escrow Fee (10%):</Text>
                <Text style={[styles.feeValue, { color: theme.text }]}>
                  {receipt.currency} {receipt.fees.escrow.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Zakat (2.5%):</Text>
                <Text style={[styles.feeValue, { color: theme.text }]}>
                  {receipt.currency} {receipt.fees.zakat.toFixed(2)}
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 8 }]} />
              
              <View style={styles.feeRow}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>Total Fees:</Text>
                <Text style={[styles.totalValue, { color: theme.error }]}>
                  {receipt.currency} {receipt.fees.total.toFixed(2)}
                </Text>
              </View>
              
              <View style={[styles.amountRow, { backgroundColor: theme.primary + '10', marginTop: 12 }]}>
                <Text style={[styles.totalLabel, { color: theme.primary }]}>Net Amount:</Text>
                <Text style={[styles.totalValue, { color: theme.primary }]}>
                  {receipt.currency} {(receipt.amount - receipt.fees.total).toFixed(2)}
                </Text>
              </View>
            </View>
          </>
        )}
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Verification</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Issued By:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{receipt.issuedBy}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Digital Signature:</Text>
            <Text style={[styles.signatureValue, { color: theme.textSecondary }]} numberOfLines={1}>
              {receipt.digitalSignature}
            </Text>
          </View>
          
          {verified !== null && (
            <View style={[styles.verificationBadge, { 
              backgroundColor: verified ? theme.success + '20' : theme.error + '20',
              borderColor: verified ? theme.success : theme.error
            }]}>
              {verified ? (
                <CheckCircle size={20} color={theme.success} />
              ) : (
                <AlertCircle size={20} color={theme.error} />
              )}
              <Text style={[styles.verificationText, { 
                color: verified ? theme.success : theme.error 
              }]}>
                {verified ? 'Receipt Verified ✅' : 'Verification Failed ❌'}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleVerify}
          disabled={verifying}
        >
          <Shield size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {verifying ? 'Verifying...' : 'Verify Receipt'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.success }]}
          onPress={handleShare}
        >
          <Share2 size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.info }]}
          onPress={handleDownload}
        >
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ==============================================================================
// STYLES
// ==============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  receiptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  signatureValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 2,
    textAlign: 'right',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 12,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});






