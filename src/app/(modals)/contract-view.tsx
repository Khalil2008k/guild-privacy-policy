/**
 * Contract View Screen
 * View, sign, and export contracts with bilingual support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Download,
  Share2,
  CheckCircle,
  FileText,
  Globe,
  ArrowLeft
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nProvider';
import { useAuth } from '@/contexts/AuthContext';
import { CustomAlertService } from '@/services/CustomAlertService';
import contractService, { JobContract } from '@/services/contractService';
import ContractDocument from '@/components/ContractDocument';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ContractViewScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
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
  
  const [contract, setContract] = useState<JobContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    try {
      const contractId = params.contractId as string;
      if (!contractId) {
        throw new Error('Contract ID is required');
      }

      const contractData = await contractService.getContract(contractId);
      if (!contractData) {
        throw new Error('Contract not found');
      }

      setContract(contractData);
      setLanguage(contractData.language);
    } catch (error) {
      console.error('Error loading contract:', error);
      CustomAlertService.showError(
        t('error'),
        'Failed to load contract'
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!contract || !user) return;

    const userRole = contract.poster.userId === user.uid ? 'poster' : 'doer';
    const userGID = contract.poster.userId === user.uid ? contract.poster.gid : contract.doer.gid;

    CustomAlertService.showConfirmation(
      language === 'ar' ? 'تأكيد التوقيع' : 'Confirm Signature',
      language === 'ar' 
        ? `هل تريد التوقيع على هذا العقد باستخدام GID الخاص بك (${userGID})؟ بعد التوقيع، سيصبح العقد ملزمًا قانونيًا.`
        : `Do you want to sign this contract with your GID (${userGID})? After signing, the contract becomes legally binding.`,
      async () => {
        setSigning(true);
        try {
          await contractService.signContract(
            contract.id,
            user.uid,
            userGID,
            userRole
          );

          CustomAlertService.showSuccess(
            language === 'ar' ? 'تم التوقيع' : 'Signed Successfully',
            language === 'ar' 
              ? 'تم توقيع العقد بنجاح' 
              : 'Contract signed successfully'
          );

          // Reload contract
          await loadContract();
        } catch (error) {
          console.error('Error signing contract:', error);
          CustomAlertService.showError(
            t('error'),
            'Failed to sign contract'
          );
        } finally {
          setSigning(false);
        }
      },
      undefined,
      false
    );
  };

  const generatePDFHTML = (): string => {
    if (!contract) return '';

    const isRTL = language === 'ar';
    const formatDate = (date: any): string => {
      if (!date) return 'N/A';
      const d = date.toDate ? date.toDate() : date;
      return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return `
<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contract.jobTitle} - Contract</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      direction: ${isRTL ? 'rtl' : 'ltr'};
    }
    .page {
      page-break-after: always;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 15px;
    }
    .header h1 {
      color: #4CAF50;
      font-size: 24pt;
      letter-spacing: 2px;
    }
    .header p {
      color: #666;
      font-size: 14pt;
      margin-top: 5px;
    }
    .contract-info {
      text-align: ${isRTL ? 'right' : 'left'};
      font-size: 10pt;
      color: #666;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    .content {
      font-size: 11pt;
      color: #555;
    }
    .party-box {
      background: #F9F9F9;
      border: 1px solid #E0E0E0;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .party-name {
      font-size: 13pt;
      font-weight: bold;
      color: #333;
    }
    .party-gid {
      font-size: 11pt;
      color: #4CAF50;
      font-weight: bold;
    }
    .financial-box {
      background: #F0F8F0;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    .budget-amount {
      font-size: 18pt;
      font-weight: bold;
      color: #4CAF50;
    }
    .list-item {
      margin-left: ${isRTL ? '0' : '20px'};
      margin-right: ${isRTL ? '20px' : '0'};
      margin-bottom: 8px;
    }
    .split-container {
      display: flex;
      gap: 20px;
    }
    .half-section {
      flex: 1;
    }
    .rule-item {
      margin-bottom: 10px;
      font-size: 10pt;
    }
    .signatures-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #E0E0E0;
    }
    .signature-box {
      background: #F9F9F9;
      border: 1px solid #E0E0E0;
      padding: 15px;
      border-radius: 5px;
      display: inline-block;
      width: 48%;
      margin: 1%;
    }
    .signature-line {
      height: 2px;
      background: #4CAF50;
      margin: 10px 0;
    }
    .page-footer {
      text-align: center;
      font-size: 9pt;
      color: #999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="page">
    <div class="header">
      <h1>GUILD</h1>
      <p>${language === 'ar' ? 'عقد عمل رقمي' : 'Digital Work Contract'}</p>
    </div>

    <div class="contract-info">
      <p>${language === 'ar' ? 'رقم العقد:' : 'Contract ID:'} ${contract.id}</p>
      <p>${language === 'ar' ? 'تاريخ الإنشاء:' : 'Date:'} ${formatDate(contract.createdAt)}</p>
    </div>

    <div class="section">
      <h2 class="section-title">${language === 'ar' ? '١. عنوان المشروع' : '1. Project Title'}</h2>
      <p class="content">${contract.jobTitle}</p>
    </div>

    <div class="section">
      <h2 class="section-title">${language === 'ar' ? '٢. الأطراف المتعاقدة' : '2. Contracting Parties'}</h2>
      
      <div class="party-box">
        <p style="font-size: 10pt; color: #666;">${language === 'ar' ? 'الطرف الأول (صاحب العمل)' : 'Party A (Job Poster)'}</p>
        <p class="party-name">${contract.poster.name}</p>
        <p class="party-gid">GID: ${contract.poster.gid}</p>
        ${contract.posterSignature ? `<p style="font-size: 10pt; color: #4CAF50;">✓ ${language === 'ar' ? 'موقّع في' : 'Signed on'} ${formatDate(contract.posterSignature.signedAt)}</p>` : ''}
      </div>

      <div class="party-box">
        <p style="font-size: 10pt; color: #666;">${language === 'ar' ? 'الطرف الثاني (منفذ العمل)' : 'Party B (Job Doer)'}</p>
        <p class="party-name">${contract.doer.name}</p>
        <p class="party-gid">GID: ${contract.doer.gid}</p>
        ${contract.doerSignature ? `<p style="font-size: 10pt; color: #4CAF50;">✓ ${language === 'ar' ? 'موقّع في' : 'Signed on'} ${formatDate(contract.doerSignature.signedAt)}</p>` : ''}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">${language === 'ar' ? '٣. الشروط المالية' : '3. Financial Terms'}</h2>
      <div class="financial-box">
        <p style="font-size: 10pt; color: #666;">${language === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}</p>
        <p class="budget-amount">${contract.budget} ${contract.currency}</p>
      </div>
      <p class="content">${language === 'ar' ? contract.paymentTermsAr : contract.paymentTerms}</p>
    </div>

    <div class="section">
      <h2 class="section-title">${language === 'ar' ? '٤. الجدول الزمني' : '4. Timeline'}</h2>
      <p class="content">${language === 'ar' ? 'تاريخ البدء:' : 'Start Date:'} ${formatDate(contract.startDate)}</p>
      <p class="content">${language === 'ar' ? 'تاريخ الانتهاء:' : 'End Date:'} ${formatDate(contract.endDate)}</p>
      <p class="content">${language === 'ar' ? 'المدة المقدرة:' : 'Estimated Duration:'} ${contract.estimatedDuration}</p>
    </div>

    <div class="section">
      <h2 class="section-title">${language === 'ar' ? '٥. المخرجات المتوقعة' : '5. Deliverables'}</h2>
      ${(language === 'ar' ? contract.deliverablesAr : contract.deliverables).map(item => 
        `<p class="list-item">• ${item}</p>`
      ).join('')}
    </div>

    <p class="page-footer">${language === 'ar' ? 'الصفحة ١ من ٢' : 'Page 1 of 2'}</p>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <div class="header">
      <h1>GUILD</h1>
      <p>${language === 'ar' ? 'الشروط والقواعد' : 'Terms & Rules'}</p>
    </div>

    <div class="split-container">
      <div class="half-section">
        <h2 class="section-title" style="font-size: 12pt;">${language === 'ar' ? '٦. قواعد منصة GUILD' : '6. GUILD Platform Rules'}</h2>
        ${contract.platformRules.map((rule, index) => 
          `<div class="rule-item">
            <strong>${index + 1}.</strong> ${language === 'ar' ? rule.textAr : rule.text}
          </div>`
        ).join('')}
      </div>

      <div class="half-section">
        <h2 class="section-title" style="font-size: 12pt;">${language === 'ar' ? '٧. شروط صاحب العمل' : '7. Job Poster Terms'}</h2>
        ${contract.posterRules.length > 0 
          ? contract.posterRules.map((rule, index) => 
              `<div class="rule-item">
                <strong>${index + 1}.</strong> ${language === 'ar' ? rule.textAr : rule.text}
              </div>`
            ).join('')
          : `<p style="font-size: 10pt; color: #999; font-style: italic;">${language === 'ar' ? 'لا توجد شروط إضافية' : 'No additional terms specified'}</p>`
        }
      </div>
    </div>

    <div class="signatures-section">
      <h2 class="section-title">${language === 'ar' ? '٨. التوقيعات الرقمية' : '8. Digital Signatures'}</h2>
      
      <div class="signature-box">
        <p style="font-size: 10pt; color: #666;">${language === 'ar' ? 'صاحب العمل' : 'Job Poster'}</p>
        <p class="party-name">${contract.poster.name}</p>
        <p class="party-gid">GID: ${contract.poster.gid}</p>
        ${contract.posterSignature 
          ? `<div class="signature-line"></div>
             <p style="font-size: 9pt; color: #999; font-family: monospace;">${contract.posterSignature.signature.substring(0, 16)}...</p>
             <p style="font-size: 10pt; color: #666;">${formatDate(contract.posterSignature.signedAt)}</p>`
          : `<p style="font-size: 10pt; color: #FF9800; font-style: italic;">${language === 'ar' ? 'في انتظار التوقيع' : 'Awaiting Signature'}</p>`
        }
      </div>

      <div class="signature-box">
        <p style="font-size: 10pt; color: #666;">${language === 'ar' ? 'منفذ العمل' : 'Job Doer'}</p>
        <p class="party-name">${contract.doer.name}</p>
        <p class="party-gid">GID: ${contract.doer.gid}</p>
        ${contract.doerSignature 
          ? `<div class="signature-line"></div>
             <p style="font-size: 9pt; color: #999; font-family: monospace;">${contract.doerSignature.signature.substring(0, 16)}...</p>
             <p style="font-size: 10pt; color: #666;">${formatDate(contract.doerSignature.signedAt)}</p>`
          : `<p style="font-size: 10pt; color: #FF9800; font-style: italic;">${language === 'ar' ? 'في انتظار التوقيع' : 'Awaiting Signature'}</p>`
        }
      </div>
    </div>

    <p class="page-footer">${language === 'ar' ? 'الصفحة ٢ من ٢' : 'Page 2 of 2'}</p>
  </div>
</body>
</html>
    `;
  };

  const handleExportPDF = async () => {
    if (!contract) return;

    setExporting(true);
    try {
      const html = generatePDFHTML();
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const fileName = `contract_${contract.id}_${language}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      CustomAlertService.showSuccess(
        language === 'ar' ? 'تم التصدير' : 'Exported',
        language === 'ar' 
          ? 'تم حفظ العقد كملف PDF' 
          : 'Contract saved as PDF'
      );

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath);
      }

    } catch (error) {
      console.error('Error exporting PDF:', error);
      CustomAlertService.showError(
        t('error'),
        'Failed to export PDF'
      );
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!contract) return;

    try {
      const html = generatePDFHTML();
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error printing:', error);
      CustomAlertService.showError(
        t('error'),
        'Failed to print contract'
      );
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const canSign = (): boolean => {
    if (!contract || !user) return false;
    
    const userRole = contract.poster.userId === user.uid ? 'poster' : 'doer';
    
    if (userRole === 'poster') {
      return !contract.posterSignature;
    } else {
      return !contract.doerSignature;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {t('loading')}...
          </Text>
        </View>
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          Contract not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {language === 'ar' ? 'عقد العمل' : 'Work Contract'}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleLanguage} style={styles.iconButton}>
            <Globe size={20} color={theme.textPrimary} />
            <Text style={[styles.langText, { color: theme.textSecondary }]}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contract Document */}
      <ContractDocument contract={contract} language={language} />

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: theme.surface }]}>
        {canSign() && (
          <TouchableOpacity
            style={[styles.signButton, { backgroundColor: theme.primary }]}
            onPress={handleSign}
            disabled={signing}
          >
            {signing ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <CheckCircle size={20} color="#000000" />
                <Text style={styles.signButtonText}>
                  {language === 'ar' ? 'توقيع العقد' : 'Sign Contract'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Download size={18} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
                  {language === 'ar' ? 'PDF تصدير' : 'Export PDF'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handlePrint}
          >
            <FileText size={18} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
              {language === 'ar' ? 'طباعة' : 'Print'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

