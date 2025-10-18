/**
 * Security Monitoring & Incident Response System
 * Enterprise-grade security monitoring with real-time threat detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { auth, db } from '../config/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Security event types
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGIN_BRUTE_FORCE = 'login_brute_force',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKOUT = 'account_lockout',
  
  // Authorization events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  PERMISSION_DENIED = 'permission_denied',
  
  // Data access events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXPORT_REQUEST = 'data_export_request',
  DATA_DELETION_REQUEST = 'data_deletion_request',
  BULK_DATA_ACCESS = 'bulk_data_access',
  
  // Input validation events
  MALICIOUS_INPUT = 'malicious_input',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  
  // API security events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  API_ABUSE = 'api_abuse',
  INVALID_TOKEN = 'invalid_token',
  TOKEN_MANIPULATION = 'token_manipulation',
  
  // System events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  SECURITY_POLICY_VIOLATION = 'security_policy_violation',
  
  // Admin events
  ADMIN_LOGIN = 'admin_login',
  ADMIN_ACTION = 'admin_action',
  CONFIG_CHANGE = 'config_change',
  USER_ROLE_CHANGE = 'user_role_change'
}

// Security event severity levels
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  details: Record<string, any>;
  riskScore: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

// Security metrics interface
export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highRiskEvents: number;
  averageRiskScore: number;
  topEventTypes: Array<{ type: SecurityEventType; count: number }>;
  topRiskUsers: Array<{ userId: string; riskScore: number }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Threat detection rules
interface ThreatRule {
  name: string;
  eventType: SecurityEventType;
  conditions: (event: SecurityEvent, history: SecurityEvent[]) => boolean;
  severity: SecuritySeverity;
  action: 'log' | 'alert' | 'block' | 'escalate';
  description: string;
}

class SecurityMonitoringService {
  private eventBuffer: SecurityEvent[] = [];
  private riskScores = new Map<string, number>();
  private threatRules: ThreatRule[] = [];
  private alertCallbacks: Array<(event: SecurityEvent) => void> = [];

  constructor() {
    this.initializeThreatRules();
    this.startPeriodicTasks();
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    type: SecurityEventType,
    details: Record<string, any>,
    userId?: string,
    severity?: SecuritySeverity
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        type,
        severity: severity || this.calculateSeverity(type, details),
        timestamp: new Date(),
        userId,
        sessionId: await this.getSessionId(),
        ipAddress: await this.getClientIP(),
        userAgent: await this.getUserAgent(),
        location: await this.getLocation(),
        details,
        riskScore: this.calculateRiskScore(type, details, userId),
        resolved: false
      };

      // Add to buffer
      this.eventBuffer.push(event);

      // Store in Firestore
      await addDoc(collection(db, 'security_events'), {
        ...event,
        timestamp: serverTimestamp()
      });

      // Update user risk score
      if (userId) {
        this.updateUserRiskScore(userId, event.riskScore);
      }

      // Check threat detection rules
      await this.checkThreatRules(event);

      // Log to system logger
      logger.warn('Security event logged', {
        type,
        severity: event.severity,
        userId,
        riskScore: event.riskScore,
        details
      });

    } catch (error: any) {
      logger.error('Failed to log security event', {
        type,
        userId,
        error: error.message
      });
    }
  }

  /**
   * Check threat detection rules
   */
  private async checkThreatRules(event: SecurityEvent): Promise<void> {
    try {
      // Get recent events for context
      const recentEvents = await this.getRecentEvents(event.userId, 24); // Last 24 hours

      for (const rule of this.threatRules) {
        if (rule.eventType === event.type && rule.conditions(event, recentEvents)) {
          await this.handleThreatDetection(event, rule);
        }
      }
    } catch (error: any) {
      logger.error('Failed to check threat rules', { error: error.message });
    }
  }

  /**
   * Handle threat detection
   */
  private async handleThreatDetection(event: SecurityEvent, rule: ThreatRule): Promise<void> {
    try {
      const threatEvent: SecurityEvent = {
        ...event,
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: rule.severity,
        details: {
          ...event.details,
          threatRule: rule.name,
          originalEvent: event.type,
          description: rule.description
        },
        riskScore: event.riskScore * 2 // Double risk score for detected threats
      };

      // Log threat detection
      await this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        threatEvent.details,
        event.userId,
        rule.severity
      );

      // Execute rule action
      switch (rule.action) {
        case 'alert':
          await this.sendSecurityAlert(threatEvent);
          break;
        case 'block':
          await this.blockUser(event.userId!, rule.name);
          break;
        case 'escalate':
          await this.escalateToAdmin(threatEvent);
          break;
      }

      logger.warn('Threat detected', {
        rule: rule.name,
        userId: event.userId,
        severity: rule.severity,
        action: rule.action
      });

    } catch (error: any) {
      logger.error('Failed to handle threat detection', { error: error.message });
    }
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // Store alert
      await addDoc(collection(db, 'security_alerts'), {
        eventId: event.id,
        type: event.type,
        severity: event.severity,
        userId: event.userId,
        timestamp: serverTimestamp(),
        details: event.details,
        status: 'active'
      });

      // Notify alert callbacks
      this.alertCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          logger.error('Alert callback failed', { error });
        }
      });

    } catch (error: any) {
      logger.error('Failed to send security alert', { error: error.message });
    }
  }

  /**
   * Block user temporarily
   */
  private async blockUser(userId: string, reason: string): Promise<void> {
    try {
      const blockDuration = 24 * 60 * 60 * 1000; // 24 hours
      const unblockAt = new Date(Date.now() + blockDuration);

      await setDoc(doc(db, 'user_blocks', userId), {
        userId,
        reason,
        blockedAt: serverTimestamp(),
        unblockAt: serverTimestamp(),
        active: true
      });

      logger.warn('User blocked due to security threat', { userId, reason });

    } catch (error: any) {
      logger.error('Failed to block user', { userId, error: error.message });
    }
  }

  /**
   * Escalate to admin
   */
  private async escalateToAdmin(event: SecurityEvent): Promise<void> {
    try {
      await addDoc(collection(db, 'admin_escalations'), {
        eventId: event.id,
        type: event.type,
        severity: event.severity,
        userId: event.userId,
        timestamp: serverTimestamp(),
        details: event.details,
        status: 'pending',
        priority: event.severity === SecuritySeverity.CRITICAL ? 'urgent' : 'high'
      });

      logger.warn('Security event escalated to admin', {
        userId: event.userId,
        type: event.type,
        severity: event.severity
      });

    } catch (error: any) {
      logger.error('Failed to escalate to admin', { error: error.message });
    }
  }

  /**
   * Get recent security events
   */
  private async getRecentEvents(userId?: string, hours: number = 24): Promise<SecurityEvent[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      let eventQuery = query(
        collection(db, 'security_events'),
        where('timestamp', '>=', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      if (userId) {
        eventQuery = query(
          collection(db, 'security_events'),
          where('userId', '==', userId),
          where('timestamp', '>=', cutoffTime),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(eventQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as SecurityEvent[];

    } catch (error: any) {
      logger.error('Failed to get recent events', { error: error.message });
      return [];
    }
  }

  /**
   * Calculate event severity
   */
  private calculateSeverity(type: SecurityEventType, details: Record<string, any>): SecuritySeverity {
    const criticalEvents = [
      SecurityEventType.LOGIN_BRUTE_FORCE,
      SecurityEventType.PRIVILEGE_ESCALATION,
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.TOKEN_MANIPULATION
    ];

    const highEvents = [
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventType.MALICIOUS_INPUT,
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.API_ABUSE
    ];

    const mediumEvents = [
      SecurityEventType.LOGIN_FAILURE,
      SecurityEventType.PERMISSION_DENIED,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.INVALID_TOKEN
    ];

    if (criticalEvents.includes(type)) return SecuritySeverity.CRITICAL;
    if (highEvents.includes(type)) return SecuritySeverity.HIGH;
    if (mediumEvents.includes(type)) return SecuritySeverity.MEDIUM;
    
    return SecuritySeverity.LOW;
  }

  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore(
    type: SecurityEventType,
    details: Record<string, any>,
    userId?: string
  ): number {
    let baseScore = 0;

    // Base scores by event type
    const eventScores = {
      [SecurityEventType.LOGIN_BRUTE_FORCE]: 90,
      [SecurityEventType.PRIVILEGE_ESCALATION]: 95,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 85,
      [SecurityEventType.XSS_ATTEMPT]: 80,
      [SecurityEventType.TOKEN_MANIPULATION]: 85,
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 70,
      [SecurityEventType.MALICIOUS_INPUT]: 60,
      [SecurityEventType.API_ABUSE]: 65,
      [SecurityEventType.LOGIN_FAILURE]: 20,
      [SecurityEventType.PERMISSION_DENIED]: 30,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 40
    };

    baseScore = eventScores[type] || 10;

    // Adjust based on user history
    if (userId) {
      const userRisk = this.riskScores.get(userId) || 0;
      baseScore += userRisk * 0.2; // Add 20% of user's accumulated risk
    }

    // Adjust based on details
    if (details.repeated) baseScore += 20;
    if (details.fromTor) baseScore += 30;
    if (details.suspiciousLocation) baseScore += 15;

    return Math.min(Math.max(baseScore, 0), 100);
  }

  /**
   * Update user risk score
   */
  private updateUserRiskScore(userId: string, eventRisk: number): void {
    const currentRisk = this.riskScores.get(userId) || 0;
    const newRisk = Math.min(currentRisk + eventRisk * 0.1, 100);
    this.riskScores.set(userId, newRisk);

    // Decay risk score over time
    setTimeout(() => {
      const decayedRisk = Math.max(newRisk * 0.95, 0);
      this.riskScores.set(userId, decayedRisk);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Initialize threat detection rules
   */
  private initializeThreatRules(): void {
    this.threatRules = [
      {
        name: 'Brute Force Detection',
        eventType: SecurityEventType.LOGIN_FAILURE,
        conditions: (event, history) => {
          const recentFailures = history.filter(e => 
            e.type === SecurityEventType.LOGIN_FAILURE &&
            e.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          );
          return recentFailures.length >= 5;
        },
        severity: SecuritySeverity.CRITICAL,
        action: 'block',
        description: 'Multiple failed login attempts detected'
      },
      {
        name: 'Rapid API Calls',
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        conditions: (event, history) => {
          const recentRateLimits = history.filter(e => 
            e.type === SecurityEventType.RATE_LIMIT_EXCEEDED &&
            e.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          );
          return recentRateLimits.length >= 3;
        },
        severity: SecuritySeverity.HIGH,
        action: 'alert',
        description: 'Suspicious API usage pattern detected'
      },
      {
        name: 'Privilege Escalation Attempt',
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        conditions: (event, history) => {
          return event.details.attemptedRole && 
                 event.details.attemptedRole !== event.details.currentRole;
        },
        severity: SecuritySeverity.CRITICAL,
        action: 'escalate',
        description: 'Unauthorized privilege escalation attempt'
      }
    ];
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(timeRange: { start: Date; end: Date }): Promise<SecurityMetrics> {
    try {
      const eventsQuery = query(
        collection(db, 'security_events'),
        where('timestamp', '>=', timeRange.start),
        where('timestamp', '<=', timeRange.end),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as SecurityEvent[];

      // Calculate metrics
      const totalEvents = events.length;
      const criticalEvents = events.filter(e => e.severity === SecuritySeverity.CRITICAL).length;
      const highRiskEvents = events.filter(e => e.riskScore >= 70).length;
      const averageRiskScore = events.reduce((sum, e) => sum + e.riskScore, 0) / totalEvents || 0;

      // Top event types
      const eventTypeCounts = new Map<SecurityEventType, number>();
      events.forEach(e => {
        eventTypeCounts.set(e.type, (eventTypeCounts.get(e.type) || 0) + 1);
      });
      
      const topEventTypes = Array.from(eventTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top risk users
      const userRiskScores = new Map<string, number>();
      events.forEach(e => {
        if (e.userId) {
          userRiskScores.set(e.userId, (userRiskScores.get(e.userId) || 0) + e.riskScore);
        }
      });
      
      const topRiskUsers = Array.from(userRiskScores.entries())
        .map(([userId, riskScore]) => ({ userId, riskScore }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      return {
        totalEvents,
        criticalEvents,
        highRiskEvents,
        averageRiskScore,
        topEventTypes,
        topRiskUsers,
        timeRange
      };

    } catch (error: any) {
      logger.error('Failed to get security metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Subscribe to security alerts
   */
  onSecurityAlert(callback: (event: SecurityEvent) => void): () => void {
    this.alertCallbacks.push(callback);
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get helper methods
   */
  private async getSessionId(): Promise<string> {
    try {
      let sessionId = await AsyncStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    } catch {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // In a real app, you'd get this from your backend or a service
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getUserAgent(): Promise<string> {
    try {
      // In React Native, you'd use a library to get device info
      return 'React Native App';
    } catch {
      return 'unknown';
    }
  }

  private async getLocation(): Promise<{ country?: string; city?: string } | undefined> {
    try {
      // In a real app, you'd use location services or IP geolocation
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Start periodic maintenance tasks
   */
  private startPeriodicTasks(): void {
    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);

    // Decay user risk scores every 6 hours
    setInterval(() => {
      this.decayRiskScores();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Clean up old events from buffer
   */
  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    this.eventBuffer = this.eventBuffer.filter(event => event.timestamp > cutoff);
  }

  /**
   * Decay user risk scores over time
   */
  private decayRiskScores(): void {
    for (const [userId, score] of this.riskScores.entries()) {
      const decayedScore = Math.max(score * 0.9, 0);
      if (decayedScore < 1) {
        this.riskScores.delete(userId);
      } else {
        this.riskScores.set(userId, decayedScore);
      }
    }
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringService();
export default securityMonitoring;

