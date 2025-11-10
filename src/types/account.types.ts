/**
 * Account Management Types
 * 
 * For account deletion, preferences, and data management
 * Apple Guideline 5.1.1(v) - Account Deletion Requirement
 */

export interface AccountDeletionRequest {
  userId: string;
  reason?: string;
  confirmationCode?: string;
  timestamp: Date;
}

export interface AccountDeletionResponse {
  success: boolean;
  message: string;
  deletionId?: string;
  scheduledFor?: Date;
}

export interface AccountDeletionStatus {
  userId: string;
  status: 'pending' | 'scheduled' | 'completed' | 'failed';
  requestedAt: Date;
  scheduledFor?: Date;
  completedAt?: Date;
  reason?: string;
  error?: string;
}

export interface UserDataExport {
  userId: string;
  exportedAt: Date;
  data: {
    profile: any;
    jobs: any[];
    transactions: any[];
    chats: any[];
    guilds: any[];
  };
}

export type DeletionReason = 
  | 'no_longer_needed'
  | 'privacy_concerns'
  | 'switching_platforms'
  | 'too_expensive'
  | 'not_enough_features'
  | 'other';


