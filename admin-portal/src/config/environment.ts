/**
 * Environment Configuration for Guild Admin Portal
 * Manages different environments: development, staging, production
 */

export type Environment = 'development' | 'staging' | 'production';

interface AdminEnvironmentConfig {
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
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
    enableDebugMode: boolean;
    enableTestData: boolean;
    enableBetaFeatures: boolean;
    enableDemoMode: boolean;
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
  security: {
    enableCSP: boolean;
    enableHTTPS: boolean;
    sessionTimeout: number; // in minutes
  };
}

// Development Environment
const developmentConfig: AdminEnvironmentConfig = {
  name: 'development',
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  firebaseConfig: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "guild-dev-7f06e.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "guild-dev-7f06e",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "guild-dev-7f06e.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "654144998705",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:654144998705:web:9c49a52bd633a436853410",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-MQX879CXFY"
  },
  features: {
    enableAnalytics: false,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    enableDebugMode: true,
    enableTestData: false,
    enableBetaFeatures: true,
    enableDemoMode: false,
    enableAppCheck: false,
  },
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },
  api: {
    timeout: 15000, // 15 seconds for admin operations
    retryAttempts: 3,
    enableMocking: false,
  },
  security: {
    enableCSP: false,
    enableHTTPS: false,
    sessionTimeout: 480, // 8 hours
  },
};

// Staging Environment
const stagingConfig: AdminEnvironmentConfig = {
  name: 'staging',
  apiUrl: process.env.REACT_APP_STAGING_API_URL || 'https://staging-api.guild.app/api/v1',
  firebaseConfig: {
    apiKey: process.env.REACT_APP_STAGING_FIREBASE_API_KEY || "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w",
    authDomain: process.env.REACT_APP_STAGING_FIREBASE_AUTH_DOMAIN || "guild-staging.firebaseapp.com",
    projectId: process.env.REACT_APP_STAGING_FIREBASE_PROJECT_ID || "guild-staging",
    storageBucket: process.env.REACT_APP_STAGING_FIREBASE_STORAGE_BUCKET || "guild-staging.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_STAGING_FIREBASE_MESSAGING_SENDER_ID || "654144998705",
    appId: process.env.REACT_APP_STAGING_FIREBASE_APP_ID || "1:654144998705:web:staging123456",
    measurementId: process.env.REACT_APP_STAGING_FIREBASE_MEASUREMENT_ID || "G-STAGING123"
  },
  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    enableDebugMode: true,
    enableTestData: false,
    enableBetaFeatures: true,
    enableDemoMode: false,
    enableAppCheck: true,
  },
  logging: {
    level: 'info',
    enableConsole: true,
    enableRemote: true,
  },
  api: {
    timeout: 12000, // 12 seconds
    retryAttempts: 2,
    enableMocking: false,
  },
  security: {
    enableCSP: true,
    enableHTTPS: true,
    sessionTimeout: 240, // 4 hours
  },
};

// Production Environment
const productionConfig: AdminEnvironmentConfig = {
  name: 'production',
  apiUrl: process.env.REACT_APP_PROD_API_URL || process.env.REACT_APP_API_URL!,
  firebaseConfig: {
    apiKey: process.env.REACT_APP_PROD_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY!,
    authDomain: process.env.REACT_APP_PROD_FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.REACT_APP_PROD_FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.REACT_APP_PROD_FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.REACT_APP_PROD_FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.REACT_APP_PROD_FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID!,
    measurementId: process.env.REACT_APP_PROD_FIREBASE_MEASUREMENT_ID || process.env.REACT_APP_FIREBASE_MEASUREMENT_ID!
  },
  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    enableDebugMode: false,
    enableTestData: false,
    enableBetaFeatures: false,
    enableDemoMode: false,
    enableAppCheck: true,
  },
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true,
  },
  api: {
    timeout: 8000, // 8 seconds
    retryAttempts: 1,
    enableMocking: false,
  },
  security: {
    enableCSP: true,
    enableHTTPS: true,
    sessionTimeout: 120, // 2 hours
  },
};

/**
 * Get current environment
 */
function getCurrentEnvironment(): Environment {
  // Priority order:
  // 1. REACT_APP_ENVIRONMENT env var
  // 2. NODE_ENV
  // 3. Default to development

  const envVar = process.env.REACT_APP_ENVIRONMENT as Environment;
  if (envVar && ['development', 'staging', 'production'].includes(envVar)) {
    return envVar;
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    return 'production';
  }

  return 'development';
}

/**
 * Get configuration for current environment
 */
function getEnvironmentConfig(): AdminEnvironmentConfig {
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
export const adminConfig = getEnvironmentConfig();
export const adminEnvironment = getCurrentEnvironment();

// Export environment for backward compatibility
export const environment = adminConfig;

// Export individual configs for testing
export const adminEnvironments = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

// Utility functions
export const isAdminDevelopment = () => adminEnvironment === 'development';
export const isAdminStaging = () => adminEnvironment === 'staging';
export const isAdminProduction = () => adminEnvironment === 'production';

// Feature flags
export const isAdminFeatureEnabled = (feature: keyof AdminEnvironmentConfig['features']): boolean => {
  return adminConfig.features[feature];
};

// Logging helper
export const shouldAdminLog = (level: 'debug' | 'info' | 'warn' | 'error'): boolean => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(adminConfig.logging.level);
  const requestedLevelIndex = levels.indexOf(level);
  
  return requestedLevelIndex >= currentLevelIndex;
};

// Environment info for debugging
export const getAdminEnvironmentInfo = () => ({
  environment: adminEnvironment,
  config: {
    ...adminConfig,
    firebaseConfig: {
      ...adminConfig.firebaseConfig,
      apiKey: adminConfig.firebaseConfig.apiKey.substring(0, 10) + '...' // Mask API key
    }
  },
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
});

// Validate environment configuration
export const validateAdminEnvironmentConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required Firebase config
  if (!adminConfig.firebaseConfig.apiKey) {
    errors.push('Firebase API key is missing');
  }
  if (!adminConfig.firebaseConfig.projectId) {
    errors.push('Firebase project ID is missing');
  }

  // Check API URL
  if (!adminConfig.apiUrl) {
    errors.push('API URL is missing');
  }

  // Validate URLs
  try {
    new URL(adminConfig.apiUrl);
  } catch {
    errors.push('API URL is not a valid URL');
  }

  // Production-specific validations
  if (isAdminProduction()) {
    if (adminConfig.features.enableDemoMode) {
      errors.push('Demo mode should be disabled in production');
    }
    if (adminConfig.features.enableTestData) {
      errors.push('Test data should be disabled in production');
    }
    if (adminConfig.logging.enableConsole) {
      errors.push('Console logging should be disabled in production');
    }
    if (!adminConfig.security.enableHTTPS) {
      errors.push('HTTPS should be enabled in production');
    }

    // Check required environment variables
    const requiredEnvVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_STORAGE_BUCKET',
      'REACT_APP_FIREBASE_APP_ID'
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar] && !process.env[envVar.replace('REACT_APP_', 'REACT_APP_PROD_')]) {
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
export const initializeAdminEnvironment = () => {
  const validation = validateAdminEnvironmentConfig();
  
  if (!validation.isValid) {
    console.error('❌ Admin environment configuration errors:', validation.errors);
    if (isAdminProduction()) {
      throw new Error('Invalid admin environment configuration in production');
    }
  }

  if (shouldAdminLog('info')) {
    console.log('🌍 Admin environment initialized:', {
      environment: adminEnvironment,
      apiUrl: adminConfig.apiUrl,
      features: adminConfig.features,
      logging: adminConfig.logging,
      security: adminConfig.security
    });
  }

  // Set up CSP if enabled
  if (adminConfig.security.enableCSP && isAdminProduction()) {
    setupContentSecurityPolicy();
  }
};

// Setup Content Security Policy
function setupContentSecurityPolicy() {
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://api.guild.app https://*.firebaseapp.com https://*.googleapis.com;
  `.replace(/\s+/g, ' ').trim();
  
  document.head.appendChild(cspMeta);
}

export default adminConfig;
