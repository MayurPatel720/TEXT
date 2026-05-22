/**
 * Audit Logging Service
 * 
 * Tracks important user and system actions for security and compliance.
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

// ============================================================================
// Audit Log Schema
// ============================================================================

const AuditLogSchema = new mongoose.Schema({
  // Action details
  action: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['auth', 'user', 'admin', 'payment', 'generation', 'security'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
  },
  
  // Actor (who performed the action)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  userEmail: {
    type: String,
    index: true,
  },
  
  // Target (what was affected)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  targetType: {
    type: String,
  },
  
  // Request metadata
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  
  // Additional context
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  
  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// TTL index - delete logs after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound indexes for common queries
AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

// ============================================================================
// Audit Actions Constants
// ============================================================================

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  
  // 2FA
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_VERIFIED: 'TWO_FACTOR_VERIFIED',
  
  // User
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  
  // Admin
  ADMIN_USER_VIEW: 'ADMIN_USER_VIEW',
  ADMIN_USER_UPDATE: 'ADMIN_USER_UPDATE',
  ADMIN_CREDITS_ADD: 'ADMIN_CREDITS_ADD',
  ADMIN_PLAN_CHANGE: 'ADMIN_PLAN_CHANGE',
  
  // Payment
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILURE: 'PAYMENT_FAILURE',
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  
  // Generation
  GENERATION_STARTED: 'GENERATION_STARTED',
  GENERATION_COMPLETED: 'GENERATION_COMPLETED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  
  // Security
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

// ============================================================================
// Logging Functions
// ============================================================================

interface LogOptions {
  action: string;
  category: 'auth' | 'user' | 'admin' | 'payment' | 'generation' | 'security';
  status?: 'success' | 'failure' | 'warning';
  userId?: string;
  userEmail?: string;
  targetId?: string;
  targetType?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

/**
 * Log an audit event
 */
export async function logAudit(options: LogOptions): Promise<void> {
  try {
    await connectDB();
    
    await AuditLog.create({
      action: options.action,
      category: options.category,
      status: options.status || 'success',
      userId: options.userId,
      userEmail: options.userEmail,
      targetId: options.targetId,
      targetType: options.targetType,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      details: options.details,
    });
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📋 Audit: ${options.action} - ${options.userEmail || options.userId || 'anonymous'}`);
    }
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Extract IP and user agent from request
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const headers = request.headers;
  
  const ipAddress = 
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    '127.0.0.1';
  
  const userAgent = headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// ============================================================================
// Query Functions (for admin dashboard)
// ============================================================================

/**
 * Get recent audit logs
 */
export async function getRecentLogs(options: {
  limit?: number;
  category?: string;
  userId?: string;
  action?: string;
}): Promise<typeof AuditLog[]> {
  await connectDB();
  
  const query: Record<string, unknown> = {};
  
  if (options.category) query.category = options.category;
  if (options.userId) query.userId = options.userId;
  if (options.action) query.action = options.action;
  
  return AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .lean();
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(days = 7): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}> {
  await connectDB();
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const [total, byCategory, byStatus] = await Promise.all([
    AuditLog.countDocuments({ createdAt: { $gte: since } }),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);
  
  return {
    total,
    byCategory: Object.fromEntries(byCategory.map(b => [b._id, b.count])),
    byStatus: Object.fromEntries(byStatus.map(b => [b._id, b.count])),
  };
}

export { AuditLog };
