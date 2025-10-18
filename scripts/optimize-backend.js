#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class BackendOptimizer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendRoot = path.join(this.projectRoot, 'backend');
  }

  async optimize() {
    console.log('🚀 Starting backend optimization...');
    
    try {
      // Step 1: Implement async middleware
      console.log('⚡ Implementing async middleware...');
      await this.implementAsyncMiddleware();
      
      // Step 2: Create serverless migration
      console.log('☁️  Creating serverless migration...');
      await this.createServerlessMigration();
      
      // Step 3: Implement API versioning
      console.log('📡 Implementing API versioning...');
      await this.implementAPIVersioning();
      
      // Step 4: Implement rate limiting
      console.log('🛡️  Implementing rate limiting...');
      await this.implementRateLimiting();
      
      // Step 5: Implement query optimization
      console.log('🔍 Implementing query optimization...');
      await this.implementQueryOptimization();
      
      // Step 6: Implement logging
      console.log('📝 Implementing advanced logging...');
      await this.implementAdvancedLogging();
      
      console.log('✅ Backend optimization completed!');
      
    } catch (error) {
      console.error('❌ Backend optimization failed:', error.message);
      process.exit(1);
    }
  }

  async implementAsyncMiddleware() {
    const asyncMiddleware = `
// Advanced async middleware with timeout handling
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AsyncMiddlewareOptions {
  timeout?: number;
  retries?: number;
  onError?: (error: Error, req: Request, res: Response) => void;
}

export function asyncMiddleware(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  options: AsyncMiddlewareOptions = {}
) {
  const { timeout = 30000, retries = 0, onError } = options;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    let attempts = 0;
    const maxAttempts = retries + 1;
    
    while (attempts < maxAttempts) {
      try {
        // Set timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });
        
        // Execute middleware with timeout
        await Promise.race([fn(req, res, next), timeoutPromise]);
        return;
        
      } catch (error: any) {
        attempts++;
        
        if (attempts >= maxAttempts) {
          logger.error('Async middleware failed after all retries', {
            error: error.message,
            attempts,
            path: req.path,
            method: req.method
          });
          
          if (onError) {
            onError(error, req, res);
          } else {
            res.status(500).json({
              error: 'Internal server error',
              code: 'ASYNC_MIDDLEWARE_ERROR'
            });
          }
          return;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  };
}

// Timeout middleware
export function timeoutMiddleware(timeout: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(timeout, () => {
      res.status(408).json({
        error: 'Request timeout',
        code: 'REQUEST_TIMEOUT'
      });
    });
    next();
  };
}

// Retry middleware
export function retryMiddleware(maxRetries: number = 3) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.retryCount = 0;
    req.maxRetries = maxRetries;
    next();
  };
}
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/middleware/async.ts'), asyncMiddleware);
  }

  async createServerlessMigration() {
    const serverlessConfig = `
// Firebase Functions configuration
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
initializeApp();

// HTTP Functions
export const api = onRequest({
  timeoutSeconds: 300,
  memory: '1GiB',
  cors: true
}, async (req, res) => {
  // Handle API requests
  const { method, path, body } = req;
  
  try {
    // Route to appropriate handler
    const handler = getHandler(method, path);
    const result = await handler(body);
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      code: 'FUNCTION_ERROR'
    });
  }
});

// Firestore Triggers
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const user = event.data?.data();
  if (user) {
    // Initialize user profile
    await initializeUserProfile(user);
  }
});

export const onJobCreated = onDocumentCreated('jobs/{jobId}', async (event) => {
  const job = event.data?.data();
  if (job) {
    // Process job creation
    await processJobCreation(job);
  }
});

// Scheduled Functions
export const cleanupExpiredJobs = onSchedule({
  schedule: '0 2 * * *', // Daily at 2 AM
  timeZone: 'Asia/Qatar'
}, async () => {
  await cleanupExpiredJobs();
});

export const sendDailyReports = onSchedule({
  schedule: '0 9 * * *', // Daily at 9 AM
  timeZone: 'Asia/Qatar'
}, async () => {
  await sendDailyReports();
});

// Helper functions
function getHandler(method: string, path: string) {
  // Route to appropriate handler based on method and path
  const routes = {
    'GET /api/v1/users': getUserHandler,
    'POST /api/v1/users': createUserHandler,
    'GET /api/v1/jobs': getJobsHandler,
    'POST /api/v1/jobs': createJobHandler,
    // Add more routes as needed
  };
  
  const key = \`\${method} \${path}\`;
  return routes[key] || defaultHandler;
}

async function defaultHandler(body: any) {
  return { message: 'Handler not found' };
}

async function getUserHandler(body: any) {
  // Implement user retrieval logic
  return { users: [] };
}

async function createUserHandler(body: any) {
  // Implement user creation logic
  return { message: 'User created' };
}

async function getJobsHandler(body: any) {
  // Implement job retrieval logic
  return { jobs: [] };
}

async function createJobHandler(body: any) {
  // Implement job creation logic
  return { message: 'Job created' };
}

async function initializeUserProfile(user: any) {
  // Initialize user profile logic
  console.log('Initializing user profile:', user);
}

async function processJobCreation(job: any) {
  // Process job creation logic
  console.log('Processing job creation:', job);
}

async function cleanupExpiredJobs() {
  // Cleanup expired jobs logic
  console.log('Cleaning up expired jobs');
}

async function sendDailyReports() {
  // Send daily reports logic
  console.log('Sending daily reports');
}
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/functions/index.ts'), serverlessConfig);
  }

  async implementAPIVersioning() {
    const versioningConfig = `
// API versioning implementation
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface VersionedRoute {
  version: string;
  path: string;
  handler: (req: Request, res: Response, next: NextFunction) => void;
  deprecated?: boolean;
  sunsetDate?: string;
}

export class APIVersioning {
  private routes: Map<string, VersionedRoute[]> = new Map();
  private currentVersion = 'v1';
  private supportedVersions = ['v1', 'v2'];
  
  constructor() {
    this.setupVersioning();
  }
  
  private setupVersioning() {
    // Register routes for different versions
    this.registerRoute('v1', '/users', this.v1GetUsers);
    this.registerRoute('v2', '/users', this.v2GetUsers);
    
    // Mark v1 as deprecated
    this.markDeprecated('v1', '/users', '2024-12-31');
  }
  
  registerRoute(version: string, path: string, handler: Function) {
    const key = \`\${version}:\${path}\`;
    if (!this.routes.has(key)) {
      this.routes.set(key, []);
    }
    this.routes.get(key)!.push({
      version,
      path,
      handler: handler as any
    });
  }
  
  markDeprecated(version: string, path: string, sunsetDate: string) {
    const key = \`\${version}:\${path}\`;
    const route = this.routes.get(key);
    if (route) {
      route[0].deprecated = true;
      route[0].sunsetDate = sunsetDate;
    }
  }
  
  getVersionHandler(version: string, path: string) {
    const key = \`\${version}:\${path}\`;
    return this.routes.get(key)?.[0];
  }
  
  // Version handlers
  private v1GetUsers = (req: Request, res: Response, next: NextFunction) => {
    // Add deprecation headers
    res.set({
      'X-API-Version': 'v1',
      'X-API-Deprecated': 'true',
      'X-API-Sunset': '2024-12-31'
    });
    
    res.json({
      users: [],
      version: 'v1',
      deprecated: true
    });
  };
  
  private v2GetUsers = (req: Request, res: Response, next: NextFunction) => {
    res.set({
      'X-API-Version': 'v2'
    });
    
    res.json({
      users: [],
      version: 'v2',
      features: ['enhanced-search', 'advanced-filtering']
    });
  };
  
  // Middleware for version detection
  versionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const version = req.header('X-API-Version') || this.currentVersion;
    
    if (!this.supportedVersions.includes(version)) {
      res.status(400).json({
        error: 'Unsupported API version',
        supportedVersions: this.supportedVersions
      });
      return;
    }
    
    req.apiVersion = version;
    next();
  };
  
  // Middleware for deprecation warnings
  deprecationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const version = req.apiVersion;
    const path = req.path;
    
    const route = this.getVersionHandler(version, path);
    if (route?.deprecated) {
      res.set({
        'X-API-Deprecated': 'true',
        'X-API-Sunset': route.sunsetDate || 'TBD'
      });
      
      logger.warn('Deprecated API endpoint accessed', {
        version,
        path,
        sunsetDate: route.sunsetDate
      });
    }
    
    next();
  };
}

// Export singleton instance
export const apiVersioning = new APIVersioning();
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/middleware/versioning.ts'), versioningConfig);
  }

  async implementRateLimiting() {
    const rateLimitingConfig = `
// Advanced rate limiting with Redis and captcha
import rateLimit from 'express-rate-limit';
import { RedisClientType } from 'redis';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

export class AdvancedRateLimiter {
  private redis: RedisClientType;
  private captchaThreshold = 5;
  
  constructor(redis: RedisClientType) {
    this.redis = redis;
  }
  
  // Basic rate limiting
  createRateLimit(config: RateLimitConfig) {
    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: config.message || 'Too many requests',
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      onLimitReached: config.onLimitReached || this.onLimitReached,
      standardHeaders: true,
      legacyHeaders: false
    });
  }
  
  // IP-based rate limiting
  createIPRateLimit(windowMs: number, max: number) {
    return this.createRateLimit({
      windowMs,
      max,
      keyGenerator: (req) => \`ip:\${req.ip}\`,
      message: 'Too many requests from this IP'
    });
  }
  
  // User-based rate limiting
  createUserRateLimit(windowMs: number, max: number) {
    return this.createRateLimit({
      windowMs,
      max,
      keyGenerator: (req) => \`user:\${req.user?.id || req.ip}\`,
      message: 'Too many requests from this user'
    });
  }
  
  // Endpoint-specific rate limiting
  createEndpointRateLimit(endpoint: string, windowMs: number, max: number) {
    return this.createRateLimit({
      windowMs,
      max,
      keyGenerator: (req) => \`endpoint:\${endpoint}:\${req.ip}\`,
      message: \`Too many requests to \${endpoint}\`
    });
  }
  
  // Captcha-based rate limiting
  createCaptchaRateLimit(windowMs: number, max: number) {
    return async (req: Request, res: Response, next: Function) => {
      const key = \`captcha:\${req.ip}\`;
      const attempts = await this.redis.get(key);
      
      if (attempts && parseInt(attempts) >= this.captchaThreshold) {
        res.status(429).json({
          error: 'Captcha required',
          code: 'CAPTCHA_REQUIRED',
          captchaUrl: '/api/v1/captcha'
        });
        return;
      }
      
      next();
    };
  }
  
  // Sliding window rate limiting
  async slidingWindowRateLimit(
    key: string,
    windowMs: number,
    max: number
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old entries
    await this.redis.zRemRangeByScore(key, 0, windowStart);
    
    // Count current entries
    const count = await this.redis.zCard(key);
    
    if (count >= max) {
      return false;
    }
    
    // Add current request
    await this.redis.zAdd(key, {
      score: now,
      value: now.toString()
    });
    
    // Set expiration
    await this.redis.expire(key, Math.ceil(windowMs / 1000));
    
    return true;
  }
  
  // Token bucket rate limiting
  async tokenBucketRateLimit(
    key: string,
    capacity: number,
    refillRate: number,
    tokens: number = capacity
  ): Promise<boolean> {
    const now = Date.now();
    const lastRefill = await this.redis.get(\`\${key}:lastRefill\`);
    const lastRefillTime = lastRefill ? parseInt(lastRefill) : now;
    
    // Calculate tokens to add
    const timePassed = now - lastRefillTime;
    const tokensToAdd = Math.floor(timePassed * refillRate / 1000);
    const newTokens = Math.min(capacity, tokens + tokensToAdd);
    
    if (newTokens < 1) {
      return false;
    }
    
    // Update tokens
    await this.redis.set(\`\${key}:tokens\`, newTokens - 1);
    await this.redis.set(\`\${key}:lastRefill\`, now);
    
    return true;
  }
  
  private defaultKeyGenerator(req: Request): string {
    return req.ip;
  }
  
  private onLimitReached(req: Request, res: Response) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
  }
}

// Export rate limiter instances
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests',
  standardHeaders: true,
  legacyHeaders: false
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false
});
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/middleware/rateLimiting.ts'), rateLimitingConfig);
  }

  async implementQueryOptimization() {
    const queryOptimization = `
// Firestore query optimization
import { Firestore } from 'firebase-admin/firestore';
import { logger } from '../utils/logger';

export interface QueryOptimizationOptions {
  maxResults?: number;
  orderBy?: string;
  startAfter?: any;
  endBefore?: any;
  filters?: Array<{ field: string; operator: string; value: any }>;
}

export class QueryOptimizer {
  private firestore: Firestore;
  
  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }
  
  // Optimized collection query
  async optimizedQuery(
    collection: string,
    options: QueryOptimizationOptions = {}
  ) {
    const {
      maxResults = 50,
      orderBy = 'createdAt',
      startAfter,
      endBefore,
      filters = []
    } = options;
    
    let query = this.firestore.collection(collection);
    
    // Apply filters
    for (const filter of filters) {
      query = query.where(filter.field, filter.operator as any, filter.value);
    }
    
    // Apply ordering
    query = query.orderBy(orderBy, 'desc');
    
    // Apply pagination
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    if (endBefore) {
      query = query.endBefore(endBefore);
    }
    
    // Apply limit
    query = query.limit(maxResults);
    
    try {
      const snapshot = await query.get();
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        results,
        hasMore: snapshot.docs.length === maxResults,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error: any) {
      logger.error('Query optimization failed', {
        error: error.message,
        collection,
        options
      });
      throw error;
    }
  }
  
  // Batch operations
  async batchWrite(operations: Array<{ type: 'create' | 'update' | 'delete'; collection: string; id: string; data?: any }>) {
    const batch = this.firestore.batch();
    
    for (const operation of operations) {
      const docRef = this.firestore.collection(operation.collection).doc(operation.id);
      
      switch (operation.type) {
        case 'create':
          batch.set(docRef, operation.data);
          break;
        case 'update':
          batch.update(docRef, operation.data);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    }
    
    return batch.commit();
  }
  
  // Transaction operations
  async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    return this.firestore.runTransaction(callback);
  }
  
  // Index optimization
  async optimizeIndexes(collection: string, fields: string[]) {
    // This would typically be done through Firebase Console
    // or Firebase CLI, but we can log recommendations
    logger.info('Index optimization recommendations', {
      collection,
      fields,
      recommendations: [
        'Create composite indexes for frequently queried field combinations',
        'Use single-field indexes for individual field queries',
        'Consider array-contains indexes for array field queries'
      ]
    });
  }
  
  // Query performance monitoring
  async monitorQueryPerformance(collection: string, query: any) {
    const startTime = Date.now();
    
    try {
      const results = await query.get();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.info('Query performance', {
        collection,
        duration,
        resultCount: results.docs.length,
        timestamp: new Date().toISOString()
      });
      
      return results;
    } catch (error: any) {
      logger.error('Query performance monitoring failed', {
        collection,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }
}

// Export query optimizer instance
export const queryOptimizer = new QueryOptimizer(require('firebase-admin').firestore());
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/utils/queryOptimizer.ts'), queryOptimization);
  }

  async implementAdvancedLogging() {
    const loggingConfig = `
// Advanced logging with Winston and Sentry
import winston from 'winston';
import { Sentry } from '@sentry/node';
import { Request, Response } from 'express';

export interface LogContext {
  level: string;
  message: string;
  meta?: any;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: string;
}

export class AdvancedLogger {
  private logger: winston.Logger;
  private sentry: typeof Sentry;
  
  constructor() {
    this.sentry = Sentry;
    this.logger = this.createLogger();
  }
  
  private createLogger() {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'logs/combined.log'
        })
      ]
    });
  }
  
  // Structured logging
  log(context: LogContext) {
    const { level, message, meta, ...rest } = context;
    
    this.logger.log(level, message, {
      ...meta,
      ...rest,
      timestamp: new Date().toISOString()
    });
    
    // Send to Sentry for error levels
    if (level === 'error' || level === 'fatal') {
      this.sentry.captureException(new Error(message), {
        extra: meta,
        tags: {
          level,
          requestId: rest.requestId,
          userId: rest.userId
        }
      });
    }
  }
  
  // Request logging
  logRequest(req: Request, res: Response, duration: number) {
    this.log({
      level: 'info',
      message: 'HTTP Request',
      meta: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      requestId: req.headers['x-request-id'] as string
    });
  }
  
  // Error logging
  logError(error: Error, context?: any) {
    this.log({
      level: 'error',
      message: error.message,
      meta: {
        stack: error.stack,
        ...context
      }
    });
  }
  
  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: any) {
    this.log({
      level: 'info',
      message: 'Performance metric',
      meta: {
        operation,
        duration,
        ...metadata
      }
    });
  }
  
  // Security logging
  logSecurity(event: string, details: any) {
    this.log({
      level: 'warn',
      message: 'Security event',
      meta: {
        event,
        ...details
      }
    });
  }
  
  // Business logic logging
  logBusiness(event: string, details: any) {
    this.log({
      level: 'info',
      message: 'Business event',
      meta: {
        event,
        ...details
      }
    });
  }
}

// Export logger instance
export const advancedLogger = new AdvancedLogger();
`;
    
    fs.writeFileSync(path.join(this.backendRoot, 'src/utils/advancedLogger.ts'), loggingConfig);
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new BackendOptimizer();
  optimizer.optimize()
    .then(() => {
      console.log('🎉 Backend optimization completed!');
    })
    .catch(error => {
      console.error('❌ Backend optimization failed:', error);
      process.exit(1);
    });
}

module.exports = BackendOptimizer;







