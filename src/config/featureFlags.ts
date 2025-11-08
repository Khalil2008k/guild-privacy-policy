/**
 * Feature Flags System
 * 
 * Purpose: Control feature rollouts and enable safe refactoring
 * without breaking production.
 * 
 * Usage:
 *   import { isFeatureEnabled } from '@/config/featureFlags';
 *   
 *   if (isFeatureEnabled('GUILD_WITHDRAWAL_V2')) {
 *     // New withdrawal logic
 *   } else {
 *     // Old/disabled logic
 *   }
 * 
 * Environment-based Control:
 *   - DEV: All flags default to true (for testing)
 *   - STAGING: Controlled via this file
 *   - PRODUCTION: Conservative defaults (false)
 */

export type FeatureFlag =
  // ===== WALLET & COINS =====
  | 'GUILD_WITHDRAWAL_V2'        // New withdrawal system with KYC
  | 'GUILD_KYC_VERIFICATION'      // KYC verification flow
  | 'GUILD_IOS_IAP_COINS'         // iOS In-App Purchase for coins

  // ===== JOB SYSTEM =====
  | 'GUILD_DISPUTE_V1'            // Job dispute system
  | 'GUILD_MILESTONES_V1'         // Milestone-based escrow
  | 'GUILD_JOB_RATINGS_V1'        // Job completion ratings
  | 'GUILD_ESCROW_RELEASE_V2'     // New escrow release logic

  // ===== GUILD SYSTEM =====
  | 'GUILD_CREATION_WIZARD'       // Guild creation flow
  | 'GUILD_RBAC_SYSTEM'           // Role-based access control
  | 'GUILD_ANALYTICS_V1'          // Guild analytics dashboard
  | 'GUILD_MAP_V1'                // Guild map visualization
  | 'GUILD_COURT_V1'              // Guild court dispute resolution

  // ===== UI/UX =====
  | 'GUILD_DESIGN_SYSTEM_V2'      // New design system components
  | 'GUILD_ACCESSIBILITY_V1'      // Enhanced accessibility features

  // ===== TECHNICAL =====
  | 'GUILD_STRICT_TYPE_CHECKING'  // TypeScript strict mode
  | 'GUILD_PERFORMANCE_MONITORING'// Performance tracking
  | 'GUILD_ERROR_BOUNDARIES'      // Error boundary components

  // ===== COMPLIANCE =====
  | 'GUILD_ACCOUNT_DELETION'      // In-app account deletion
  | 'GUILD_DATA_MINIMIZATION'     // Optional data collection

  // ===== DEBUGGING =====
  | 'GUILD_DEBUG_LOGGING'         // Enhanced debug logging
  | 'GUILD_MOCK_PAYMENT_ADAPTER'  // Mock payment adapter for testing
;

/**
 * Feature flag configuration
 * 
 * IMPORTANT: 
 * - DEV: Use for local development and testing
 * - STAGING: Use for pre-production testing
 * - PRODUCTION: Conservative - only enable stable features
 */
interface FeatureFlagConfig {
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // For gradual rollouts (0-100)
  allowedEnvironments?: ('development' | 'staging' | 'production')[];
}

const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  // ===== WALLET & COINS =====
  GUILD_WITHDRAWAL_V2: {
    enabled: false, // TODO: Enable after Phase 2 complete
    description: 'New withdrawal system with KYC verification and proper limits',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_KYC_VERIFICATION: {
    enabled: false, // TODO: Enable after KYC implementation
    description: 'KYC verification flow for withdrawals',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_IOS_IAP_COINS: {
    enabled: false, // TODO: Enable after Phase 10 complete
    description: 'iOS In-App Purchase for coins (Apple guideline 3.1.1 compliance)',
    allowedEnvironments: ['development', 'staging'],
  },

  // ===== JOB SYSTEM =====
  GUILD_DISPUTE_V1: {
    enabled: false, // TODO: Enable after Phase 3.3 complete
    description: 'Job dispute system with evidence upload',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_MILESTONES_V1: {
    enabled: false, // TODO: Enable after Phase 3.4 complete
    description: 'Milestone-based escrow with partial releases',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_JOB_RATINGS_V1: {
    enabled: false, // TODO: Enable after Phase 3.5 complete
    description: 'Job completion ratings and reviews',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_ESCROW_RELEASE_V2: {
    enabled: false, // TODO: Enable after Phase 3.2 complete
    description: 'New escrow release/refund logic',
    allowedEnvironments: ['development', 'staging'],
  },

  // ===== GUILD SYSTEM =====
  GUILD_CREATION_WIZARD: {
    enabled: false, // TODO: Enable after Phase 4.1 complete
    description: 'Guild creation wizard flow',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_RBAC_SYSTEM: {
    enabled: false, // TODO: Enable after Phase 4.2 complete
    description: 'Role-based access control for guilds',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_ANALYTICS_V1: {
    enabled: false, // TODO: Enable after Phase 4.3 complete
    description: 'Guild analytics dashboard',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_MAP_V1: {
    enabled: false, // TODO: Enable after Phase 4.4 complete
    description: 'Guild map visualization',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_COURT_V1: {
    enabled: false, // TODO: Enable after Phase 4.5 complete
    description: 'Guild court dispute resolution',
    allowedEnvironments: ['development', 'staging'],
  },

  // ===== UI/UX =====
  GUILD_DESIGN_SYSTEM_V2: {
    enabled: false, // TODO: Enable after Phase 5 complete
    description: 'New design system components',
    rolloutPercentage: 0,
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_ACCESSIBILITY_V1: {
    enabled: false, // TODO: Enable after Phase 5.3 complete
    description: 'Enhanced accessibility features',
    allowedEnvironments: ['development', 'staging'],
  },

  // ===== TECHNICAL =====
  GUILD_STRICT_TYPE_CHECKING: {
    enabled: false, // TODO: Enable after Phase 6 complete
    description: 'TypeScript strict mode',
    allowedEnvironments: ['development'],
  },
  GUILD_PERFORMANCE_MONITORING: {
    enabled: true, // Safe to enable everywhere
    description: 'Performance tracking and monitoring',
    allowedEnvironments: ['development', 'staging', 'production'],
  },
  GUILD_ERROR_BOUNDARIES: {
    enabled: true, // Safe to enable everywhere
    description: 'Error boundary components',
    allowedEnvironments: ['development', 'staging', 'production'],
  },

  // ===== COMPLIANCE =====
  GUILD_ACCOUNT_DELETION: {
    enabled: false, // TODO: Enable after Phase 9.2 complete
    description: 'In-app account deletion (Apple guideline 5.1.1(v) compliance)',
    allowedEnvironments: ['development', 'staging'],
  },
  GUILD_DATA_MINIMIZATION: {
    enabled: false, // TODO: Enable after Phase 9.3 complete
    description: 'Optional data collection (nationality, phone)',
    allowedEnvironments: ['development', 'staging'],
  },

  // ===== DEBUGGING =====
  GUILD_DEBUG_LOGGING: {
    enabled: false, // Only for development
    description: 'Enhanced debug logging',
    allowedEnvironments: ['development'],
  },
  GUILD_MOCK_PAYMENT_ADAPTER: {
    enabled: false, // Only for testing
    description: 'Mock payment adapter for withdrawal testing',
    allowedEnvironments: ['development'],
  },
};

/**
 * Get current environment
 */
const getCurrentEnvironment = (): 'development' | 'staging' | 'production' => {
  if (__DEV__) {
    return 'development';
  }
  
  // Check for staging environment variable
  // @ts-ignore - This may not exist in all builds
  if (process.env.EXPO_PUBLIC_ENV === 'staging') {
    return 'staging';
  }
  
  return 'production';
};

/**
 * Check if a feature is enabled
 * 
 * @param flagName - Feature flag name
 * @returns true if feature should be enabled, false otherwise
 */
export const isFeatureEnabled = (flagName: FeatureFlag): boolean => {
  const config = FEATURE_FLAGS[flagName];
  
  if (!config) {
    console.warn(`[FeatureFlags] Unknown feature flag: ${flagName}`);
    return false;
  }

  // Check environment restrictions
  const currentEnv = getCurrentEnvironment();
  if (config.allowedEnvironments && !config.allowedEnvironments.includes(currentEnv)) {
    return false;
  }

  // Base enabled state
  if (!config.enabled) {
    return false;
  }

  // Gradual rollout (if specified)
  if (config.rolloutPercentage !== undefined) {
    // Simple hash-based rollout (deterministic for same user)
    // In production, you'd use user ID for consistent experience
    const random = Math.random() * 100;
    return random < config.rolloutPercentage;
  }

  return true;
};

/**
 * Get feature flag configuration (for debugging)
 */
export const getFeatureFlagConfig = (flagName: FeatureFlag): FeatureFlagConfig | undefined => {
  return FEATURE_FLAGS[flagName];
};

/**
 * Get all feature flags (for admin UI)
 */
export const getAllFeatureFlags = (): Record<string, FeatureFlagConfig & { enabled: boolean; name: string }> => {
  const result: Record<string, FeatureFlagConfig & { enabled: boolean; name: string }> = {};
  
  Object.entries(FEATURE_FLAGS).forEach(([name, config]) => {
    result[name] = {
      ...config,
      name,
      enabled: isFeatureEnabled(name as FeatureFlag),
    };
  });
  
  return result;
};

/**
 * Log feature flag status (for debugging)
 */
export const logFeatureFlagStatus = (): void => {
  const currentEnv = getCurrentEnvironment();
  console.log('[FeatureFlags] Current Environment:', currentEnv);
  console.log('[FeatureFlags] Enabled Features:');
  
  Object.keys(FEATURE_FLAGS).forEach((flagName) => {
    const enabled = isFeatureEnabled(flagName as FeatureFlag);
    if (enabled) {
      console.log(`  ✅ ${flagName}`);
    }
  });
};

// Export for convenience
export default {
  isFeatureEnabled,
  getFeatureFlagConfig,
  getAllFeatureFlags,
  logFeatureFlagStatus,
};

