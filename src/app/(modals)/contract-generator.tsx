import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { CustomAlertService } from '../../../src/services/CustomAlertService';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  FileText,
  Download,
  Send,
  Eye,
  Edit,
  Save,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Plus,
  X
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useI18n } from '../../../src/contexts/I18nProvider';
import ModalHeader from '../components/ModalHeader';

// Advanced Light Mode Color Helper
const getAdaptiveColors = (theme: any, isDark: boolean) => ({
  background: isDark ? theme.background : '#F5F5F5',
  cardBackground: isDark ? theme.surface : '#FFFFFF',
  cardBorder: isDark ? theme.border : 'rgba(0, 0, 0, 0.08)',
  primaryText: isDark ? theme.textPrimary : '#000000',
  secondaryText: isDark ? theme.textSecondary : '#666666',
  iconColor: isDark ? theme.textSecondary : '#666666',
  cardShadow: isDark 
    ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }
    : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12 },
});

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  clauses: string[];
}

interface ContractData {
  clientName: string;
  freelancerName: string;
  projectTitle: string;
  projectDescription: string;
  budget: string;
  currency: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  deliverables: string[];
  milestones: Array<{
    title: string;
    description: string;
    amount: string;
    dueDate: string;
  }>;
}

export default function ContractGeneratorScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  
  const adaptiveColors = React.useMemo(() => getAdaptiveColors(theme, isDarkMode), [theme, isDarkMode]);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [contractData, setContractData] = useState<ContractData>({
    clientName: '',
    freelancerName: '',
    projectTitle: '',
    projectDescription: '',
    budget: '',
    currency: 'QAR',
    startDate: '',
    endDate: '',
    paymentTerms: '',
    deliverables: [''],
    milestones: [
      { title: '', description: '', amount: '', dueDate: '' }
    ],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const contractTemplates: ContractTemplate[] = [
    {
      id: 'web_dev',
      name: t('contractGenerator.webDevelopment'),
      description: t('contractGenerator.webDevelopmentDesc'),
      category: 'Technology',
      clauses: [
        'Scope of Work',
        'Payment Terms',
        'Intellectual Property',
        'Confidentiality',
        'Revisions Policy',
        'Termination Clause',
      ],
    },
    {
      id: 'design',
      name: t('contractGenerator.designServices'),
      description: t('contractGenerator.designServicesDesc'),
      category: 'Design',
      clauses: [
        'Design Specifications',
        'Revision Rounds',
        'File Delivery',
        'Usage Rights',
        'Payment Schedule',
        'Client Feedback',
      ],
    },
    {
      id: 'content',
      name: t('contractGenerator.contentWriting'),
      description: t('contractGenerator.contentWritingDesc'),
      category: 'Writing',
      clauses: [
        'Content Requirements',
        'Research Responsibilities',
        'Plagiarism Policy',
        'SEO Guidelines',
        'Publication Rights',
        'Revision Process',
      ],
    },
    {
      id: 'consulting',
      name: t('contractGenerator.consulting'),
      description: t('contractGenerator.consultingDesc'),
      category: 'Business',
      clauses: [
        'Consulting Scope',
        'Deliverable Reports',
        'Meeting Schedule',
        'Confidentiality Agreement',
        'Hourly Rate Structure',
        'Expense Reimbursement',
      ],
    },
  ];

  const steps = [
    t('contractGenerator.selectTemplate'),
    t('contractGenerator.projectDetails'),
    t('contractGenerator.paymentTerms'),
    t('contractGenerator.milestonesDeliverables'),
    t('contractGenerator.reviewGenerate'),
  ];

  const handleTemplateSelect = (template: ContractTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTemplate(template);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const addDeliverable = () => {
    setContractData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, ''],
    }));
  };

  const removeDeliverable = (index: number) => {
    setContractData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const addMilestone = () => {
    setContractData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', description: '', amount: '', dueDate: '' }],
    }));
  };

  const removeMilestone = (index: number) => {
    setContractData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const handleGenerateContract = async () => {
    setIsGenerating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Simulate contract generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      CustomAlertService.showSuccess(
        t('contractGenerator.contractGenerated'),
        t('contractGenerator.contractGeneratedMessage'),
        [
          {
            text: t('contractGenerator.downloadPDF'),
            style: 'default',
            onPress: () => {
              // Handle PDF download
              CustomAlertService.showSuccess(t('common.success'), t('contractGenerator.pdfDownloaded'));
            },
          },
          {
            text: t('contractGenerator.sendForSigning'),
            style: 'default',
            onPress: () => {
              // Handle sending for e-signature
              CustomAlertService.showSuccess(t('common.success'), t('contractGenerator.sentForSigning'));
            },
          },
          {
            text: t('common.close'),
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      CustomAlertService.showError(t('common.error'), t('contractGenerator.generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const renderTemplateSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('contractGenerator.selectTemplate')}</Text>
      <Text style={styles.stepDescription}>{t('contractGenerator.selectTemplateDesc')}</Text>
      
      {contractTemplates.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={[
            styles.templateCard,
            selectedTemplate?.id === template.id && styles.selectedTemplateCard
          ]}
          onPress={() => handleTemplateSelect(template)}
        >
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{template.name}</Text>
            <View style={styles.templateCategory}>
              <Text style={styles.templateCategoryText}>{template.category}</Text>
            </View>
          </View>
          <Text style={styles.templateDescription}>{template.description}</Text>
          
          <View style={styles.clausesList}>
            <Text style={styles.clausesTitle}>{t('contractGenerator.includedClauses')}:</Text>
            {template.clauses.map((clause, index) => (
              <View key={index} style={styles.clauseItem}>
                <CheckCircle size={16} color={theme.success} />
                <Text style={styles.clauseText}>{clause}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProjectDetails = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('contractGenerator.projectDetails')}</Text>
      <Text style={styles.stepDescription}>{t('contractGenerator.projectDetailsDesc')}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contractGenerator.clientName')} *</Text>
        <TextInput
          style={styles.input}
          value={contractData.clientName}
          onChangeText={(text) => setContractData(prev => ({ ...prev, clientName: text }))}
          placeholder={t('contractGenerator.clientNamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contractGenerator.freelancerName')} *</Text>
        <TextInput
          style={styles.input}
          value={contractData.freelancerName}
          onChangeText={(text) => setContractData(prev => ({ ...prev, freelancerName: text }))}
          placeholder={t('contractGenerator.freelancerNamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contractGenerator.projectTitle')} *</Text>
        <TextInput
          style={styles.input}
          value={contractData.projectTitle}
          onChangeText={(text) => setContractData(prev => ({ ...prev, projectTitle: text }))}
          placeholder={t('contractGenerator.projectTitlePlaceholder')}
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contractGenerator.projectDescription')} *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={contractData.projectDescription}
          onChangeText={(text) => setContractData(prev => ({ ...prev, projectDescription: text }))}
          placeholder={t('contractGenerator.projectDescriptionPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          multiline
        />
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateInput}>
          <Text style={styles.inputLabel}>{t('contractGenerator.startDate')} *</Text>
          <TextInput
            style={styles.input}
            value={contractData.startDate}
            onChangeText={(text) => setContractData(prev => ({ ...prev, startDate: text }))}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        <View style={styles.dateInput}>
          <Text style={styles.inputLabel}>{t('contractGenerator.endDate')} *</Text>
          <TextInput
            style={styles.input}
            value={contractData.endDate}
            onChangeText={(text) => setContractData(prev => ({ ...prev, endDate: text }))}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  const renderPaymentTerms = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('contractGenerator.paymentTerms')}</Text>
      <Text style={styles.stepDescription}>{t('contractGenerator.paymentTermsDesc')}</Text>
      
      <View style={styles.budgetRow}>
        <View style={styles.budgetInput}>
          <Text style={styles.inputLabel}>{t('contractGenerator.totalBudget')} *</Text>
          <TextInput
            style={styles.input}
            value={contractData.budget}
            onChangeText={(text) => setContractData(prev => ({ ...prev, budget: text }))}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.currencyInput}>
          <Text style={styles.inputLabel}>{t('contractGenerator.currency')}</Text>
          <View style={styles.currencySelector}>
            <Text style={styles.currencyText}>{contractData.currency}</Text>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('contractGenerator.paymentSchedule')} *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={contractData.paymentTerms}
          onChangeText={(text) => setContractData(prev => ({ ...prev, paymentTerms: text }))}
          placeholder={t('contractGenerator.paymentSchedulePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          multiline
        />
      </View>
    </View>
  );

  const renderMilestonesDeliverables = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('contractGenerator.milestonesDeliverables')}</Text>
      <Text style={styles.stepDescription}>{t('contractGenerator.milestonesDeliverablesDesc')}</Text>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('contractGenerator.deliverables')}</Text>
          <TouchableOpacity onPress={addDeliverable} style={styles.addButton}>
            <Plus size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        {contractData.deliverables.map((deliverable, index) => (
          <View key={index} style={styles.listItem}>
            <TextInput
              style={[styles.input, styles.listInput]}
              value={deliverable}
              onChangeText={(text) => {
                const newDeliverables = [...contractData.deliverables];
                newDeliverables[index] = text;
                setContractData(prev => ({ ...prev, deliverables: newDeliverables }));
              }}
              placeholder={t('contractGenerator.deliverablePlaceholder')}
              placeholderTextColor={theme.textSecondary}
            />
            {contractData.deliverables.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeDeliverable(index)}
                style={styles.removeButton}
              >
                <X size={20} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('contractGenerator.milestones')}</Text>
          <TouchableOpacity onPress={addMilestone} style={styles.addButton}>
            <Plus size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        {contractData.milestones.map((milestone, index) => (
          <View key={index} style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneNumber}>{t('contractGenerator.milestone')} {index + 1}</Text>
              {contractData.milestones.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removeMilestone(index)}
                  style={styles.removeButton}
                >
                  <X size={20} color={theme.error} />
                </TouchableOpacity>
              )}
            </View>
            
            <TextInput
              style={styles.input}
              value={milestone.title}
              onChangeText={(text) => {
                const newMilestones = [...contractData.milestones];
                newMilestones[index].title = text;
                setContractData(prev => ({ ...prev, milestones: newMilestones }));
              }}
              placeholder={t('contractGenerator.milestoneTitle')}
              placeholderTextColor={theme.textSecondary}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { marginTop: 8 }]}
              value={milestone.description}
              onChangeText={(text) => {
                const newMilestones = [...contractData.milestones];
                newMilestones[index].description = text;
                setContractData(prev => ({ ...prev, milestones: newMilestones }));
              }}
              placeholder={t('contractGenerator.milestoneDescription')}
              placeholderTextColor={theme.textSecondary}
              multiline
            />
            
            <View style={styles.milestoneRow}>
              <View style={styles.milestoneAmount}>
                <TextInput
                  style={styles.input}
                  value={milestone.amount}
                  onChangeText={(text) => {
                    const newMilestones = [...contractData.milestones];
                    newMilestones[index].amount = text;
                    setContractData(prev => ({ ...prev, milestones: newMilestones }));
                  }}
                  placeholder={t('contractGenerator.amount')}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.milestoneDue}>
                <TextInput
                  style={styles.input}
                  value={milestone.dueDate}
                  onChangeText={(text) => {
                    const newMilestones = [...contractData.milestones];
                    newMilestones[index].dueDate = text;
                    setContractData(prev => ({ ...prev, milestones: newMilestones }));
                  }}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReviewGenerate = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('contractGenerator.reviewGenerate')}</Text>
      <Text style={styles.stepDescription}>{t('contractGenerator.reviewGenerateDesc')}</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>{t('contractGenerator.contractSummary')}</Text>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('contractGenerator.template')}</Text>
          <Text style={styles.reviewValue}>{selectedTemplate?.name}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('contractGenerator.client')}</Text>
          <Text style={styles.reviewValue}>{contractData.clientName}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('contractGenerator.freelancer')}</Text>
          <Text style={styles.reviewValue}>{contractData.freelancerName}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('contractGenerator.project')}</Text>
          <Text style={styles.reviewValue}>{contractData.projectTitle}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('contractGenerator.budget')}</Text>
          <Text style={styles.reviewValue}>{contractData.budget} {contractData.currency}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('contractGenerator.duration')}</Text>
          <Text style={styles.reviewValue}>{contractData.startDate} - {contractData.endDate}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{t('contractGenerator.milestones')}</Text>
          <Text style={styles.reviewValue}>{contractData.milestones.length} {t('contractGenerator.milestonesCount')}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateContract}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <FileText size={20} color="#FFFFFF" />
        ) : (
          <FileText size={20} color="#FFFFFF" />
        )}
        <Text style={styles.generateButtonText}>
          {isGenerating ? t('contractGenerator.generating') : t('contractGenerator.generateContract')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderTemplateSelection();
      case 1:
        return renderProjectDetails();
      case 2:
        return renderPaymentTerms();
      case 3:
        return renderMilestonesDeliverables();
      case 4:
        return renderReviewGenerate();
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: adaptiveColors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    content: {
      flex: 1,
      padding: 20,
      paddingBottom: 20 + insets.bottom,
    },
    progressContainer: {
      flexDirection: 'row',
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    progressStep: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
    },
    progressStepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    progressStepActive: {
      backgroundColor: theme.primary,
    },
    progressStepCompleted: {
      backgroundColor: theme.success,
    },
    progressStepInactive: {
      backgroundColor: theme.border,
    },
    progressStepText: {
      fontSize: 10,
      textAlign: 'center',
      paddingHorizontal: 2,
    },
    progressStepTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    progressStepTextCompleted: {
      color: theme.success,
      fontWeight: '600',
    },
    progressStepTextInactive: {
      color: adaptiveColors.secondaryText,
    },
    progressLine: {
      position: 'absolute',
      top: 16,
      left: '50%',
      right: '-50%',
      height: 2,
      backgroundColor: theme.border,
      zIndex: -1,
    },
    progressLineCompleted: {
      backgroundColor: theme.success,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: adaptiveColors.primaryText,
      marginBottom: 8,
    },
    stepDescription: {
      fontSize: 16,
      color: adaptiveColors.secondaryText,
      lineHeight: 24,
      marginBottom: 24,
    },
    templateCard: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    selectedTemplateCard: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    templateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    templateName: {
      fontSize: 18,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
      flex: 1,
    },
    templateCategory: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    templateCategoryText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },
    templateDescription: {
      fontSize: 14,
      color: adaptiveColors.secondaryText,
      lineHeight: 20,
      marginBottom: 12,
    },
    clausesList: {
      gap: 4,
    },
    clausesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
      marginBottom: 8,
    },
    clauseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    clauseText: {
      fontSize: 14,
      color: adaptiveColors.secondaryText,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: adaptiveColors.primaryText,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: adaptiveColors.primaryText,
      backgroundColor: adaptiveColors.cardBackground,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    dateRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateInput: {
      flex: 1,
    },
    budgetRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    budgetInput: {
      flex: 2,
    },
    currencyInput: {
      flex: 1,
    },
    currencySelector: {
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      borderRadius: 8,
      padding: 12,
      backgroundColor: adaptiveColors.cardBackground,
      alignItems: 'center',
    },
    currencyText: {
      fontSize: 16,
      color: adaptiveColors.primaryText,
      fontWeight: '600',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
    },
    addButton: {
      padding: 4,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    listInput: {
      flex: 1,
      marginRight: 8,
    },
    removeButton: {
      padding: 4,
    },
    milestoneCard: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    milestoneHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    milestoneNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
    },
    milestoneRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    milestoneAmount: {
      flex: 1,
    },
    milestoneDue: {
      flex: 1,
    },
    reviewSection: {
      backgroundColor: adaptiveColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
    },
    reviewSectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: adaptiveColors.primaryText,
      marginBottom: 16,
    },
    reviewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    reviewLabel: {
      fontSize: 14,
      color: adaptiveColors.secondaryText,
    },
    reviewValue: {
      fontSize: 14,
      color: adaptiveColors.primaryText,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
    },
    generateButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    generateButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    navigationButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    backButton: {
      flex: 1,
      backgroundColor: adaptiveColors.cardBackground,
      borderWidth: 1,
      borderColor: adaptiveColors.cardBorder,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    backButtonText: {
      color: adaptiveColors.secondaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    nextButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <ModalHeader 
        title={t('contractGenerator.title')}
        onClose={() => router.back()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={[styles.progressContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {steps.map((step, index) => (
            <View key={index} style={[styles.progressStep, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              {index < steps.length - 1 && (
                <View style={[
                  styles.progressLine,
                  index < currentStep && styles.progressLineCompleted
                ]} />
              )}
              <View style={[
                styles.progressStepIcon,
                index === currentStep && styles.progressStepActive,
                index < currentStep && styles.progressStepCompleted,
                index > currentStep && styles.progressStepInactive,
              ]}>
                <Text style={{ 
                  color: index <= currentStep ? "#FFFFFF" : theme.textSecondary,
                  fontSize: 12,
                  fontWeight: '600'
                }}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[
                styles.progressStepText,
                index === currentStep && styles.progressStepTextActive,
                index < currentStep && styles.progressStepTextCompleted,
                index > currentStep && styles.progressStepTextInactive,
              ]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        {currentStep < steps.length - 1 && (
          <View style={[styles.navigationButtons, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {currentStep > 0 && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handlePreviousStep}
              >
                <Text style={styles.backButtonText}>{t('common.back')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>{t('common.next')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
