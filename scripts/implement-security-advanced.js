#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAdvancedImplementer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendRoot = path.join(this.projectRoot, 'backend');
    this.srcRoot = path.join(this.backendRoot, 'src');
  }

  async implement() {
    console.log('🔒 Implementing advanced security features with STRICT rules...');

    try {
      // Step 1: Implement OWASP security with comprehensive headers
      console.log('🛡️  Implementing OWASP security compliance...');
      await this.implementOWASPSecurity();

      // Step 2: Advanced encryption service
      console.log('🔐 Implementing advanced encryption service...');
      await this.implementEncryptionService();

      // Step 3: Multi-factor authentication
      console.log('🔑 Implementing MFA with TOTP...');
      await this.implementMFA();

      // Step 4: Field-level data encryption
      console.log('🔒 Implementing field-level data encryption...');
      await this.implementFieldEncryption();

      // Step 5: Advanced audit logging
      console.log('📋 Implementing advanced audit logging...');
      await this.implementAuditLogging();

      console.log('✅ Advanced security implementation completed!');

    } catch (error) {
      console.error('❌ Advanced security implementation failed:', error.message);
      process.exit(1);
    }
  }

  async implementOWASPSecurity() {
    // OWASP security middleware implementation
    const owaspSecurityConfig = `
// OWASP Security Compliance Implementation
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/advancedLogger';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean | object;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean | object;
  dnsPrefetchControl?: boolean | object;
  expectCt?: boolean | object;
  frameguard?: boolean | object;
  hidePoweredBy?: boolean | object;
  hsts?: boolean | object;
  ieNoOpen?: boolean;
  noSniff?: boolean;
  originAgentCluster?: boolean | string;
  permittedCrossDomainPolicies?: boolean | object;
  referrerPolicy?: boolean | object;
  xssFilter?: boolean;
}

export class OWASPSecurityService {
  private config: SecurityHeadersConfig;

  constructor(config: SecurityHeadersConfig = {}) {
    this.config = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.guild.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "same-origin" },
      dnsPrefetchControl: { allow: false },
      expectCt: {
        maxAge: 86400,
        enforce: true,
      },
      frameguard: { action: "deny" },
      hidePoweredBy: { setTo: "PHP 7.4.0" }, // Hide actual tech stack
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
      ...config,
    };
  }

  // Main security middleware
  getSecurityMiddleware() {
    return helmet(this.config);
  }

  // Custom security middleware for additional protections
  customSecurityMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');

      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Prevent referrer leakage
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Content Security Policy (additional layer)
      res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://api.guild.com; " +
        "frame-src 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
      );

      // Feature Policy (Permissions Policy)
      res.setHeader('Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      );

      // Remove server information
      res.removeHeader('X-Powered-By');

      // Validate request size
      const contentLength = parseInt(req.get('Content-Length') || '0');
      if (contentLength > 10 * 1024 * 1024) { // 10MB limit
        logger.warn('Request size exceeded limit', {
          ip: req.ip,
          contentLength,
          path: req.path
        });

        return res.status(413).json({
          error: 'Payload Too Large',
          message: 'Request size exceeds maximum allowed limit'
        });
      }

      // Rate limiting check (basic)
      const userRequests = req.get('X-RateLimit-Remaining');
      if (userRequests && parseInt(userRequests) <= 0) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded'
        });
      }

      next();
    };
  }

  // Input validation middleware
  inputValidationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Validate request body size
      if (req.body && typeof req.body === 'object') {
        const bodySize = JSON.stringify(req.body).length;
        if (bodySize > 1024 * 1024) { // 1MB limit
          return res.status(413).json({
            error: 'Request Entity Too Large',
            message: 'Request body exceeds maximum allowed size'
          });
        }
      }

      // Sanitize common attack vectors
      this.sanitizeInput(req);

      next();
    };
  }

  private sanitizeInput(req: Request) {
    const sanitizeString = (str: string): string => {
      return str
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    };

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key]);
        }
      });
    }

    // Sanitize body parameters
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key]);
        }
      });
    }
  }

  // SQL injection prevention middleware
  sqlInjectionPreventionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const suspiciousPatterns = [
        /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
        /(--|#|\/\*|\*\/)/g,
        /(\bor\b\s+\d+\s*=\s*\d+)/gi,
        /(\band\b\s+\d+\s*=\s*\d+)/gi,
        /('|(\\')|(;))/g,
      ];

      const checkValue = (value: any): boolean => {
        if (typeof value === 'string') {
          return suspiciousPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(checkValue);
        }
        return false;
      };

      // Check query parameters
      if (req.query && Object.values(req.query).some(checkValue)) {
        logger.warn('Potential SQL injection attempt detected', {
          ip: req.ip,
          path: req.path,
          query: req.query
        });

        return res.status(400).json({
          error: 'Bad Request',
          message: 'Suspicious input detected'
        });
      }

      // Check body parameters
      if (req.body && checkValue(req.body)) {
        logger.warn('Potential SQL injection attempt detected', {
          ip: req.ip,
          path: req.path,
          body: req.body
        });

        return res.status(400).json({
          error: 'Bad Request',
          message: 'Suspicious input detected'
        });
      }

      next();
    };
  }

  // CSRF protection middleware
  csrfProtectionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Check for CSRF token
      const csrfToken = req.get('X-CSRF-Token') || req.body?._csrf;

      if (!csrfToken) {
        logger.warn('Missing CSRF token', {
          ip: req.ip,
          method: req.method,
          path: req.path
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'CSRF token required'
        });
      }

      // Validate CSRF token (implement proper validation)
      if (csrfToken.length < 32) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid CSRF token'
        });
      }

      next();
    };
  }

  // Security monitoring middleware
  securityMonitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const originalEnd = res.end;

      // Track security metrics
      res.end = function(chunk?: any, encoding?: any, cb?: any) {
        const duration = Date.now() - startTime;

        // Log suspicious activities
        if (res.statusCode >= 400) {
          logger.warn('Security event detected', {
            ip: req.ip,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer')
          });
        }

        return originalEnd.call(this, chunk, encoding, cb);
      };

      next();
    };
  }
}

// Input sanitization utilities
export class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/[<>"'&]/g, (match) => {
        const entityMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entityMap[match] || match;
      })
      .trim();
  }

  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : '';
  }

  static sanitizePhone(phone: string): string {
    const sanitized = this.sanitizeString(phone);
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(sanitized) ? sanitized : '';
  }

  static sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url);
    try {
      const urlObj = new URL(sanitized);
      return ['http:', 'https:'].includes(urlObj.protocol) ? sanitized : '';
    } catch {
      return '';
    }
  }
}

export const owaspSecurity = new OWASPSecurityService();
`;

    fs.writeFileSync(path.join(this.srcRoot, 'middleware', 'owaspSecurity.ts'), owaspSecurityConfig);

    // Install helmet for security headers
    try {
      execSync('npm install helmet@^7.1.0 --save --silent', {
        cwd: this.backendRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Helmet installation warning:', error.message);
    }
  }

  async implementEncryptionService() {
    // Advanced encryption service
    const encryptionConfig = `
// Advanced Encryption Service with AES-256-GCM and PBKDF2
import * as crypto from 'crypto';
import { logger } from '../utils/advancedLogger';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
  iterations: number;
}

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
  algorithm: string;
}

export class AdvancedEncryptionService {
  private config: EncryptionConfig;
  private masterKey: Buffer;

  constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32, // 256 bits
      ivLength: 16,  // 128 bits
      tagLength: 16, // 128 bits
      saltLength: 32,
      iterations: 100000,
    };

    this.masterKey = this.deriveMasterKey();
  }

  private deriveMasterKey(): Buffer {
    const envKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!envKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }

    // Use PBKDF2 to derive a key from the master key
    return crypto.pbkdf2Sync(
      envKey,
      crypto.randomBytes(this.config.saltLength),
      this.config.iterations,
      this.config.keyLength,
      'sha256'
    );
  }

  // Encrypt data using AES-256-GCM
  encrypt(data: string): string {
    try {
      const iv = crypto.randomBytes(this.config.ivLength);
      const salt = crypto.randomBytes(this.config.saltLength);

      // Derive encryption key from master key and salt
      const key = crypto.pbkdf2Sync(
        this.masterKey,
        salt,
        this.config.iterations,
        this.config.keyLength,
        'sha256'
      );

      const cipher = crypto.createCipherGCM(this.config.algorithm, key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      const result: EncryptionResult = {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.config.algorithm,
      };

      logger.debug('Data encrypted successfully', {
        dataLength: data.length,
        encryptedLength: encrypted.length
      });

      return Buffer.from(JSON.stringify(result)).toString('base64');

    } catch (error: any) {
      logger.error('Encryption failed', { error: error.message });
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data using AES-256-GCM
  decrypt(encryptedData: string): string {
    try {
      const decoded = JSON.parse(Buffer.from(encryptedData, 'base64').toString());

      const {
        encrypted,
        iv: ivHex,
        tag: tagHex,
        salt: saltHex,
        algorithm
      } = decoded;

      if (algorithm !== this.config.algorithm) {
        throw new Error('Unsupported encryption algorithm');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const salt = Buffer.from(saltHex, 'hex');

      // Derive decryption key
      const key = crypto.pbkdf2Sync(
        this.masterKey,
        salt,
        this.config.iterations,
        this.config.keyLength,
        'sha256'
      );

      const decipher = crypto.createDecipherGCM(this.config.algorithm, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.debug('Data decrypted successfully', {
        encryptedLength: encrypted.length,
        decryptedLength: decrypted.length
      });

      return decrypted;

    } catch (error: any) {
      logger.error('Decryption failed', { error: error.message });
      throw new Error('Failed to decrypt data');
    }
  }

  // Generate secure random bytes
  generateRandomBytes(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash data using SHA-256
  hash(data: string, salt?: string): string {
    const actualSalt = salt || this.generateRandomBytes(this.config.saltLength);
    const hash = crypto.createHash('sha256');
    hash.update(data + actualSalt);
    return hash.digest('hex') + ':' + actualSalt;
  }

  // Verify hash
  verifyHash(data: string, hashedData: string): boolean {
    const [hash, salt] = hashedData.split(':');
    const newHash = this.hash(data, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(newHash.split(':')[0], 'hex')
    );
  }

  // Generate cryptographically secure token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  // Encrypt sensitive data for storage
  encryptSensitiveData(data: Record<string, any>): Record<string, string> {
    const encrypted: Record<string, string> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' && this.isSensitiveField(key)) {
        encrypted[key] = this.encrypt(value);
      } else {
        encrypted[key] = value;
      }
    });

    return encrypted;
  }

  // Decrypt sensitive data
  decryptSensitiveData(data: Record<string, any>): Record<string, any> {
    const decrypted: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' && this.isSensitiveField(key)) {
        try {
          decrypted[key] = this.decrypt(value);
        } catch (error) {
          logger.warn('Failed to decrypt field', { field: key, error: error.message });
          decrypted[key] = '[ENCRYPTED]'; // Placeholder for corrupted data
        }
      } else {
        decrypted[key] = value;
      }
    });

    return decrypted;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'ssn',
      'socialSecurityNumber',
      'creditCard',
      'bankAccount',
      'secret',
      'token',
      'apiKey',
      'privateKey',
      'email',
      'phone',
      'address'
    ];

    return sensitiveFields.some(field =>
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  // Key derivation for different purposes
  deriveKey(purpose: string, context?: string): Buffer {
    const input = purpose + (context || '');
    return crypto.pbkdf2Sync(
      this.masterKey,
      Buffer.from(input),
      this.config.iterations,
      this.config.keyLength,
      'sha256'
    );
  }

  // Digital signature
  sign(data: string, privateKey?: string): string {
    const key = privateKey || this.masterKey.toString('hex');
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(key, 'hex');
  }

  // Verify digital signature
  verify(data: string, signature: string, publicKey?: string): boolean {
    try {
      const key = publicKey || this.masterKey.toString('hex');
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      return verify.verify(key, signature, 'hex');
    } catch (error) {
      return false;
    }
  }
}

export const encryptionService = new AdvancedEncryptionService();
`;

    fs.writeFileSync(path.join(this.srcRoot, 'services', 'encryptionService.ts'), encryptionConfig);
  }

  async implementMFA() {
    // Multi-factor authentication implementation
    const mfaConfig = `
// Multi-Factor Authentication with TOTP and Backup Codes
import * as crypto from 'crypto';
import * as qr from 'qrcode';
import { logger } from '../utils/advancedLogger';
import { encryptionService } from './encryptionService';

export interface MFAConfig {
  issuer: string;
  digits: number;
  period: number;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  window: number; // Time window tolerance
}

export interface MFAVerification {
  verified: boolean;
  remainingAttempts: number;
  lockoutUntil?: Date;
  backupCodeUsed?: boolean;
}

export interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

export class MFAService {
  private config: MFAConfig;
  private maxAttempts = 5;
  private lockoutDuration = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.config = {
      issuer: 'Guild Platform',
      digits: 6,
      period: 30, // 30 seconds
      algorithm: 'SHA256',
      window: 1, // 1 time window tolerance
    };
  }

  // Generate MFA secret for user
  async generateMFASecret(userId: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    try {
      // Generate random secret
      const secret = crypto.randomBytes(32).toString('base64');

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(10);

      // Create TOTP URL for QR code
      const otpUrl = this.generateOTPUrl(userId, secret);

      // Generate QR code
      const qrCodeUrl = await qr.toDataURL(otpUrl);

      // Encrypt sensitive data for storage
      const encryptedSecret = encryptionService.encrypt(secret);
      const encryptedBackupCodes = backupCodes.map(code => ({
        code: encryptionService.encrypt(code),
        used: false
      }));

      // Store in database (implement based on your storage)
      await this.storeMFASecret(userId, encryptedSecret, encryptedBackupCodes);

      logger.info('MFA secret generated', { userId });

      return {
        secret,
        qrCodeUrl,
        backupCodes
      };

    } catch (error: any) {
      logger.error('MFA secret generation failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Verify TOTP token
  async verifyTOTP(userId: string, token: string): Promise<MFAVerification> {
    try {
      // Get user's MFA secret
      const mfaData = await this.getMFASecret(userId);
      if (!mfaData || !mfaData.secret) {
        throw new Error('MFA not configured for user');
      }

      // Decrypt secret
      const secret = encryptionService.decrypt(mfaData.secret);

      // Check lockout status
      const lockoutInfo = await this.checkLockoutStatus(userId);
      if (lockoutInfo.lockoutUntil && lockoutInfo.lockoutUntil > new Date()) {
        return {
          verified: false,
          remainingAttempts: 0,
          lockoutUntil: lockoutInfo.lockoutUntil
        };
      }

      // Verify token
      const isValid = this.verifyTOTPToken(secret, token);

      if (isValid) {
        // Reset failed attempts on success
        await this.resetFailedAttempts(userId);

        logger.info('TOTP verification successful', { userId });

        return {
          verified: true,
          remainingAttempts: this.maxAttempts
        };
      } else {
        // Increment failed attempts
        const remainingAttempts = await this.incrementFailedAttempts(userId);

        if (remainingAttempts <= 0) {
          await this.lockoutUser(userId);

          return {
            verified: false,
            remainingAttempts: 0,
            lockoutUntil: new Date(Date.now() + this.lockoutDuration)
          };
        }

        return {
          verified: false,
          remainingAttempts
        };
      }

    } catch (error: any) {
      logger.error('TOTP verification failed', {
        userId,
        error: error.message
      });

      return {
        verified: false,
        remainingAttempts: 0
      };
    }
  }

  // Verify backup code
  async verifyBackupCode(userId: string, code: string): Promise<MFAVerification> {
    try {
      // Get user's backup codes
      const mfaData = await this.getMFASecret(userId);
      if (!mfaData || !mfaData.backupCodes) {
        throw new Error('MFA not configured for user');
      }

      // Find unused backup code
      const backupCode = mfaData.backupCodes.find((bc: BackupCode) =>
        !bc.used && encryptionService.decrypt(bc.code) === code
      );

      if (!backupCode) {
        // Invalid or already used backup code
        const remainingAttempts = await this.incrementFailedAttempts(userId);

        return {
          verified: false,
          remainingAttempts
        };
      }

      // Mark backup code as used
      backupCode.used = true;
      backupCode.usedAt = new Date();

      await this.updateMFASecret(userId, mfaData);

      logger.info('Backup code verification successful', { userId });

      return {
        verified: true,
        remainingAttempts: this.maxAttempts,
        backupCodeUsed: true
      };

    } catch (error: any) {
      logger.error('Backup code verification failed', {
        userId,
        error: error.message
      });

      return {
        verified: false,
        remainingAttempts: 0
      };
    }
  }

  private generateOTPUrl(userId: string, secret: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: this.config.issuer,
      algorithm: this.config.algorithm,
      digits: this.config.digits.toString(),
      period: this.config.period.toString(),
    });

    return \`otpauth://totp/\${this.config.issuer}:\${userId}?\${params.toString()}\`;
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  private verifyTOTPToken(secret: string, token: string): boolean {
    const timeStep = Math.floor(Date.now() / 1000 / this.config.period);

    // Check current time step and adjacent steps (window tolerance)
    for (let i = -this.config.window; i <= this.config.window; i++) {
      const testTime = timeStep + i;
      const expectedToken = this.generateTOTPToken(secret, testTime);

      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  private generateTOTPToken(secret: string, timeStep: number): string {
    const secretBuffer = Buffer.from(secret, 'base64');
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(Math.floor(timeStep / Math.pow(2, 32)), 4);
    timeBuffer.writeUInt32BE(timeStep, 0);

    // HMAC using specified algorithm
    const hmac = crypto.createHmac(this.config.algorithm.toLowerCase(), secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    );

    // Generate digits
    const token = (code % Math.pow(10, this.config.digits)).toString().padStart(this.config.digits, '0');
    return token;
  }

  private async checkLockoutStatus(userId: string): Promise<{ lockoutUntil?: Date; attempts: number }> {
    // Implement based on your storage system
    return { attempts: 0 };
  }

  private async incrementFailedAttempts(userId: string): Promise<number> {
    // Implement based on your storage system
    return this.maxAttempts - 1;
  }

  private async resetFailedAttempts(userId: string): Promise<void> {
    // Implement based on your storage system
  }

  private async lockoutUser(userId: string): Promise<void> {
    // Implement based on your storage system
  }

  private async storeMFASecret(userId: string, secret: string, backupCodes: any[]): Promise<void> {
    // Implement based on your storage system
  }

  private async getMFASecret(userId: string): Promise<any> {
    // Implement based on your storage system
    return null;
  }

  private async updateMFASecret(userId: string, data: any): Promise<void> {
    // Implement based on your storage system
  }
}

export const mfaService = new MFAService();
`;

    fs.writeFileSync(path.join(this.srcRoot, 'services', 'mfaService.ts'), mfaConfig);

    // Install QR code generation
    try {
      execSync('npm install qrcode@^1.5.3 --save --silent', {
        cwd: this.backendRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('QR code installation warning:', error.message);
    }
  }

  async implementFieldEncryption() {
    // Field-level data encryption for Firestore
    const fieldEncryptionConfig = `
// Field-Level Data Encryption for Firestore
import * as admin from 'firebase-admin';
import { encryptionService } from './encryptionService';
import { logger } from '../utils/advancedLogger';

export interface EncryptionFieldConfig {
  collection: string;
  fields: string[];
  encryptNested?: boolean;
  encryptionKey?: string;
}

export class FieldEncryptionService {
  private db: admin.firestore.Firestore;
  private fieldConfigs: Map<string, EncryptionFieldConfig> = new Map();

  constructor() {
    this.db = admin.firestore();
  }

  // Register encryption configuration for a collection
  registerEncryptionConfig(config: EncryptionFieldConfig) {
    this.fieldConfigs.set(config.collection, config);

    logger.info('Encryption config registered', {
      collection: config.collection,
      fields: config.fields,
      encryptNested: config.encryptNested
    });
  }

  // Encrypt document before saving
  async encryptDocument(collection: string, documentId: string, data: any): Promise<any> {
    const config = this.fieldConfigs.get(collection);
    if (!config) {
      return data; // No encryption config for this collection
    }

    const encryptedData = { ...data };

    // Encrypt specified fields
    for (const field of config.fields) {
      if (encryptedData[field] !== undefined) {
        encryptedData[field] = encryptionService.encrypt(JSON.stringify(encryptedData[field]));
      }
    }

    // Encrypt nested objects if configured
    if (config.encryptNested) {
      encryptedData = this.encryptNestedObjects(encryptedData, config.fields);
    }

    return encryptedData;
  }

  // Decrypt document after reading
  async decryptDocument(collection: string, data: any): Promise<any> {
    const config = this.fieldConfigs.get(collection);
    if (!config) {
      return data; // No encryption config for this collection
    }

    const decryptedData = { ...data };

    // Decrypt specified fields
    for (const field of config.fields) {
      if (decryptedData[field] && typeof decryptedData[field] === 'string') {
        try {
          decryptedData[field] = JSON.parse(encryptionService.decrypt(decryptedData[field]));
        } catch (error) {
          logger.warn('Failed to decrypt field', { collection, field, error: error.message });
          decryptedData[field] = '[ENCRYPTED]'; // Placeholder for corrupted data
        }
      }
    }

    // Decrypt nested objects if configured
    if (config.encryptNested) {
      decryptedData = this.decryptNestedObjects(decryptedData, config.fields);
    }

    return decryptedData;
  }

  private encryptNestedObjects(data: any, encryptedFields: string[]): any {
    const result = { ...data };

    // Encrypt nested objects that contain sensitive fields
    Object.keys(result).forEach(key => {
      if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
        const nestedObj = result[key];

        // Check if nested object contains sensitive fields
        const hasSensitiveFields = encryptedFields.some(field => nestedObj[field] !== undefined);

        if (hasSensitiveFields) {
          result[key] = encryptionService.encrypt(JSON.stringify(nestedObj));
        } else {
          // Recursively encrypt nested objects
          result[key] = this.encryptNestedObjects(nestedObj, encryptedFields);
        }
      }
    });

    return result;
  }

  private decryptNestedObjects(data: any, encryptedFields: string[]): any {
    const result = { ...data };

    Object.keys(result).forEach(key => {
      if (typeof result[key] === 'string' && result[key].startsWith('{"encrypted":')) {
        try {
          const decrypted = JSON.parse(encryptionService.decrypt(result[key]));
          result[key] = this.decryptNestedObjects(decrypted, encryptedFields);
        } catch (error) {
          logger.warn('Failed to decrypt nested object', { key, error: error.message });
          result[key] = '[ENCRYPTED]';
        }
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.decryptNestedObjects(result[key], encryptedFields);
      }
    });

    return result;
  }

  // Middleware for automatic encryption/decryption
  createEncryptionMiddleware() {
    return async (req: any, res: any, next: any) => {
      const collection = req.params.collection || req.body.collection;

      if (!collection) {
        return next();
      }

      const config = this.fieldConfigs.get(collection);
      if (!config) {
        return next();
      }

      // Encrypt data before processing
      if (req.body && req.body.data) {
        req.body.data = await this.encryptDocument(collection, req.body.id, req.body.data);
      }

      // Store original response handler
      const originalJson = res.json;
      res.json = async function(body: any) {
        // Decrypt response data if it's from the encrypted collection
        if (body && typeof body === 'object' && body.data) {
          body.data = await this.decryptDocument(collection, body.data);
        }

        return originalJson.call(this, body);
      }.bind(this);

      next();
    };
  }
}

// Example usage and configuration
export const fieldEncryption = new FieldEncryptionService();

// Configure encryption for sensitive collections
fieldEncryption.registerEncryptionConfig({
  collection: 'users',
  fields: ['email', 'phone', 'ssn', 'bankAccount'],
  encryptNested: true
});

fieldEncryption.registerEncryptionConfig({
  collection: 'payments',
  fields: ['cardNumber', 'cvv', 'expiryDate'],
  encryptNested: false
});

fieldEncryption.registerEncryptionConfig({
  collection: 'documents',
  fields: ['content', 'metadata'],
  encryptNested: true
});
`;

    fs.writeFileSync(path.join(this.srcRoot, 'services', 'fieldEncryption.ts'), fieldEncryptionConfig);
  }

  async implementAuditLogging() {
    // Advanced audit logging with encryption
    const auditLoggingConfig = `
// Advanced Audit Logging with Encryption and Retention Policies
import * as admin from 'firebase-admin';
import { encryptionService } from './encryptionService';
import { logger } from '../utils/advancedLogger';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  metadata?: Record<string, any>;
  encrypted: boolean;
  retentionUntil: Date;
}

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AdvancedAuditLoggingService {
  private db: admin.firestore.Firestore;
  private retentionPolicies: Map<string, number> = new Map(); // resource -> days

  constructor() {
    this.db = admin.firestore();

    // Set default retention policies (in days)
    this.retentionPolicies.set('user_data', 2555); // 7 years (GDPR requirement)
    this.retentionPolicies.set('financial_data', 2555); // 7 years
    this.retentionPolicies.set('authentication', 365); // 1 year
    this.retentionPolicies.set('system_logs', 90); // 90 days
    this.retentionPolicies.set('security_events', 365); // 1 year
  }

  // Log audit event
  async logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'encrypted' | 'retentionUntil'>): Promise<string> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: \`audit_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
        timestamp: new Date(),
        encrypted: false,
        retentionUntil: this.calculateRetentionDate(entry.resource)
      };

      // Encrypt sensitive data
      const encryptedEntry = await this.encryptAuditEntry(auditEntry);

      // Store in Firestore with encryption
      const docRef = await this.db.collection('audit_logs').doc(auditEntry.id).set(encryptedEntry);

      logger.info('Audit log entry created', {
        entryId: auditEntry.id,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource
      });

      return auditEntry.id;

    } catch (error: any) {
      logger.error('Audit logging failed', {
        error: error.message,
        userId: entry.userId,
        action: entry.action
      });
      throw error;
    }
  }

  // Query audit logs
  async queryLogs(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    try {
      let dbQuery: admin.firestore.Query = this.db.collection('audit_logs');

      // Apply filters
      if (query.userId) {
        dbQuery = dbQuery.where('userId', '==', query.userId);
      }

      if (query.action) {
        dbQuery = dbQuery.where('action', '==', query.action);
      }

      if (query.resource) {
        dbQuery = dbQuery.where('resource', '==', query.resource);
      }

      if (query.startDate) {
        dbQuery = dbQuery.where('timestamp', '>=', query.startDate);
      }

      if (query.endDate) {
        dbQuery = dbQuery.where('timestamp', '<=', query.endDate);
      }

      // Apply ordering and pagination
      dbQuery = dbQuery
        .orderBy('timestamp', 'desc')
        .limit(query.limit || 100);

      if (query.offset) {
        dbQuery = dbQuery.offset(query.offset);
      }

      const snapshot = await dbQuery.get();

      // Decrypt and return entries
      const entries = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data() as AuditLogEntry;
          return await this.decryptAuditEntry(data);
        })
      );

      return entries;

    } catch (error: any) {
      logger.error('Audit log query failed', {
        error: error.message,
        query
      });
      throw error;
    }
  }

  // Encrypt audit entry
  private async encryptAuditEntry(entry: AuditLogEntry): Promise<any> {
    const sensitiveFields = ['oldValue', 'newValue', 'metadata'];

    const encrypted = { ...entry };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = encryptionService.encrypt(JSON.stringify(encrypted[field]));
        encrypted.encrypted = true;
      }
    }

    return encrypted;
  }

  // Decrypt audit entry
  private async decryptAuditEntry(entry: any): Promise<AuditLogEntry> {
    const decrypted = { ...entry };

    if (entry.encrypted) {
      const sensitiveFields = ['oldValue', 'newValue', 'metadata'];

      for (const field of sensitiveFields) {
        if (decrypted[field]) {
          try {
            decrypted[field] = JSON.parse(encryptionService.decrypt(decrypted[field]));
          } catch (error) {
            logger.warn('Failed to decrypt audit field', { field, error: error.message });
            decrypted[field] = '[ENCRYPTED]';
          }
        }
      }
    }

    return decrypted as AuditLogEntry;
  }

  private calculateRetentionDate(resource: string): Date {
    const retentionDays = this.retentionPolicies.get(resource) || 365; // Default 1 year
    return new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000));
  }

  // Set retention policy for a resource type
  setRetentionPolicy(resource: string, days: number) {
    this.retentionPolicies.set(resource, days);

    logger.info('Retention policy updated', { resource, days });
  }

  // Clean up expired audit logs
  async cleanupExpiredLogs(): Promise<number> {
    try {
      const now = new Date();
      const expiredQuery = this.db.collection('audit_logs')
        .where('retentionUntil', '<', now);

      const snapshot = await expiredQuery.get();

      if (snapshot.empty) {
        logger.info('No expired audit logs to clean up');
        return 0;
      }

      // Delete in batches to avoid Firestore limits
      const batchSize = 500;
      let deletedCount = 0;

      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = this.db.batch();
        const batchDocs = snapshot.docs.slice(i, i + batchSize);

        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += batchDocs.length;

        logger.info('Deleted expired audit log batch', {
          batchSize: batchDocs.length,
          totalDeleted: deletedCount
        });
      }

      logger.info('Expired audit logs cleanup completed', { deletedCount });

      return deletedCount;

    } catch (error: any) {
      logger.error('Expired audit logs cleanup failed', { error: error.message });
      throw error;
    }
  }

  // Generate audit report
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    filters?: { userId?: string; resource?: string; action?: string }
  ): Promise<{
    totalEntries: number;
    entriesByAction: Record<string, number>;
    entriesByResource: Record<string, number>;
    entriesByUser: Record<string, number>;
    securityEvents: number;
    dataChanges: number;
    summary: string;
  }> {
    try {
      const logs = await this.queryLogs({
        ...filters,
        startDate,
        endDate,
        limit: 10000 // Reasonable limit for reporting
      });

      const entriesByAction: Record<string, number> = {};
      const entriesByResource: Record<string, number> = {};
      const entriesByUser: Record<string, number> = {};

      let securityEvents = 0;
      let dataChanges = 0;

      for (const log of logs) {
        // Count by action
        entriesByAction[log.action] = (entriesByAction[log.action] || 0) + 1;

        // Count by resource
        entriesByResource[log.resource] = (entriesByResource[log.resource] || 0) + 1;

        // Count by user
        entriesByUser[log.userId] = (entriesByUser[log.userId] || 0) + 1;

        // Count security events
        if (log.action.includes('login') || log.action.includes('password') || log.action.includes('security')) {
          securityEvents++;
        }

        // Count data changes
        if (log.oldValue !== undefined || log.newValue !== undefined) {
          dataChanges++;
        }
      }

      const summary = \`Audit report for period \${startDate.toISOString()} to \${endDate.toISOString()}:
        - Total entries: \${logs.length}
        - Security events: \${securityEvents}
        - Data changes: \${dataChanges}
        - Unique users: \${Object.keys(entriesByUser).length}
        - Most common action: \${Object.entries(entriesByAction).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}\`;

      return {
        totalEntries: logs.length,
        entriesByAction,
        entriesByResource,
        entriesByUser,
        securityEvents,
        dataChanges,
        summary
      };

    } catch (error: any) {
      logger.error('Audit report generation failed', {
        error: error.message,
        startDate,
        endDate
      });
      throw error;
    }
  }

  // Export audit logs for compliance
  async exportAuditLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const logs = await this.queryLogs({ startDate, endDate, limit: 50000 });

      if (format === 'csv') {
        return this.convertToCSV(logs);
      } else {
        return JSON.stringify(logs, null, 2);
      }

    } catch (error: any) {
      logger.error('Audit logs export failed', {
        error: error.message,
        startDate,
        endDate,
        format
      });
      throw error;
    }
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    const headers = [
      'id', 'timestamp', 'userId', 'action', 'resource', 'resourceId',
      'ipAddress', 'userAgent', 'sessionId'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.userId,
        log.action,
        log.resource,
        log.resourceId,
        log.ipAddress,
        log.userAgent,
        log.sessionId
      ].join(','))
    ];

    return csvRows.join('\\n');
  }
}

export const auditLoggingService = new AdvancedAuditLoggingService();
`;

    fs.writeFileSync(path.join(this.srcRoot, 'services', 'auditLogging.ts'), auditLoggingConfig);
  }
}

// Run the implementer if called directly
if (require.main === module) {
  const implementer = new SecurityAdvancedImplementer();
  implementer.implement()
    .then(() => {
      console.log('🎉 Advanced security implementation completed!');
    })
    .catch(error => {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityAdvancedImplementer;







