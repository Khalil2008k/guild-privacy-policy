
// Advanced Crowdin i18n Collaboration for Translation Management
import { logger } from '../utils/logger';

export interface CrowdinProject {
  id: string;
  name: string;
  identifier: string;
  description: string;
  sourceLanguage: string;
  targetLanguages: string[];
  maintainers: string[];
  collaborators: string[];
  workflow: TranslationWorkflow;
}

export interface TranslationWorkflow {
  steps: WorkflowStep[];
  reviewers: string[];
  approvalRequired: boolean;
  autoPublish: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'translate' | 'review' | 'approve' | 'publish';
  assignees: string[];
  deadline?: number; // hours
  required: boolean;
}

export interface TranslationFile {
  id: string;
  name: string;
  path: string;
  language: string;
  status: 'untranslated' | 'in_progress' | 'translated' | 'reviewed' | 'approved';
  words: number;
  translatedWords: number;
  approvedWords: number;
  translator?: string;
  reviewer?: string;
  updatedAt: Date;
}

export interface TranslationProgress {
  totalWords: number;
  translatedWords: number;
  approvedWords: number;
  completionRate: number;
  languages: Record<string, {
    total: number;
    translated: number;
    approved: number;
    completion: number;
  }>;
}

export class CrowdinI18nService {
  private apiKey: string;
  private apiUrl: string;
  private project: CrowdinProject;
  private files: Map<string, TranslationFile> = new Map();

  constructor(apiKey: string, project: CrowdinProject) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.crowdin.com/api/v2';
    this.project = project;
    this.initializeFiles();
  }

  private initializeFiles() {
    const sampleFiles: TranslationFile[] = [
      {
        id: 'app_strings',
        name: 'app_strings.json',
        path: '/locales/{{lng}}/{{ns}}.json',
        language: 'en',
        status: 'approved',
        words: 1250,
        translatedWords: 1250,
        approvedWords: 1250,
        translator: 'translator1',
        reviewer: 'reviewer1',
        updatedAt: new Date()
      }
    ];

    sampleFiles.forEach(file => {
      this.files.set(file.id, file);
    });
  }

  // Sync translations from Crowdin
  async syncFromCrowdin(): Promise<void> {
    try {
      logger.info('Syncing translations from Crowdin...');

      const response = await fetch(`${this.apiUrl}/projects/${this.project.identifier}/translations`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await this.processSyncedTranslations();
      }

      logger.info('Translations synced from Crowdin');

    } catch (error: any) {
      logger.error('Failed to sync from Crowdin', { error: error.message });
      throw error;
    }
  }

  private async processSyncedTranslations(): Promise<void> {
    for (const [key, file] of this.files) {
      if (file.status === 'approved') {
        await this.publishTranslation(file);
      }
    }
  }

  private async publishTranslation(file: TranslationFile): Promise<void> {
    // Update application with approved translations
    logger.info('Publishing translation', { fileId: file.id, language: file.language });
  }

  // Push new strings to Crowdin
  async pushToCrowdin(newStrings: Record<string, string>): Promise<void> {
    try {
      logger.info('Pushing new strings to Crowdin...', { count: Object.keys(newStrings).length });

      for (const [key, value] of Object.entries(newStrings)) {
        await this.sendStringToCrowdin(key, value);
      }

      logger.info('New strings pushed to Crowdin');

    } catch (error: any) {
      logger.error('Failed to push to Crowdin', { error: error.message });
      throw error;
    }
  }

  private async sendStringToCrowdin(key: string, value: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects/${this.project.identifier}/strings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: key,
        text: value,
        context: `Translation key: ${key}`,
        fileId: 'app_strings'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send string to Crowdin: ${response.status}`);
    }
  }

  // Submit translation for review
  async submitForReview(fileId: string, language: string, translation: string): Promise<string> {
    try {
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.sendToCrowdinAPI('translations', {
        stringId: fileId,
        languageId: language,
        text: translation,
        status: 'pending'
      });

      logger.info('Translation submitted for review', { reviewId, fileId, language });

      return reviewId;

    } catch (error: any) {
      logger.error('Failed to submit for review', { error: error.message });
      throw error;
    }
  }

  private async sendToCrowdinAPI(endpoint: string, data: any): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects/${this.project.identifier}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Crowdin API error: ${response.status}`);
    }
  }

  // Get translation progress
  getTranslationProgress(): TranslationProgress {
    const files = Array.from(this.files.values());
    const totalWords = files.reduce((sum, f) => sum + f.words, 0);
    const translatedWords = files.reduce((sum, f) => sum + f.translatedWords, 0);
    const approvedWords = files.reduce((sum, f) => sum + f.approvedWords, 0);

    const completionRate = totalWords > 0 ? (approvedWords / totalWords) * 100 : 0;

    const languages: Record<string, any> = {};
    const allLanguages = new Set(files.map(f => f.language));

    allLanguages.forEach(language => {
      const langFiles = files.filter(f => f.language === language);
      const langTotal = langFiles.reduce((sum, f) => sum + f.words, 0);
      const langTranslated = langFiles.reduce((sum, f) => sum + f.translatedWords, 0);
      const langApproved = langFiles.reduce((sum, f) => sum + f.approvedWords, 0);

      languages[language] = {
        total: langTotal,
        translated: langTranslated,
        approved: langApproved,
        completion: langTotal > 0 ? (langApproved / langTotal) * 100 : 0
      };
    });

    return {
      totalWords,
      translatedWords,
      approvedWords,
      completionRate,
      languages
    };
  }

  // Get files needing translation
  getFilesNeedingTranslation(language?: string): TranslationFile[] {
    let files = Array.from(this.files.values());

    if (language) {
      files = files.filter(f => f.language === language && f.status !== 'approved');
    } else {
      files = files.filter(f => f.status !== 'approved');
    }

    return files.sort((a, b) => {
      const priorityOrder = { untranslated: 0, in_progress: 1, translated: 2, reviewed: 3, approved: 4 };
      return priorityOrder[a.status] - priorityOrder[b.status];
    });
  }

  // Export translations for application
  exportTranslations(format: 'json' | 'po' | 'xliff' = 'json'): string {
    const translations: Record<string, Record<string, string>> = {};

    for (const file of this.files.values()) {
      if (file.status === 'approved') {
        if (!translations[file.language]) {
          translations[file.language] = {};
        }
        // In a real implementation, this would extract actual translations
        translations[file.language][file.name] = 'translated_content';
      }
    }

    switch (format) {
      case 'json':
        return JSON.stringify(translations, null, 2);
      case 'po':
        return this.convertToPO(translations);
      case 'xliff':
        return this.convertToXLIFF(translations);
      default:
        return JSON.stringify(translations, null, 2);
    }
  }

  private convertToPO(translations: Record<string, Record<string, string>>): string {
    let po = '';

    for (const [language, strings] of Object.entries(translations)) {
      po += `# Translation for ${language}\n`;
      po += `msgid ""\n`;
      po += `msgstr ""\n`;
      po += `\"Language: ${language}\\n"\n\n`;

      for (const [key, translation] of Object.entries(strings)) {
        po += `msgid "${key}"\n`;
        po += `msgstr "${translation}"\n\n`;
      }
    }

    return po;
  }

  private convertToXLIFF(translations: Record<string, Record<string, string>>): string {
    let xliff = '<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2">\n';

    for (const [language, strings] of Object.entries(translations)) {
      xliff += `  <file source-language="en" target-language="${language}">\n`;

      for (const [key, translation] of Object.entries(strings)) {
        xliff += `    <trans-unit id="${key}">\n`;
        xliff += `      <source>${key}</source>\n`;
        xliff += `      <target>${translation}</target>\n`;
        xliff += `    </trans-unit>\n`;
      }

      xliff += `  </file>\n`;
    }

    xliff += '</xliff>';
    return xliff;
  }
}

export const crowdinI18nService = new CrowdinI18nService(
  process.env.CROWDIN_API_KEY || 'your-crowdin-api-key',
  {
    id: 'guild_platform',
    name: 'Guild Platform',
    identifier: 'guild-platform',
    description: 'Translation project for Guild platform',
    sourceLanguage: 'en',
    targetLanguages: ['ar', 'fr', 'es', 'de', 'pt', 'ja', 'ko'],
    maintainers: ['admin@guild.com'],
    collaborators: ['translator1@guild.com', 'translator2@guild.com'],
    workflow: {
      steps: [
        {
          id: 'translate',
          name: 'Translation',
          type: 'translate',
          assignees: ['translator1', 'translator2'],
          deadline: 72,
          required: true
        },
        {
          id: 'review',
          name: 'Review',
          type: 'review',
          assignees: ['reviewer1'],
          deadline: 48,
          required: true
        },
        {
          id: 'approve',
          name: 'Approval',
          type: 'approve',
          assignees: ['admin'],
          deadline: 24,
          required: true
        }
      ],
      reviewers: ['reviewer1'],
      approvalRequired: true,
      autoPublish: true
    }
  }
);
