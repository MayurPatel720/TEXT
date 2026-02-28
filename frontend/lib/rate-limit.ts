/**
 * Rate Limiter for API Routes
 * 
 * Uses a simple in-memory LRU cache with sliding window algorithm.
 * Note: In serverless environments like Vercel, each instance has its
 * own cache, which provides partial protection. For full protection,
 * consider using Redis or Upstash.
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}

// In-memory store with automatic cleanup
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  private startCleanup(): void {
    // Clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
          if (entry.resetTime < now) {
            this.store.delete(key);
          }
        }
      }, 60000);

      // Prevent the interval from keeping the process alive in serverless
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    // LRU eviction if store is full
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }
    this.store.set(key, entry);
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }
}

// Singleton store instance
const store = new RateLimitStore();

/**
 * Check rate limit for a given identifier
 * 
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  const existing = store.get(key);

  // If no existing entry or window has expired, create new entry
  if (!existing || existing.resetTime < now) {
    const resetTime = now + config.windowMs;
    store.set(key, { count: 1, resetTime });
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime,
    };
  }

  // If within limit, increment count
  if (existing.count < config.limit) {
    existing.count++;
    store.set(key, existing);
    return {
      success: true,
      remaining: config.limit - existing.count,
      resetTime: existing.resetTime,
    };
  }

  // Rate limit exceeded
  const retryAfterSeconds = Math.ceil((existing.resetTime - now) / 1000);
  return {
    success: false,
    remaining: 0,
    resetTime: existing.resetTime,
    retryAfterSeconds,
  };
}

/**
 * Extract client IP from request headers
 * Handles common proxy headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  
  // Check for common proxy headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback - won't work in most serverless environments
  // but provides a default for local development
  return '127.0.0.1';
}

// Preset configurations for common use cases
export const rateLimitPresets = {
  /** Password reset: 5 requests per 15 minutes */
  passwordReset: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
  /** Login attempts: 10 requests per 15 minutes */
  login: {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  },
  /** API general: 100 requests per minute */
  apiGeneral: {
    limit: 100,
    windowMs: 60 * 1000,
  },
  /** Signup: 3 requests per hour */
  signup: {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  },
  /** Token validation: 20 requests per 15 minutes */
  tokenValidation: {
    limit: 20,
    windowMs: 15 * 60 * 1000,
  },
} as const;

/**
 * Helper to create rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds || 60),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetTime),
      },
    }
  );
}

export type { RateLimitConfig, RateLimitResult };
