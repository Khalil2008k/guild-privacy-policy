
// Advanced Transifex i18n Collaboration for Translation Management
import { logger } from '../utils/logger';

export interface TransifexProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  sourceLanguage: string;
  targetLanguages: string[];
  maintainers: string[];
  collaborators: string[];
}

export interface TranslationString {
  key: string;
  sourceText: string;
  translations: Record<string, string>;
  context?: string;
  tags?: string[];
  status: 'translated' | 'needs_review' | 'needs_translation';
}

export interface TranslationReview {
  id: string;
  stringKey: string;
  language: string;
  reviewer: string;
  status: 'approved' | 'rejected' | 'needs_changes';
  comments: string;
  createdAt: Date;
}

export interface TranslationStatistics {
  totalStrings: number;
  translatedStrings: number;
  reviewedStrings: number;
  completionRate: number;
  languages: Record<string, {
    total: number;
    translated: number;
    reviewed: number;
    completion: number;
  }>;
}

export class TransifexI18nService {
  private apiKey: string;
  private apiUrl: string;
  private project: TransifexProject;
  private strings: Map<string, TranslationString> = new Map();
  private reviews: Map<string, TranslationReview> = new Map();

  constructor(apiKey: string, project: TransifexProject) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://rest.api.transifex.com';
    this.project = project;
    this.initializeStrings();
  }

  private initializeStrings() {
    // Initialize with sample translation strings
    const sampleStrings: TranslationString[] = [
      {
        key: 'welcome.title',
        sourceText: 'Welcome to Guild',
        translations: {
          ar: 'مرحباً بك في غيلد',
          fr: 'Bienvenue sur Guild',
          es: 'Bienvenido a Guild',
          de: 'Willkommen bei Guild'
        },
        context: 'Main welcome message on homepage',
        tags: ['homepage', 'welcome'],
        status: 'translated'
      },
      {
        key: 'jobs.post.title',
        sourceText: 'Post a Job',
        translations: {
          ar: 'نشر وظيفة',
          fr: 'Publier un emploi',
          es: 'Publicar un trabajo',
          de: 'Job veröffentlichen'
        },
        context: 'Button text for posting jobs',
        tags: ['jobs', 'action'],
        status: 'translated'
      },
      {
        key: 'profile.skills.placeholder',
        sourceText: 'Enter your skills (e.g., JavaScript, React, Node.js)',
        translations: {
          ar: 'أدخل مهاراتك (مثل جافا سكريبت، رياكت، نود جي اس)',
          fr: 'Entrez vos compétences (ex: JavaScript, React, Node.js)',
          es: 'Ingrese sus habilidades (ej: JavaScript, React, Node.js)',
          de: 'Geben Sie Ihre Fähigkeiten ein (z.B. JavaScript, React, Node.js)'
        },
        context: 'Placeholder text for skills input field',
        tags: ['profile', 'form'],
        status: 'translated'
      }
    ];

    sampleStrings.forEach(string => {
      this.strings.set(string.key, string);
    });
  }

  // Sync translations from Transifex
  async syncFromTransifex(): Promise<void> {
    try {
      logger.info('Syncing translations from Transifex...');

      // In a real implementation, this would call Transifex API
      // For now, simulate sync process

      const response = await fetch(`${this.apiUrl}/projects/${this.project.slug}/resources/`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Process synced translations
        await this.processSyncedTranslations();
      }

      logger.info('Translations synced from Transifex');

    } catch (error: any) {
      logger.error('Failed to sync from Transifex', { error: error.message });
      throw error;
    }
  }

  private async processSyncedTranslations(): Promise<void> {
    // Process and validate synced translations
    for (const [key, string] of this.strings) {
      // Validate translation quality
      if (string.translations) {
        for (const [language, translation] of Object.entries(string.translations)) {
          if (translation.length < string.sourceText.length * 0.5) {
            string.status = 'needs_review';
            logger.warn('Translation quality issue detected', { key, language, translation });
          }
        }
      }
    }
  }

  // Push new strings to Transifex
  async pushToTransifex(newStrings: TranslationString[]): Promise<void> {
    try {
      logger.info('Pushing new strings to Transifex...', { count: newStrings.length });

      // In a real implementation, this would call Transifex API
      for (const string of newStrings) {
        this.strings.set(string.key, string);

        // Send to Transifex
        await this.sendStringToTransifex(string);
      }

      logger.info('New strings pushed to Transifex');

    } catch (error: any) {
      logger.error('Failed to push to Transifex', { error: error.message });
      throw error;
    }
  }

  private async sendStringToTransifex(string: TranslationString): Promise<void> {
    // Send string to Transifex API
    const response = await fetch(`${this.apiUrl}/projects/${this.project.slug}/resources/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          id: string.key,
          type: 'resource_strings',
          attributes: {
            key: string.key,
            source_string: string.sourceText,
            context: string.context,
            tags: string.tags,
            developer_comment: string.context
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send string to Transifex: ${response.status}`);
    }
  }

  // Submit translation for review
  async submitForReview(stringKey: string, language: string, translation: string, reviewer?: string): Promise<string> {
    try {
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const review: TranslationReview = {
        id: reviewId,
        stringKey,
        language,
        reviewer: reviewer || 'system',
        status: 'pending',
        comments: '',
        createdAt: new Date()
      };

      this.reviews.set(reviewId, review);

      // In a real implementation, this would notify reviewers
      await this.notifyReviewers(review);

      logger.info('Translation submitted for review', { reviewId, stringKey, language });

      return reviewId;

    } catch (error: any) {
      logger.error('Failed to submit for review', { error: error.message });
      throw error;
    }
  }

  private async notifyReviewers(review: TranslationReview): Promise<void> {
    // Send notifications to reviewers
    logger.info('Reviewers notified', { reviewId: review.id, language: review.language });
  }

  // Approve or reject translation
  async reviewTranslation(reviewId: string, status: 'approved' | 'rejected', comments: string): Promise<void> {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      review.status = status;
      review.comments = comments;

      // Update string status
      const string = this.strings.get(review.stringKey);
      if (string) {
        if (status === 'approved') {
          string.status = 'translated';
        } else {
          string.status = 'needs_changes';
        }
      }

      logger.info('Translation review completed', { reviewId, status, comments });

    } catch (error: any) {
      logger.error('Failed to review translation', { error: error.message });
      throw error;
    }
  }

  // Get translation statistics
  getTranslationStatistics(): TranslationStatistics {
    const strings = Array.from(this.strings.values());
    const totalStrings = strings.length;
    const translatedStrings = strings.filter(s => s.status === 'translated').length;
    const reviewedStrings = strings.filter(s =>
      Object.values(s.translations).every(t => t && t.trim().length > 0)
    ).length;

    const completionRate = totalStrings > 0 ? (translatedStrings / totalStrings) * 100 : 0;

    // Calculate per-language statistics
    const languages: Record<string, any> = {};
    const allLanguages = new Set(strings.flatMap(s => Object.keys(s.translations)));

    allLanguages.forEach(language => {
      const langStrings = strings.filter(s => s.translations[language]);
      const translated = langStrings.filter(s => s.translations[language].trim().length > 0).length;
      const reviewed = langStrings.filter(s => s.status === 'translated').length;

      languages[language] = {
        total: langStrings.length,
        translated,
        reviewed,
        completion: langStrings.length > 0 ? (translated / langStrings.length) * 100 : 0
      };
    });

    return {
      totalStrings,
      translatedStrings,
      reviewedStrings,
      completionRate,
      languages
    };
  }

  // Get strings needing translation
  getStringsNeedingTranslation(language?: string): TranslationString[] {
    let strings = Array.from(this.strings.values());

    if (language) {
      strings = strings.filter(s => !s.translations[language] || s.translations[language].trim() === '');
    } else {
      strings = strings.filter(s => s.status !== 'translated');
    }

    return strings.sort((a, b) => {
      // Sort by priority: needs_translation > needs_review > translated
      const priorityOrder = { needs_translation: 0, needs_review: 1, translated: 2 };
      return priorityOrder[a.status] - priorityOrder[b.status];
    });
  }

  // Export translations for application
  exportTranslations(format: 'json' | 'po' | 'xliff' = 'json'): string {
    const translations: Record<string, Record<string, string>> = {};

    // Group translations by language
    for (const [key, string] of this.strings) {
      for (const [language, translation] of Object.entries(string.translations)) {
        if (!translations[language]) {
          translations[language] = {};
        }
        translations[language][key] = translation;
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
    // Convert to PO format (simplified)
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
    // Convert to XLIFF format (simplified)
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

export const transifexI18nService = new TransifexI18nService(
  process.env.TRANSIFEX_API_KEY || 'your-transifex-api-key',
  {
    id: 'guild_platform',
    name: 'Guild Platform',
    slug: 'guild-platform',
    description: 'Translation project for Guild platform',
    sourceLanguage: 'en',
    targetLanguages: ['ar', 'fr', 'es', 'de', 'pt', 'ja', 'ko'],
    maintainers: ['admin@guild.com'],
    collaborators: ['translator1@guild.com', 'translator2@guild.com']
  }
);
