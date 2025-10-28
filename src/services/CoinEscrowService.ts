/**
 * Coin Escrow Service
 * Handles escrow system for coin-based job payments
 * Manages coin locking, release, and refunds
 */

import { BackendAPI } from '../config/backend';

export interface EscrowRequest {
  jobId: string;
  clientId: string;
  freelancerId: string;
  amount: number; // Amount in coins
  description: string;
}

export interface EscrowResponse {
  success: boolean;
  escrowId?: string;
  message: string;
  lockedAmount?: number;
}

export interface ReleaseEscrowRequest {
  escrowId: string;
  completionNotes?: string;
}

export interface RefundEscrowRequest {
  escrowId: string;
  reason: string;
  cancelledBy: 'client' | 'freelancer' | 'admin';
}

export interface DisputeRequest {
  escrowId: string;
  raisedBy: 'client' | 'freelancer';
  reason: string;
  evidence?: string[];
}

export interface ResolveDisputeRequest {
  escrowId: string;
  decision: 'release_to_freelancer' | 'refund_to_client' | 'split';
  splitPercentage?: number; // If split, percentage to freelancer (0-100)
  adminNotes: string;
}

class CoinEscrowService {
  /**
   * Create escrow and lock coins from client
   * Called when a job offer is accepted
   */
  static async createEscrow(request: EscrowRequest): Promise<EscrowResponse> {
    try {
      const response = await BackendAPI.post('/coins/escrow/create', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create escrow'
      };
    }
  }

  /**
   * Release escrow to freelancer (90%) and platform (10%)
   * Called when job is completed and approved
   */
  static async releaseEscrow(request: ReleaseEscrowRequest): Promise<EscrowResponse> {
    try {
      const response = await BackendAPI.post(`/coins/escrow/${request.escrowId}/release`, {
        completionNotes: request.completionNotes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error releasing escrow:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to release escrow'
      };
    }
  }

  /**
   * Refund escrow to client
   * Called when job is cancelled before completion
   */
  static async refundEscrow(request: RefundEscrowRequest): Promise<EscrowResponse> {
    try {
      const response = await BackendAPI.post(`/coins/escrow/${request.escrowId}/refund`, {
        reason: request.reason,
        cancelledBy: request.cancelledBy
      });
      return response.data;
    } catch (error: any) {
      console.error('Error refunding escrow:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to refund escrow'
      };
    }
  }

  /**
   * Raise a dispute on an escrow
   * Can be raised by client or freelancer
   */
  static async raiseDispute(request: DisputeRequest): Promise<EscrowResponse> {
    try {
      const response = await BackendAPI.post(`/coins/escrow/${request.escrowId}/dispute`, {
        raisedBy: request.raisedBy,
        reason: request.reason,
        evidence: request.evidence
      });
      return response.data;
    } catch (error: any) {
      console.error('Error raising dispute:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to raise dispute'
      };
    }
  }

  /**
   * Resolve a dispute (admin only)
   * Admin decides where the coins go
   */
  static async resolveDispute(request: ResolveDisputeRequest): Promise<EscrowResponse> {
    try {
      const response = await BackendAPI.post(`/coins/escrow/${request.escrowId}/resolve`, {
        decision: request.decision,
        splitPercentage: request.splitPercentage,
        adminNotes: request.adminNotes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to resolve dispute'
      };
    }
  }

  /**
   * Get escrow details
   */
  static async getEscrow(escrowId: string): Promise<any> {
    try {
      const response = await BackendAPI.get(`/coins/escrow/${escrowId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting escrow:', error);
      throw error;
    }
  }

  /**
   * Get all escrows for a user (client or freelancer)
   */
  static async getUserEscrows(userId: string): Promise<any> {
    try {
      const response = await BackendAPI.get(`/coins/escrow/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting user escrows:', error);
      throw error;
    }
  }
}

export default CoinEscrowService;
