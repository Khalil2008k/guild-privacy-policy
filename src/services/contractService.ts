/**
 * Contract Service - Job Contract Management with GID Signatures
 * Handles contract creation, signing, PDF generation, and bilingual support
 */

import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';

export interface ContractParty {
  userId: string;
  gid: string;
  name: string;
  role: 'poster' | 'doer';
  email?: string;
  phoneNumber?: string;
  signedAt?: Date | Timestamp;
  signature?: string; // Hash of GID + timestamp
  ipAddress?: string;
  acceptedTerms: boolean;
}

export interface ContractRule {
  id: string;
  text: string;
  textAr: string;
  category: 'platform' | 'poster';
}

export interface JobContract {
  id: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  
  // Parties
  poster: ContractParty;
  doer: ContractParty;
  
  // Financial Terms
  budget: string;
  currency: string;
  paymentTerms: string;
  paymentTermsAr: string;
  
  // Timeline
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  estimatedDuration: string;
  
  // Deliverables
  deliverables: string[];
  deliverablesAr: string[];
  
  // Rules
  platformRules: ContractRule[];
  posterRules: ContractRule[];
  
  // Status
  status: 'draft' | 'pending_signatures' | 'active' | 'completed' | 'terminated' | 'disputed';
  
  // Signatures
  posterSignature?: {
    signedAt: Date | Timestamp;
    signature: string;
    ipAddress?: string;
  };
  doerSignature?: {
    signedAt: Date | Timestamp;
    signature: string;
    ipAddress?: string;
  };
  
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  activatedAt?: Date | Timestamp;
  completedAt?: Date | Timestamp;
  version: string;
  language: 'en' | 'ar';
}

class ContractService {
  private contractsCollection = collection(db, 'contracts');

  /**
   * Generate default platform rules (bilingual)
   */
  getDefaultPlatformRules(): ContractRule[] {
    return [
      {
        id: 'rule_1',
        text: 'All work must be completed within the agreed timeline unless both parties agree to an extension.',
        textAr: 'يجب إكمال جميع الأعمال ضمن الجدول الزمني المتفق عليه ما لم يتفق الطرفان على تمديد.'
      },
      {
        id: 'rule_2',
        text: 'Payment will be released through GUILD platform within 7-14 days after job completion and approval.',
        textAr: 'سيتم إطلاق الدفع عبر منصة GUILD خلال 7-14 يومًا بعد إكمال العمل والموافقة عليه.'
      },
      {
        id: 'rule_3',
        text: 'Any disputes must be reported within 48 hours of job completion.',
        textAr: 'يجب الإبلاغ عن أي نزاعات خلال 48 ساعة من إكمال العمل.'
      },
      {
        id: 'rule_4',
        text: 'Both parties agree to maintain professional communication through the GUILD platform.',
        textAr: 'يوافق الطرفان على الحفاظ على التواصل المهني عبر منصة GUILD.'
      },
      {
        id: 'rule_5',
        text: 'All intellectual property rights will be transferred upon full payment unless otherwise specified.',
        textAr: 'سيتم نقل جميع حقوق الملكية الفكرية عند الدفع الكامل ما لم يُذكر خلاف ذلك.'
      },
      {
        id: 'rule_6',
        text: 'Cancellation by either party after contract activation will be subject to GUILD platform fees.',
        textAr: 'سيخضع الإلغاء من قبل أي طرف بعد تفعيل العقد لرسوم منصة GUILD.'
      },
      {
        id: 'rule_7',
        text: 'All communication and file sharing must be done through the GUILD platform for security and dispute resolution.',
        textAr: 'يجب أن يتم جميع التواصل ومشاركة الملفات عبر منصة GUILD للأمان وحل النزاعات.'
      },
    ].map(rule => ({ ...rule, category: 'platform' as const }));
  }

  /**
   * Create a new job contract
   */
  async createContract(
    jobId: string,
    jobTitle: string,
    jobDescription: string,
    poster: Omit<ContractParty, 'acceptedTerms' | 'role'>,
    doer: Omit<ContractParty, 'acceptedTerms' | 'role'>,
    financialTerms: {
      budget: string;
      currency: string;
      paymentTerms: string;
      paymentTermsAr: string;
    },
    timeline: {
      startDate: Date;
      endDate: Date;
      estimatedDuration: string;
    },
    deliverables: { en: string[]; ar: string[] },
    posterRules: Array<{ text: string; textAr: string }>,
    language: 'en' | 'ar' = 'en'
  ): Promise<string> {
    const contractId = `contract_${Date.now()}_${jobId}`;
    
    const contract: JobContract = {
      id: contractId,
      jobId,
      jobTitle,
      jobDescription,
      
      poster: {
        ...poster,
        role: 'poster',
        acceptedTerms: false,
      },
      doer: {
        ...doer,
        role: 'doer',
        acceptedTerms: false,
      },
      
      ...financialTerms,
      ...timeline,
      
      deliverables: deliverables.en,
      deliverablesAr: deliverables.ar,
      
      platformRules: this.getDefaultPlatformRules(),
      posterRules: posterRules.map((rule, index) => ({
        id: `poster_rule_${index + 1}`,
        text: rule.text,
        textAr: rule.textAr,
        category: 'poster' as const,
      })),
      
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: '1.0',
      language,
    };

    await setDoc(doc(this.contractsCollection, contractId), contract);
    
    console.log('✅ Contract created:', contractId);
    return contractId;
  }

  /**
   * Generate GID-based signature
   */
  async generateGIDSignature(gid: string): Promise<string> {
    const timestamp = new Date().toISOString();
    const dataToSign = `${gid}:${timestamp}`;
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataToSign
    );
    return signature;
  }

  /**
   * Request contract signature from a party
   */
  async requestSignature(contractId: string, userId: string): Promise<void> {
    const contractDoc = await getDoc(doc(this.contractsCollection, contractId));
    
    if (!contractDoc.exists()) {
      throw new Error('Contract not found');
    }

    // Update status to pending signatures
    await updateDoc(doc(this.contractsCollection, contractId), {
      status: 'pending_signatures',
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Signature requested for contract:', contractId);
  }

  /**
   * Sign contract with GID
   */
  async signContract(
    contractId: string,
    userId: string,
    gid: string,
    role: 'poster' | 'doer',
    ipAddress?: string
  ): Promise<void> {
    const contractDoc = await getDoc(doc(this.contractsCollection, contractId));
    
    if (!contractDoc.exists()) {
      throw new Error('Contract not found');
    }

    const contract = contractDoc.data() as JobContract;

    // Verify user is part of the contract
    if (role === 'poster' && contract.poster.userId !== userId) {
      throw new Error('Unauthorized: User is not the poster');
    }
    if (role === 'doer' && contract.doer.userId !== userId) {
      throw new Error('Unauthorized: User is not the doer');
    }

    // Generate signature
    const signature = await this.generateGIDSignature(gid);

    const signatureData = {
      signedAt: serverTimestamp(),
      signature,
      ipAddress,
    };

    const updates: any = {
      updatedAt: serverTimestamp(),
    };

    if (role === 'poster') {
      updates.posterSignature = signatureData;
      updates['poster.signedAt'] = serverTimestamp();
      updates['poster.signature'] = signature;
      updates['poster.acceptedTerms'] = true;
    } else {
      updates.doerSignature = signatureData;
      updates['doer.signedAt'] = serverTimestamp();
      updates['doer.signature'] = signature;
      updates['doer.acceptedTerms'] = true;
    }

    // Check if both parties have signed
    const otherPartySigned = role === 'poster' 
      ? contract.doerSignature !== undefined 
      : contract.posterSignature !== undefined;

    if (otherPartySigned) {
      updates.status = 'active';
      updates.activatedAt = serverTimestamp();
    }

    await updateDoc(doc(this.contractsCollection, contractId), updates);

    console.log(`✅ Contract signed by ${role}:`, contractId);
  }

  /**
   * Get contract by ID
   */
  async getContract(contractId: string): Promise<JobContract | null> {
    const contractDoc = await getDoc(doc(this.contractsCollection, contractId));
    
    if (!contractDoc.exists()) {
      return null;
    }

    return contractDoc.data() as JobContract;
  }

  /**
   * Get contracts for a user
   */
  async getUserContracts(userId: string): Promise<JobContract[]> {
    const posterQuery = query(
      this.contractsCollection,
      where('poster.userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const doerQuery = query(
      this.contractsCollection,
      where('doer.userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const [posterDocs, doerDocs] = await Promise.all([
      getDocs(posterQuery),
      getDocs(doerQuery),
    ]);

    const contracts: JobContract[] = [
      ...posterDocs.docs.map(doc => doc.data() as JobContract),
      ...doerDocs.docs.map(doc => doc.data() as JobContract),
    ];

    return contracts;
  }

  /**
   * Get contract by job ID
   */
  async getContractByJobId(jobId: string): Promise<JobContract | null> {
    const q = query(
      this.contractsCollection,
      where('jobId', '==', jobId),
      orderBy('createdAt', 'desc')
    );

    const docs = await getDocs(q);
    
    if (docs.empty) {
      return null;
    }

    return docs.docs[0].data() as JobContract;
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    contractId: string,
    status: JobContract['status']
  ): Promise<void> {
    const updates: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'completed') {
      updates.completedAt = serverTimestamp();
    }

    await updateDoc(doc(this.contractsCollection, contractId), updates);
    
    console.log(`✅ Contract status updated to ${status}:`, contractId);
  }

  /**
   * Verify contract signature
   */
  async verifySignature(
    gid: string,
    signature: string,
    signedAt: Date | Timestamp
  ): Promise<boolean> {
    try {
      const timestamp = signedAt instanceof Timestamp 
        ? signedAt.toDate().toISOString() 
        : signedAt.toISOString();
      
      const dataToVerify = `${gid}:${timestamp}`;
      const expectedSignature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataToVerify
      );

      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate contract HTML for PDF (LTR layout, supports Arabic text)
   */
  generateContractHTML(contract: JobContract, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    
    // Format dates
    const formatDate = (date: Date | Timestamp) => {
      const d = date instanceof Timestamp ? date.toDate() : date;
      return d.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Get text based on language
    const title = isArabic ? 'عقد عمل' : 'Job Contract';
    const deliverables = isArabic ? contract.deliverablesAr : contract.deliverables;
    const paymentTerms = isArabic ? contract.paymentTermsAr : contract.paymentTerms;

    // Escape HTML to prevent rendering issues
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 25px;
    }
    
    .page {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto 40px;
      page-break-after: always;
    }
    
    .header {
      background: #BCFF31;
      padding: 25px 20px;
      margin: -25px -25px 25px -25px;
      text-align: center;
      border-radius: 0;
    }
    
    .header .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .header .logo {
      width: 44px;
      height: 44px;
      background: #000;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }
    
    .header .logo svg {
      width: 100%;
      height: 100%;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 900;
      color: #000;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #000;
      font-weight: 600;
      margin-top: 6px;
    }
    
    .header .id {
      font-size: 11px;
      color: #555;
      font-family: 'Courier New', monospace;
      margin-top: 10px;
      background: rgba(0,0,0,0.05);
      padding: 6px 12px;
      border-radius: 6px;
      display: inline-block;
    }
    
    h2 {
      font-size: 16px;
      font-weight: 900;
      margin: 25px 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 3px solid #BCFF31;
      color: #000;
      letter-spacing: -0.3px;
    }
    
    .row {
      margin-bottom: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .label {
      font-weight: 700;
      display: inline-block;
      min-width: 140px;
      color: #000;
    }
    
    .value {
      display: inline;
      color: #333;
    }
    
    .box {
      background: #f9f9f9;
      border-left: 4px solid #BCFF31;
      border-radius: 8px;
      padding: 15px;
      margin: 12px 0;
    }
    
    .box-title {
      font-weight: 900;
      font-size: 15px;
      margin-bottom: 10px;
      color: #000;
    }
    
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    ul li {
      margin: 8px 0;
      line-height: 1.5;
    }
    
    ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    
    ol li {
      margin: 6px 0;
      line-height: 1.5;
    }
    
    .sig-box {
      background: #BCFF31;
      border-radius: 12px;
      padding: 18px;
      margin: 15px 0;
    }
    
    .sig-row {
      margin: 8px 0;
    }
    
    .sig-label {
      font-weight: 900;
      display: inline-block;
      min-width: 100px;
      color: #000;
    }
    
    .sig-value {
      font-size: 11px;
      color: #000;
      word-break: break-all;
      font-family: 'Courier New', monospace;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 12px;
      font-size: 11px;
      color: #666;
    }
    
    .footer .brand-small {
      font-weight: 900;
      color: #000;
      font-size: 12px;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BCFF31" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1>GUILD</h1>
      </div>
      <div class="subtitle">${title}</div>
      <div class="id">${escapeHtml(contract.id)}</div>
    </div>

    <h2>${isArabic ? 'معلومات الوظيفة' : 'Job Information'}</h2>
    <div class="row">
      <span class="label">${isArabic ? 'العنوان:' : 'Title:'}</span>
      <span class="value">${escapeHtml(contract.jobTitle)}</span>
    </div>
    <div class="row">
      <span class="label">${isArabic ? 'الوصف:' : 'Description:'}</span>
      <span class="value">${escapeHtml(contract.jobDescription)}</span>
    </div>

    <h2>${isArabic ? 'الأطراف' : 'Parties'}</h2>
    
    <div class="box">
      <div class="box-title">${isArabic ? 'صاحب العمل (Poster)' : 'Job Poster'}</div>
      <div class="row">
        <span class="label">${isArabic ? 'الاسم:' : 'Name:'}</span>
        <span class="value">${escapeHtml(contract.poster.name)}</span>
      </div>
      <div class="row">
        <span class="label">GID:</span>
        <span class="value">${escapeHtml(contract.poster.gid)}</span>
      </div>
      ${contract.poster.email ? `<div class="row">
        <span class="label">${isArabic ? 'البريد:' : 'Email:'}</span>
        <span class="value">${escapeHtml(contract.poster.email)}</span>
      </div>` : ''}
    </div>

    <div class="box">
      <div class="box-title">${isArabic ? 'المنفذ (Doer)' : 'Job Doer'}</div>
      <div class="row">
        <span class="label">${isArabic ? 'الاسم:' : 'Name:'}</span>
        <span class="value">${escapeHtml(contract.doer.name)}</span>
      </div>
      <div class="row">
        <span class="label">GID:</span>
        <span class="value">${escapeHtml(contract.doer.gid)}</span>
      </div>
      ${contract.doer.email ? `<div class="row">
        <span class="label">${isArabic ? 'البريد:' : 'Email:'}</span>
        <span class="value">${escapeHtml(contract.doer.email)}</span>
      </div>` : ''}
    </div>

    <h2>${isArabic ? 'الشروط المالية' : 'Financial Terms'}</h2>
    <div class="row">
      <span class="label">${isArabic ? 'الميزانية:' : 'Budget:'}</span>
      <span class="value">${escapeHtml(contract.budget)} ${escapeHtml(contract.currency)}</span>
    </div>
    <div class="row">
      <span class="label">${isArabic ? 'شروط الدفع:' : 'Payment Terms:'}</span>
      <span class="value">${escapeHtml(paymentTerms)}</span>
    </div>

    <h2>${isArabic ? 'الجدول الزمني' : 'Timeline'}</h2>
    <div class="row">
      <span class="label">${isArabic ? 'تاريخ البدء:' : 'Start Date:'}</span>
      <span class="value">${formatDate(contract.startDate)}</span>
    </div>
    <div class="row">
      <span class="label">${isArabic ? 'تاريخ الانتهاء:' : 'End Date:'}</span>
      <span class="value">${formatDate(contract.endDate)}</span>
    </div>
    <div class="row">
      <span class="label">${isArabic ? 'المدة المتوقعة:' : 'Duration:'}</span>
      <span class="value">${escapeHtml(contract.estimatedDuration)}</span>
    </div>

    <h2>${isArabic ? 'المخرجات' : 'Deliverables'}</h2>
    <ol>
      ${deliverables.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
    </ol>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BCFF31" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1>GUILD</h1>
      </div>
      <div class="subtitle">${title} - ${isArabic ? 'صفحة 2' : 'Page 2'}</div>
    </div>

    <h2>${isArabic ? 'قواعد المنصة' : 'Platform Rules'}</h2>
    <ul>
      ${contract.platformRules.map(rule => 
        `<li>${escapeHtml(isArabic ? rule.textAr : rule.text)}</li>`
      ).join('')}
    </ul>

    ${contract.posterRules.length > 0 ? `
    <h2>${isArabic ? 'شروط صاحب العمل' : 'Poster Terms'}</h2>
    <ul>
      ${contract.posterRules.map(rule => 
        `<li>${escapeHtml(isArabic ? rule.textAr : rule.text)}</li>`
      ).join('')}
    </ul>
    ` : ''}

    <h2>${isArabic ? 'التوقيعات الرقمية' : 'Digital Signatures'}</h2>
    
    ${contract.posterSignature ? `
    <div class="sig-box">
      <div class="sig-row">
        <span class="sig-label">${isArabic ? 'صاحب العمل:' : 'Poster:'}</span>
        <span class="value">${escapeHtml(contract.poster.gid)}</span>
      </div>
      <div class="sig-row">
        <span class="sig-label">${isArabic ? 'التوقيع:' : 'Signature:'}</span>
        <div class="sig-value">${contract.posterSignature.signature.substring(0, 50)}...</div>
      </div>
      <div class="sig-row">
        <span class="sig-label">${isArabic ? 'التاريخ:' : 'Date:'}</span>
        <span class="value">${formatDate(contract.posterSignature.signedAt)}</span>
      </div>
    </div>
    ` : `<p>${isArabic ? 'في انتظار توقيع صاحب العمل' : 'Awaiting poster signature'}</p>`}

    ${contract.doerSignature ? `
    <div class="sig-box">
      <div class="sig-row">
        <span class="sig-label">${isArabic ? 'المنفذ:' : 'Doer:'}</span>
        <span class="value">${escapeHtml(contract.doer.gid)}</span>
      </div>
      <div class="sig-row">
        <span class="sig-label">${isArabic ? 'التوقيع:' : 'Signature:'}</span>
        <div class="sig-value">${contract.doerSignature.signature.substring(0, 50)}...</div>
      </div>
      <div class="sig-row">
        <span class="sig-label">${isArabic ? 'التاريخ:' : 'Date:'}</span>
        <span class="value">${formatDate(contract.doerSignature.signedAt)}</span>
      </div>
    </div>
    ` : `<p>${isArabic ? 'في انتظار توقيع المنفذ' : 'Awaiting doer signature'}</p>`}

    <div class="footer">
      <div class="brand-small">GUILD</div>
      <p>${isArabic ? 'منصة GUILD للعمل الحر' : 'GUILD Freelance Platform'}</p>
      <p>Contract v${escapeHtml(contract.version)} • ${formatDate(contract.createdAt)}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate and download PDF
   * Saves to app's document directory (accessible in production builds)
   */
  async generatePDF(contractId: string, language: 'en' | 'ar' = 'en'): Promise<string> {
    try {
      const contract = await this.getContract(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Dynamic import to avoid issues if not available
      const Print = await import('expo-print');
      const FileSystem = await import('expo-file-system');

      const html = this.generateContractHTML(contract, language);
      
      const { uri } = await Print.printToFileAsync({ html });
      
      // Note: In Expo Go, this saves to cache (temporary)
      // In production build, this would be in app's document directory
      console.log('✅ PDF generated:', uri);
      console.log('📁 Location: Expo Go cache (temporary)');
      console.log('📱 In production: Will be in Documents folder');
      
      return uri;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }

  /**
   * Share PDF via native share sheet
   * Uses React Native's Share API (no deprecated methods)
   */
  async sharePDF(contractId: string, language: 'en' | 'ar' = 'en'): Promise<void> {
    try {
      const pdfUri = await this.generatePDF(contractId, language);
      
      // Use React Native's Share API (more reliable, no deprecated warnings)
      const { Share, Platform } = await import('react-native');
      
      const message = language === 'ar' 
        ? `عقد GUILD - ${contractId}`
        : `GUILD Contract - ${contractId}`;
      
      if (Platform.OS === 'android') {
        // Android can share file URIs directly
        await Share.share({
          message: message,
          url: pdfUri,
          title: language === 'ar' ? 'مشاركة العقد' : 'Share Contract',
        });
      } else {
        // iOS
        await Share.share({
          url: pdfUri,
          title: language === 'ar' ? 'مشاركة العقد' : 'Share Contract',
        });
      }

      console.log('✅ PDF shared successfully via React Native Share');
    } catch (error) {
      console.error('PDF sharing failed:', error);
      throw error;
    }
  }
}

export const contractService = new ContractService();
export default contractService;

