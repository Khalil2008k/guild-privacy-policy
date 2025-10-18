/**
 * Environment Configuration for Guild Mobile App
 * Manages different environments: development, staging, production
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  name: Environment;
  apiUrl: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  features: {
    enableAnalytics: boolean;
    enableCrashlytics: boolean;
    enablePerformanceMonitoring: boolean;
    enableDebugMode: boolean;
    enableTestData: boolean;
    enableBetaFeatures: boolean;
    enableAppCheck: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
  };
  api: {
    timeout: number;
    retryAttempts: number;
    enableMocking: boolean;
  };
}

// Development Environment
const developmentConfig: EnvironmentConfig = {
  name: 'development',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.34:5000/api',
  firebaseConfig: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "guild-4f46b.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "guild-4f46b",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "guild-4f46b.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "654144998705",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:654144998705:web:9c49a52bd633a436853410",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MQX879CXFY"
  },
  features: {
    enableAnalytics: false,
    enableCrashlytics: false,
    enablePerformanceMonitoring: true,
    enableDebugMode: true,
    enableTestData: true,
    enableBetaFeatures: true,
    enableAppCheck: false,
  },
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },
  api: {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    enableMocking: false,
  },
};

// Staging Environment
const stagingConfig: EnvironmentConfig = {
  name: 'staging',
  apiUrl: process.env.EXPO_PUBLIC_STAGING_API_URL || 'https://staging-api.guild.app/api/v1',
  firebaseConfig: {
    apiKey: process.env.EXPO_PUBLIC_STAGING_FIREBASE_API_KEY || "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w",
    authDomain: process.env.EXPO_PUBLIC_STAGING_FIREBASE_AUTH_DOMAIN || "guild-staging.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_STAGING_FIREBASE_PROJECT_ID || "guild-staging",
    storageBucket: process.env.EXPO_PUBLIC_STAGING_FIREBASE_STORAGE_BUCKET || "guild-staging.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_STAGING_FIREBASE_MESSAGING_SENDER_ID || "654144998705",
    appId: process.env.EXPO_PUBLIC_STAGING_FIREBASE_APP_ID || "1:654144998705:web:staging123456",
    measurementId: process.env.EXPO_PUBLIC_STAGING_FIREBASE_MEASUREMENT_ID || "G-STAGING123"
  },
  features: {
    enableAnalytics: true,
    enableCrashlytics: true,
    enablePerformanceMonitoring: true,
    enableDebugMode: true,
    enableTestData: false,
    enableBetaFeatures: true,
    enableAppCheck: true,
  },
  logging: {
    level: 'info',
    enableConsole: true,
    enableRemote: true,
  },
  api: {
    timeout: 8000, // 8 seconds
    retryAttempts: 2,
    enableMocking: false,
  },
};

// Production Environment
const productionConfig: EnvironmentConfig = {
  name: 'production',
  apiUrl: process.env.EXPO_PUBLIC_PROD_API_URL || process.env.EXPO_PUBLIC_API_URL!,
  firebaseConfig: {
    apiKey: process.env.EXPO_PUBLIC_PROD_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_PROD_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_PROD_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.EXPO_PUBLIC_PROD_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.EXPO_PUBLIC_PROD_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.EXPO_PUBLIC_PROD_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.EXPO_PUBLIC_PROD_FIREBASE_MEASUREMENT_ID || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID!
  },
  features: {
    enableAnalytics: true,
    enableCrashlytics: true,
    enablePerformanceMonitoring: true,
    enableDebugMode: false,
    enableTestData: false,
    enableBetaFeatures: false,
    enableAppCheck: true,
  },
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true,
  },
  api: {
    timeout: 5000, // 5 seconds
    retryAttempts: 1,
    enableMocking: false,
  },
};

/**
 * Get current environment from various sources
 */
function getCurrentEnvironment(): Environment {
  // Priority order:
  // 1. EXPO_PUBLIC_ENVIRONMENT env var
  // 2. NODE_ENV
  // 3. __DEV__ flag
  // 4. Default to development

  const envVar = process.env.EXPO_PUBLIC_ENVIRONMENT as Environment;
  if (envVar && ['development', 'staging', 'production'].includes(envVar)) {
    return envVar;
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    return 'production';
  }

  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return 'production';
  }

  return 'development';
}

/**
 * Get configuration for current environment
 */
function getEnvironmentConfig(): EnvironmentConfig {
  const currentEnv = getCurrentEnvironment();

  switch (currentEnv) {
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Export current configuration
export const config = getEnvironmentConfig();
export const environment = getCurrentEnvironment();

// Export individual configs for testing
export const environments = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

// Utility functions
export const isDevelopment = () => environment === 'development';
export const isStaging = () => environment === 'staging';
export const isProduction = () => environment === 'production';

// Feature flags
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  return config.features[feature];
};

// Logging helper
export const shouldLog = (level: 'debug' | 'info' | 'warn' | 'error'): boolean => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(config.logging.level);
  const requestedLevelIndex = levels.indexOf(level);
  
  return requestedLevelIndex >= currentLevelIndex;
};

// Environment info for debugging
export const getEnvironmentInfo = () => ({
  environment,
  config: {
    ...config,
    firebaseConfig: {
      ...config.firebaseConfig,
      apiKey: config.firebaseConfig.apiKey.substring(0, 10) + '...' // Mask API key
    }
  },
  timestamp: new Date().toISOString(),
});

// Validate environment configuration
export const validateEnvironmentConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required Firebase config
  if (!config.firebaseConfig.apiKey) {
    errors.push('Firebase API key is missing');
  }
  if (!config.firebaseConfig.projectId) {
    errors.push('Firebase project ID is missing');
  }

  // Check API URL
  if (!config.apiUrl) {
    errors.push('API URL is missing');
  }

  // Validate URLs
  try {
    new URL(config.apiUrl);
  } catch {
    errors.push('API URL is not a valid URL');
  }

  // Production-specific validations
  if (isProduction()) {
    const requiredEnvVars = [
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_APP_ID'
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar] && !process.env[envVar.replace('EXPO_PUBLIC_', 'EXPO_PUBLIC_PROD_')]) {
        errors.push(`Required environment variable missing: ${envVar}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Initialize environment (call this early in app startup)
export const initializeEnvironment = () => {
  const validation = validateEnvironmentConfig();
  
  if (!validation.isValid) {
    console.error('❌ Environment configuration errors:', validation.errors);
    if (isProduction()) {
      throw new Error('Invalid environment configuration in production');
    }
  }

  if (shouldLog('info')) {
    console.log('🌍 Environment initialized:', {
      environment,
      apiUrl: config.apiUrl,
      features: config.features,
      logging: config.logging
    });
  }
};

export default config;
