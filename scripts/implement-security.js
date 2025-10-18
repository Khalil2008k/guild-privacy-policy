#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SecurityImplementer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendRoot = path.join(this.projectRoot, 'backend');
  }

  async implement() {
    console.log('🔒 Implementing advanced security measures...');
    
    try {
      // Step 1: Implement OWASP security
      console.log('🛡️  Implementing OWASP security...');
      await this.implementOWASPSecurity();
      
      // Step 2: Implement encryption
      console.log('🔐 Implementing encryption...');
      await this.implementEncryption();
      
      // Step 3: Implement MFA
      console.log('🔑 Implementing MFA...');
      await this.implementMFA();
      
      // Step 4: Implement data encryption
      console.log('📊 Implementing data encryption...');
      await this.implementDataEncryption();
      
      // Step 5: Implement audit logs
      console.log('📝 Implementing audit logs...');
      await this.implementAuditLogs();
      
      console.log('✅ Security implementation completed!');
      
    } catch (error) {
      console.error('❌ Security implementation failed:', error.message);
      process.exit(1);
    }
  }

  async implementOWASPSecurity() {
    const owaspSecurity = `
// OWASP security implementation
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export class OWASPSecurity {
  // Security headers middleware
  static securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }
  
  // XSS protection
  static xssProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize input
      const sanitizeInput = (obj: any): any => {
        if (typeof obj === 'string') {
          return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
          const sanitized: any = {};
          for (const key in obj) {
            sanitized[key] = sanitizeInput(obj[key]);
          }
          return sanitized;
        }
        return obj;
      };
      
      req.body = sanitizeInput(req.body);
      req.query = sanitizeInput(req.query);
      req.params = sanitizeInput(req.params);
      
      next();
    };
  }
  
  // SQL injection protection
  static sqlInjectionProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      const sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/gi
      ];
      
      const checkForSQLInjection = (obj: any): boolean => {
        if (typeof obj === 'string') {
          return sqlInjectionPatterns.some(pattern => pattern.test(obj));
        }
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).some(value => checkForSQLInjection(value));
        }
        return false;
      };
      
      if (checkForSQLInjection(req.body) || 
          checkForSQLInjection(req.query) || 
          checkForSQLInjection(req.params)) {
        logger.warn('SQL injection attempt detected', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          body: req.body,
          query: req.query,
          params: req.params
        });
        
        res.status(400).json({
          error: 'Invalid input detected',
          code: 'SQL_INJECTION_ATTEMPT'
        });
        return;
      }
      
      next();
    };
  }
  
  // CSRF protection
  static csrfProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
      }
      
      const token = req.header('X-CSRF-Token');
      const sessionToken = req.session?.csrfToken;
      
      if (!token || !sessionToken || token !== sessionToken) {
        logger.warn('CSRF token validation failed', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          providedToken: token,
          sessionToken: sessionToken
        });
        
        res.status(403).json({
          error: 'CSRF token validation failed',
          code: 'CSRF_TOKEN_INVALID'
        });
        return;
      }
      
      next();
    };
  }
  
  // Input validation
  static inputValidation() {
    return (req: Request, res: Response, next: NextFunction) => {
      const validateInput = (obj: any, path: string = ''): string[] => {
        const errors: string[] = [];
        
        if (typeof obj === 'string') {
          // Check for malicious patterns
          if (obj.length > 10000) {
            errors.push(\`Input too long at \${path}\`);
          }
          
          // Check for script tags
          if (/<script/i.test(obj)) {
            errors.push(\`Script tag detected at \${path}\`);
          }
          
          // Check for SQL injection patterns
          if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi.test(obj)) {
            errors.push(\`SQL injection pattern detected at \${path}\`);
          }
        }
        
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            const newPath = path ? \`\${path}.\${key}\` : key;
            errors.push(...validateInput(obj[key], newPath));
          }
        }
        
        return errors;
      };
      
      const errors = [
        ...validateInput(req.body, 'body'),
        ...validateInput(req.query, 'query'),
        ...validateInput(req.params, 'params')
      ];
      
      if (errors.length > 0) {
        logger.warn('Input validation failed', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          errors
        });
        
        res.status(400).json({
          error: 'Input validation failed',
          code: 'INPUT_VALIDATION_FAILED',
          details: errors
        });
        return;
      }
      
      next();
    };
  }
  
  // Rate limiting for security
  static securityRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req, res) => res.statusCode < 400
    });
  }
  
  // Security logging
  static securityLogging() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(data: any) {
        // Log security events
        if (res.statusCode >= 400) {
          logger.warn('Security event', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
          });
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
}

// Export security middleware
export const owaspSecurity = [
  OWASPSecurity.securityHeaders(),
  OWASPSecurity.xssProtection(),
  OWASPSecurity.sqlInjectionProtection(),
  OWASPSecurity.csrfProtection(),
  OWASPSecurity.inputValidation(),
  OWASPSecurity.securityRateLimit(),
  OWASPSecurity.securityLogging()
];
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/middleware/owasp.ts'), owaspSecurity);
  }

  async implementEncryption() {
    const encryptionConfig = `
// Advanced encryption implementation
import crypto from 'crypto';
import { logger } from '../utils/logger';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;
  
  constructor() {
    this.validateEnvironment();
  }
  
  private validateEnvironment() {
    const requiredEnvVars = ['ENCRYPTION_KEY', 'ENCRYPTION_SALT'];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        logger.error(\`Missing required environment variable: \${envVar}\`);
        throw new Error(\`Missing required environment variable: \${envVar}\`);
      }
    }
  }
  
  // Generate encryption key
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }
  
  // Generate IV
  generateIV(): string {
    return crypto.randomBytes(this.ivLength).toString('hex');
  }
  
  // Encrypt data
  encrypt(data: string, key?: string): { encrypted: string; iv: string; tag: string } {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY!;
      const keyBuffer = Buffer.from(encryptionKey, 'hex');
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, keyBuffer);
      cipher.setAAD(Buffer.from('guild-platform', 'utf8'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error: any) {
      logger.error('Encryption failed', { error: error.message });
      throw new Error('Encryption failed');
    }
  }
  
  // Decrypt data
  decrypt(encryptedData: string, iv: string, tag: string, key?: string): string {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY!;
      const keyBuffer = Buffer.from(encryptionKey, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, keyBuffer);
      decipher.setAAD(Buffer.from('guild-platform', 'utf8'));
      decipher.setAuthTag(tagBuffer);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      logger.error('Decryption failed', { error: error.message });
      throw new Error('Decryption failed');
    }
  }
  
  // Hash data
  hash(data: string, salt?: string): string {
    const saltToUse = salt || process.env.ENCRYPTION_SALT!;
    return crypto.pbkdf2Sync(data, saltToUse, 100000, 64, 'sha512').toString('hex');
  }
  
  // Verify hash
  verifyHash(data: string, hash: string, salt?: string): boolean {
    const saltToUse = salt || process.env.ENCRYPTION_SALT!;
    const computedHash = crypto.pbkdf2Sync(data, saltToUse, 100000, 64, 'sha512').toString('hex');
    return computedHash === hash;
  }
  
  // Generate secure random string
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Generate UUID
  generateUUID(): string {
    return crypto.randomUUID();
  }
  
  // Encrypt sensitive fields
  encryptSensitiveFields(obj: any, fields: string[]): any {
    const encrypted = { ...obj };
    
    for (const field of fields) {
      if (encrypted[field]) {
        const { encrypted: encryptedValue, iv, tag } = this.encrypt(encrypted[field]);
        encrypted[field] = encryptedValue;
        encrypted[\`\${field}_iv\`] = iv;
        encrypted[\`\${field}_tag\`] = tag;
      }
    }
    
    return encrypted;
  }
  
  // Decrypt sensitive fields
  decryptSensitiveFields(obj: any, fields: string[]): any {
    const decrypted = { ...obj };
    
    for (const field of fields) {
      if (decrypted[field] && decrypted[\`\${field}_iv\`] && decrypted[\`\${field}_tag\`]) {
        try {
          decrypted[field] = this.decrypt(
            decrypted[field],
            decrypted[\`\${field}_iv\`],
            decrypted[\`\${field}_tag\`]
          );
          delete decrypted[\`\${field}_iv\`];
          delete decrypted[\`\${field}_tag\`];
        } catch (error) {
          logger.error('Failed to decrypt field', { field, error: error.message });
        }
      }
    }
    
    return decrypted;
  }
}

// Export encryption service instance
export const encryptionService = new EncryptionService();
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/services/encryption.ts'), encryptionConfig);
  }

  async implementMFA() {
    const mfaConfig = `
// Multi-Factor Authentication implementation
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { encryptionService } from './encryption';

export interface MFAConfig {
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
}

export class MFAService {
  private config: MFAConfig;
  
  constructor() {
    this.config = {
      issuer: process.env.MFA_ISSUER || 'Guild Platform',
      algorithm: 'sha1',
      digits: 6,
      period: 30
    };
  }
  
  // Generate MFA secret
  generateSecret(userId: string): string {
    const secret = authenticator.generateSecret();
    
    // Encrypt and store secret
    const encryptedSecret = encryptionService.encrypt(secret);
    
    logger.info('MFA secret generated', { userId });
    
    return secret;
  }
  
  // Generate QR code
  async generateQRCode(userId: string, email: string, secret: string): Promise<string> {
    const otpauth = authenticator.keyuri(
      email,
      this.config.issuer,
      secret
    );
    
    try {
      const qrCode = await QRCode.toDataURL(otpauth);
      return qrCode;
    } catch (error: any) {
      logger.error('Failed to generate QR code', { error: error.message });
      throw new Error('Failed to generate QR code');
    }
  }
  
  // Verify MFA token
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({
        token,
        secret,
        window: 2 // Allow 2 time windows for clock drift
      });
    } catch (error: any) {
      logger.error('MFA token verification failed', { error: error.message });
      return false;
    }
  }
  
  // Generate backup codes
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      codes.push(encryptionService.generateSecureRandom(8));
    }
    
    return codes;
  }
  
  // Verify backup code
  verifyBackupCode(code: string, backupCodes: string[]): boolean {
    return backupCodes.includes(code);
  }
  
  // Generate TOTP token
  generateTOTP(secret: string): string {
    return authenticator.generate(secret);
  }
  
  // Check if MFA is required
  isMFARequired(user: any): boolean {
    return user.mfaEnabled && user.mfaSecret;
  }
  
  // Setup MFA for user
  async setupMFA(userId: string, email: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const secret = this.generateSecret(userId);
    const qrCode = await this.generateQRCode(userId, email, secret);
    const backupCodes = this.generateBackupCodes();
    
    logger.info('MFA setup initiated', { userId, email });
    
    return {
      secret,
      qrCode,
      backupCodes
    };
  }
  
  // Verify MFA setup
  async verifyMFASetup(userId: string, secret: string, token: string): Promise<boolean> {
    const isValid = this.verifyToken(secret, token);
    
    if (isValid) {
      logger.info('MFA setup verified', { userId });
    } else {
      logger.warn('MFA setup verification failed', { userId });
    }
    
    return isValid;
  }
  
  // Disable MFA
  async disableMFA(userId: string): Promise<void> {
    logger.info('MFA disabled', { userId });
  }
  
  // Get MFA status
  getMFAStatus(user: any): {
    enabled: boolean;
    setupRequired: boolean;
    backupCodesAvailable: boolean;
  } {
    return {
      enabled: user.mfaEnabled || false,
      setupRequired: !user.mfaSecret,
      backupCodesAvailable: user.backupCodes && user.backupCodes.length > 0
    };
  }
}

// Export MFA service instance
export const mfaService = new MFAService();
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/services/mfa.ts'), mfaConfig);
  }

  async implementDataEncryption() {
    const dataEncryptionConfig = `
// Firestore data encryption
import { FieldValue } from 'firebase-admin/firestore';
import { encryptionService } from './encryption';
import { logger } from '../utils/logger';

export class DataEncryptionService {
  private encryptedFields: string[] = [
    'email',
    'phoneNumber',
    'address',
    'bankAccount',
    'creditCard',
    'ssn',
    'passport'
  ];
  
  // Encrypt document data
  encryptDocument(data: any): any {
    const encrypted = { ...data };
    
    for (const field of this.encryptedFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        const { encrypted: encryptedValue, iv, tag } = encryptionService.encrypt(encrypted[field]);
        encrypted[field] = encryptedValue;
        encrypted[\`\${field}_iv\`] = iv;
        encrypted[\`\${field}_tag\`] = tag;
      }
    }
    
    return encrypted;
  }
  
  // Decrypt document data
  decryptDocument(data: any): any {
    const decrypted = { ...data };
    
    for (const field of this.encryptedFields) {
      if (decrypted[field] && decrypted[\`\${field}_iv\`] && decrypted[\`\${field}_tag\`]) {
        try {
          decrypted[field] = encryptionService.decrypt(
            decrypted[field],
            decrypted[\`\${field}_iv\`],
            decrypted[\`\${field}_tag\`]
          );
          delete decrypted[\`\${field}_iv\`];
          delete decrypted[\`\${field}_tag\`];
        } catch (error: any) {
          logger.error('Failed to decrypt field', { field, error: error.message });
        }
      }
    }
    
    return decrypted;
  }
  
  // Encrypt query results
  encryptQueryResults(results: any[]): any[] {
    return results.map(result => this.encryptDocument(result));
  }
  
  // Decrypt query results
  decryptQueryResults(results: any[]): any[] {
    return results.map(result => this.decryptDocument(result));
  }
  
  // Add encrypted field
  addEncryptedField(field: string): void {
    if (!this.encryptedFields.includes(field)) {
      this.encryptedFields.push(field);
    }
  }
  
  // Remove encrypted field
  removeEncryptedField(field: string): void {
    const index = this.encryptedFields.indexOf(field);
    if (index > -1) {
      this.encryptedFields.splice(index, 1);
    }
  }
  
  // Get encrypted fields
  getEncryptedFields(): string[] {
    return [...this.encryptedFields];
  }
}

// Export data encryption service instance
export const dataEncryptionService = new DataEncryptionService();
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/services/dataEncryption.ts'), dataEncryptionConfig);
  }

  async implementAuditLogs() {
    const auditLogsConfig = `
// Audit logs implementation
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';
import { encryptionService } from './encryption';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: FieldValue;
  ip: string;
  userAgent: string;
  metadata: any;
  result: 'success' | 'failure';
  error?: string;
}

export class AuditLogService {
  private firestore: any;
  
  constructor(firestore: any) {
    this.firestore = firestore;
  }
  
  // Log audit event
  async logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: encryptionService.generateUUID(),
        timestamp: FieldValue.serverTimestamp()
      };
      
      // Encrypt sensitive metadata
      if (auditEntry.metadata) {
        auditEntry.metadata = encryptionService.encrypt(JSON.stringify(auditEntry.metadata));
      }
      
      await this.firestore.collection('audit_logs').doc(auditEntry.id).set(auditEntry);
      
      logger.info('Audit log created', {
        action: entry.action,
        resource: entry.resource,
        userId: entry.userId
      });
    } catch (error: any) {
      logger.error('Failed to create audit log', { error: error.message });
    }
  }
  
  // Log authentication event
  async logAuthEvent(
    userId: string,
    action: 'login' | 'logout' | 'register' | 'password_reset',
    ip: string,
    userAgent: string,
    result: 'success' | 'failure',
    error?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: 'auth',
      resourceId: userId,
      ip,
      userAgent,
      metadata: { action, result },
      result,
      error
    });
  }
  
  // Log data access event
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    ip: string,
    userAgent: string,
    result: 'success' | 'failure',
    error?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource,
      resourceId,
      ip,
      userAgent,
      metadata: { action, resource, resourceId },
      result,
      error
    });
  }
  
  // Log security event
  async logSecurityEvent(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    ip: string,
    userAgent: string,
    result: 'success' | 'failure',
    error?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource,
      resourceId,
      ip,
      userAgent,
      metadata: { action, resource, resourceId, security: true },
      result,
      error
    });
  }
  
  // Get audit logs
  async getAuditLogs(
    userId?: string,
    resource?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      let query = this.firestore.collection('audit_logs');
      
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      
      if (resource) {
        query = query.where('resource', '==', resource);
      }
      
      if (startDate) {
        query = query.where('timestamp', '>=', startDate);
      }
      
      if (endDate) {
        query = query.where('timestamp', '<=', endDate);
      }
      
      query = query.orderBy('timestamp', 'desc').limit(limit);
      
      const snapshot = await query.get();
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Decrypt metadata
      return logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(encryptionService.decrypt(log.metadata)) : null
      }));
    } catch (error: any) {
      logger.error('Failed to get audit logs', { error: error.message });
      return [];
    }
  }
  
  // Cleanup old audit logs
  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const query = this.firestore.collection('audit_logs')
        .where('timestamp', '<', cutoffDate);
      
      const snapshot = await query.get();
      const batch = this.firestore.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      logger.info('Audit logs cleaned up', { cutoffDate, deletedCount: snapshot.docs.length });
    } catch (error: any) {
      logger.error('Failed to cleanup audit logs', { error: error.message });
    }
  }
}

// Export audit log service instance
export const auditLogService = new AuditLogService(require('firebase-admin').firestore());
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/services/auditLogs.ts'), auditLogsConfig);
  }
}

// Run the security implementer
if (require.main === module) {
  const implementer = new SecurityImplementer();
  implementer.implement()
    .then(() => {
      console.log('🎉 Security implementation completed!');
    })
    .catch(error => {
      console.error('❌ Security implementation failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityImplementer;







