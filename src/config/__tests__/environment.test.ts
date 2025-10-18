/**
 * Environment Configuration Tests
 */

// Mock environment configuration
interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  API_BASE_URL: string;
  FIREBASE_CONFIG: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  FEATURES: {
    ENABLE_ANALYTICS: boolean;
    ENABLE_PUSH_NOTIFICATIONS: boolean;
    ENABLE_BIOMETRIC_AUTH: boolean;
    ENABLE_GUILD_MAP: boolean;
  };
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    NODE_ENV: env as 'development' | 'staging' | 'production',
    FIREBASE_CONFIG: {
      apiKey: 'mock-api-key',
      authDomain: 'guild-app.firebaseapp.com',
      projectId: 'guild-app',
      storageBucket: 'guild-app.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef123456'
    },
    FEATURES: {
      ENABLE_ANALYTICS: true,
      ENABLE_PUSH_NOTIFICATIONS: true,
      ENABLE_BIOMETRIC_AUTH: true,
      ENABLE_GUILD_MAP: false
    }
  };

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        API_BASE_URL: 'http://localhost:4000',
        FEATURES: {
          ...baseConfig.FEATURES,
          ENABLE_GUILD_MAP: true // Enable in development
        }
      };
    
    case 'staging':
      return {
        ...baseConfig,
        API_BASE_URL: 'https://staging-api.guildapp.com',
      };
    
    case 'production':
      return {
        ...baseConfig,
        API_BASE_URL: 'https://api.guildapp.com',
        FEATURES: {
          ...baseConfig.FEATURES,
          ENABLE_ANALYTICS: true,
          ENABLE_PUSH_NOTIFICATIONS: true
        }
      };
    
    default:
      return {
        ...baseConfig,
        API_BASE_URL: 'http://localhost:4000'
      };
  }
};

const isFeatureEnabled = (feature: keyof EnvironmentConfig['FEATURES']): boolean => {
  const config = getEnvironmentConfig();
  return config.FEATURES[feature];
};

const getApiBaseUrl = (): string => {
  return getEnvironmentConfig().API_BASE_URL;
};

const getFirebaseConfig = () => {
  return getEnvironmentConfig().FIREBASE_CONFIG;
};

describe('Environment Configuration', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('getEnvironmentConfig', () => {
    it('should return development config', () => {
      process.env.NODE_ENV = 'development';
      const config = getEnvironmentConfig();
      
      expect(config.NODE_ENV).toBe('development');
      expect(config.API_BASE_URL).toBe('http://localhost:4000');
      expect(config.FEATURES.ENABLE_GUILD_MAP).toBe(true);
    });

    it('should return staging config', () => {
      process.env.NODE_ENV = 'staging';
      const config = getEnvironmentConfig();
      
      expect(config.NODE_ENV).toBe('staging');
      expect(config.API_BASE_URL).toBe('https://staging-api.guildapp.com');
    });

    it('should return production config', () => {
      process.env.NODE_ENV = 'production';
      const config = getEnvironmentConfig();
      
      expect(config.NODE_ENV).toBe('production');
      expect(config.API_BASE_URL).toBe('https://api.guildapp.com');
      expect(config.FEATURES.ENABLE_ANALYTICS).toBe(true);
    });

    it('should default to development config', () => {
      delete process.env.NODE_ENV;
      const config = getEnvironmentConfig();
      
      expect(config.NODE_ENV).toBe('development');
      expect(config.API_BASE_URL).toBe('http://localhost:4000');
    });
  });

  describe('Firebase Configuration', () => {
    it('should return valid Firebase config', () => {
      const firebaseConfig = getFirebaseConfig();
      
      expect(firebaseConfig.apiKey).toBeTruthy();
      expect(firebaseConfig.authDomain).toBeTruthy();
      expect(firebaseConfig.projectId).toBeTruthy();
      expect(firebaseConfig.storageBucket).toBeTruthy();
      expect(firebaseConfig.messagingSenderId).toBeTruthy();
      expect(firebaseConfig.appId).toBeTruthy();
    });

    it('should have consistent project ID', () => {
      const config = getFirebaseConfig();
      expect(config.projectId).toBe('guild-app');
    });
  });

  describe('Feature Flags', () => {
    it('should check if analytics is enabled', () => {
      process.env.NODE_ENV = 'production';
      expect(isFeatureEnabled('ENABLE_ANALYTICS')).toBe(true);
    });

    it('should check if push notifications are enabled', () => {
      expect(isFeatureEnabled('ENABLE_PUSH_NOTIFICATIONS')).toBe(true);
    });

    it('should check if biometric auth is enabled', () => {
      expect(isFeatureEnabled('ENABLE_BIOMETRIC_AUTH')).toBe(true);
    });

    it('should check if guild map is enabled in development', () => {
      process.env.NODE_ENV = 'development';
      expect(isFeatureEnabled('ENABLE_GUILD_MAP')).toBe(true);
    });

    it('should check if guild map is disabled in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isFeatureEnabled('ENABLE_GUILD_MAP')).toBe(false);
    });
  });

  describe('API Configuration', () => {
    it('should return correct API base URL for development', () => {
      process.env.NODE_ENV = 'development';
      expect(getApiBaseUrl()).toBe('http://localhost:4000');
    });

    it('should return correct API base URL for staging', () => {
      process.env.NODE_ENV = 'staging';
      expect(getApiBaseUrl()).toBe('https://staging-api.guildapp.com');
    });

    it('should return correct API base URL for production', () => {
      process.env.NODE_ENV = 'production';
      expect(getApiBaseUrl()).toBe('https://api.guildapp.com');
    });
  });

  describe('Configuration Consistency', () => {
    it('should have all required configuration keys', () => {
      const config = getEnvironmentConfig();
      
      expect(config.NODE_ENV).toBeDefined();
      expect(config.API_BASE_URL).toBeDefined();
      expect(config.FIREBASE_CONFIG).toBeDefined();
      expect(config.FEATURES).toBeDefined();
    });

    it('should have all required feature flags', () => {
      const config = getEnvironmentConfig();
      
      expect(config.FEATURES.ENABLE_ANALYTICS).toBeDefined();
      expect(config.FEATURES.ENABLE_PUSH_NOTIFICATIONS).toBeDefined();
      expect(config.FEATURES.ENABLE_BIOMETRIC_AUTH).toBeDefined();
      expect(config.FEATURES.ENABLE_GUILD_MAP).toBeDefined();
    });
  });
});
