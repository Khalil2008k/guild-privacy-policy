/**
 * Contract Document Component - Paper-Style 2-Page Contract
 * Beautiful, printable contract with bilingual support
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Shield, Calendar, DollarSign, User, CheckCircle } from 'lucide-react-native';
import { JobContract } from '../services/contractService';
import { Timestamp } from 'firebase/firestore';

interface ContractDocumentProps {
  contract: JobContract;
  language: 'en' | 'ar';
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({ contract, language }) => {
  const isRTL = language === 'ar';

  const formatDate = (date: Date | Timestamp | undefined): string => {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isSigned = (signature: any): boolean => {
    return signature !== undefined && signature !== null;
  };

  return (
    <ScrollView style={styles.container}>
      {/* PAGE 1: MAIN CONTRACT */}
      <View style={[styles.page, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        {/* Header */}
        <View style={styles.header}>
          <Shield size={32} color="#4CAF50" />
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            GUILD
          </Text>
          <Text style={[styles.headerSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'عقد عمل رقمي' : 'Digital Work Contract'}
          </Text>
        </View>

        {/* Contract ID & Date */}
        <View style={styles.contractInfo}>
          <Text style={[styles.contractId, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'رقم العقد:' : 'Contract ID:'} {contract.id}
          </Text>
          <Text style={[styles.contractDate, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'تاريخ الإنشاء:' : 'Date:'} {formatDate(contract.createdAt)}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? '١. عنوان المشروع' : '1. Project Title'}
          </Text>
          <Text style={[styles.content, { textAlign: isRTL ? 'right' : 'left' }]}>
            {contract.jobTitle}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? '٢. الأطراف المتعاقدة' : '2. Contracting Parties'}
          </Text>
          
          {/* Poster */}
          <View style={styles.partyBox}>
            <View style={styles.partyHeader}>
              <User size={16} color="#666" />
              <Text style={[styles.partyRole, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'الطرف الأول (صاحب العمل)' : 'Party A (Job Poster)'}
              </Text>
            </View>
            <Text style={[styles.partyName, { textAlign: isRTL ? 'right' : 'left' }]}>
              {contract.poster.name}
            </Text>
            <Text style={[styles.partyGID, { textAlign: isRTL ? 'right' : 'left' }]}>
              GID: {contract.poster.gid}
            </Text>
            {isSigned(contract.posterSignature) && (
              <View style={styles.signatureStatus}>
                <CheckCircle size={14} color="#4CAF50" />
                <Text style={styles.signedText}>
                  {language === 'ar' ? 'موقّع في' : 'Signed on'} {formatDate(contract.posterSignature?.signedAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Doer */}
          <View style={styles.partyBox}>
            <View style={styles.partyHeader}>
              <User size={16} color="#666" />
              <Text style={[styles.partyRole, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'الطرف الثاني (منفذ العمل)' : 'Party B (Job Doer)'}
              </Text>
            </View>
            <Text style={[styles.partyName, { textAlign: isRTL ? 'right' : 'left' }]}>
              {contract.doer.name}
            </Text>
            <Text style={[styles.partyGID, { textAlign: isRTL ? 'right' : 'left' }]}>
              GID: {contract.doer.gid}
            </Text>
            {isSigned(contract.doerSignature) && (
              <View style={styles.signatureStatus}>
                <CheckCircle size={14} color="#4CAF50" />
                <Text style={styles.signedText}>
                  {language === 'ar' ? 'موقّع في' : 'Signed on'} {formatDate(contract.doerSignature?.signedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Financial Terms */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? '٣. الشروط المالية' : '3. Financial Terms'}
          </Text>
          <View style={styles.financialBox}>
            <DollarSign size={20} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.budgetLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}
              </Text>
              <Text style={[styles.budgetAmount, { textAlign: isRTL ? 'right' : 'left' }]}>
                {contract.budget} {contract.currency}
              </Text>
            </View>
          </View>
          <Text style={[styles.content, { textAlign: isRTL ? 'right' : 'left', marginTop: 8 }]}>
            {language === 'ar' ? contract.paymentTermsAr : contract.paymentTerms}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? '٤. الجدول الزمني' : '4. Timeline'}
          </Text>
          <View style={styles.timelineBox}>
            <View style={styles.timelineItem}>
              <Calendar size={16} color="#666" />
              <Text style={[styles.timelineLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'تاريخ البدء:' : 'Start Date:'}
              </Text>
              <Text style={[styles.timelineValue, { textAlign: isRTL ? 'right' : 'left' }]}>
                {formatDate(contract.startDate)}
              </Text>
            </View>
            <View style={styles.timelineItem}>
              <Calendar size={16} color="#666" />
              <Text style={[styles.timelineLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'تاريخ الانتهاء:' : 'End Date:'}
              </Text>
              <Text style={[styles.timelineValue, { textAlign: isRTL ? 'right' : 'left' }]}>
                {formatDate(contract.endDate)}
              </Text>
            </View>
          </View>
          <Text style={[styles.content, { textAlign: isRTL ? 'right' : 'left', marginTop: 8 }]}>
            {language === 'ar' ? 'المدة المقدرة:' : 'Estimated Duration:'} {contract.estimatedDuration}
          </Text>
        </View>

        {/* Deliverables */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? '٥. المخرجات المتوقعة' : '5. Deliverables'}
          </Text>
          {(language === 'ar' ? contract.deliverablesAr : contract.deliverables).map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.listText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        {/* Page Footer */}
        <Text style={[styles.pageFooter, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'الصفحة ١ من ٢' : 'Page 1 of 2'}
        </Text>
      </View>

      {/* PAGE 2: RULES & TERMS */}
      <View style={[styles.page, styles.page2, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        {/* Header */}
        <View style={styles.header}>
          <Shield size={32} color="#4CAF50" />
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'الشروط والقواعد' : 'Terms & Rules'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Split Section Container */}
        <View style={styles.splitContainer}>
          {/* Left Half: Platform Rules */}
          <View style={styles.halfSection}>
            <Text style={[styles.sectionTitle, styles.halfTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? '٦. قواعد منصة GUILD' : '6. GUILD Platform Rules'}
            </Text>
            {contract.platformRules.map((rule, index) => (
              <View key={rule.id} style={styles.ruleItem}>
                <Text style={[styles.ruleNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {index + 1}.
                </Text>
                <Text style={[styles.ruleText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? rule.textAr : rule.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Vertical Divider */}
          <View style={styles.verticalDivider} />

          {/* Right Half: Poster Rules */}
          <View style={styles.halfSection}>
            <Text style={[styles.sectionTitle, styles.halfTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? '٧. شروط صاحب العمل' : '7. Job Poster Terms'}
            </Text>
            {contract.posterRules.length > 0 ? (
              contract.posterRules.map((rule, index) => (
                <View key={rule.id} style={styles.ruleItem}>
                  <Text style={[styles.ruleNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {index + 1}.
                  </Text>
                  <Text style={[styles.ruleText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? rule.textAr : rule.text}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noRules, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'لا توجد شروط إضافية' : 'No additional terms specified'}
              </Text>
            )}
          </View>
        </View>

        {/* Digital Signatures Section */}
        <View style={styles.signaturesSection}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? '٨. التوقيعات الرقمية' : '8. Digital Signatures'}
          </Text>
          
          <View style={styles.signaturesRow}>
            {/* Poster Signature */}
            <View style={styles.signatureBox}>
              <Text style={[styles.signatureLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'صاحب العمل' : 'Job Poster'}
              </Text>
              <Text style={[styles.signatureName, { textAlign: isRTL ? 'right' : 'left' }]}>
                {contract.poster.name}
              </Text>
              <Text style={[styles.signatureGID, { textAlign: isRTL ? 'right' : 'left' }]}>
                GID: {contract.poster.gid}
              </Text>
              {isSigned(contract.posterSignature) ? (
                <>
                  <View style={styles.signatureLine} />
                  <Text style={[styles.signatureHash, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {contract.posterSignature?.signature.substring(0, 16)}...
                  </Text>
                  <Text style={[styles.signatureDate, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {formatDate(contract.posterSignature?.signedAt)}
                  </Text>
                </>
              ) : (
                <Text style={[styles.unsigned, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'في انتظار التوقيع' : 'Awaiting Signature'}
                </Text>
              )}
            </View>

            {/* Doer Signature */}
            <View style={styles.signatureBox}>
              <Text style={[styles.signatureLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'منفذ العمل' : 'Job Doer'}
              </Text>
              <Text style={[styles.signatureName, { textAlign: isRTL ? 'right' : 'left' }]}>
                {contract.doer.name}
              </Text>
              <Text style={[styles.signatureGID, { textAlign: isRTL ? 'right' : 'left' }]}>
                GID: {contract.doer.gid}
              </Text>
              {isSigned(contract.doerSignature) ? (
                <>
                  <View style={styles.signatureLine} />
                  <Text style={[styles.signatureHash, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {contract.doerSignature?.signature.substring(0, 16)}...
                  </Text>
                  <Text style={[styles.signatureDate, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {formatDate(contract.doerSignature?.signedAt)}
                  </Text>
                </>
              ) : (
                <Text style={[styles.unsigned, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'في انتظار التوقيع' : 'Awaiting Signature'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Page Footer */}
        <Text style={[styles.pageFooter, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'الصفحة ٢ من ٢' : 'Page 2 of 2'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  page: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 800,
  },
  page2: {
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4CAF50',
    marginTop: 8,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  contractInfo: {
    marginBottom: 16,
  },
  contractId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contractDate: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  content: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  partyBox: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  partyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  partyRole: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  partyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  partyGID: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  signatureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  signedText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  financialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  timelineBox: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  timelineValue: {
    fontSize: 13,
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  splitContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
  },
  halfTitle: {
    fontSize: 14,
  },
  verticalDivider: {
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ruleNumber: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '700',
    marginRight: 8,
    minWidth: 20,
  },
  ruleText: {
    flex: 1,
    fontSize: 11,
    color: '#555',
    lineHeight: 18,
  },
  noRules: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  signaturesSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  signatureBox: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  signatureLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  signatureGID: {
    fontSize: 10,
    color: '#4CAF50',
    marginBottom: 12,
  },
  signatureLine: {
    height: 2,
    backgroundColor: '#4CAF50',
    marginBottom: 8,
  },
  signatureHash: {
    fontSize: 9,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 10,
    color: '#666',
  },
  unsigned: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 8,
  },
  pageFooter: {
    fontSize: 10,
    color: '#999',
    marginTop: 24,
  },
});

export default ContractDocument;


