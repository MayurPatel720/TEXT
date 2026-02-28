/**
 * Input Validation & Sanitization Utilities
 * 
 * Provides consistent validation and sanitization across the application.
 */

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize string input - removes potential XSS vectors
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove null bytes
    .replace(/\0/g, '');
}

/**
 * Sanitize for database query - prevents NoSQL injection
 */
export function sanitizeForQuery(input: unknown): unknown {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/^\$/, '');
  }
  
  if (typeof input === 'object' && input !== null) {
    // Recursively sanitize object keys that start with $
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeForQuery(value);
      }
    }
    return sanitized;
  }
  
  return input;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Request Validation Helpers
// ============================================================================

/**
 * Extract and validate required string field from request body
 */
export function requireString(
  body: Record<string, unknown>,
  field: string,
  options?: { minLength?: number; maxLength?: number }
): { value: string; error?: string } {
  const value = body[field];
  
  if (typeof value !== 'string') {
    return { value: '', error: `${field} is required and must be a string` };
  }
  
  const sanitized = sanitizeString(value);
  
  if (options?.minLength && sanitized.length < options.minLength) {
    return { value: sanitized, error: `${field} must be at least ${options.minLength} characters` };
  }
  
  if (options?.maxLength && sanitized.length > options.maxLength) {
    return { value: sanitized, error: `${field} must be at most ${options.maxLength} characters` };
  }
  
  return { value: sanitized };
}

/**
 * Extract and validate optional string field
 */
export function optionalString(
  body: Record<string, unknown>,
  field: string,
  defaultValue = ''
): string {
  const value = body[field];
  if (typeof value !== 'string') return defaultValue;
  return sanitizeString(value);
}

/**
 * Extract and validate required number field
 */
export function requireNumber(
  body: Record<string, unknown>,
  field: string,
  options?: { min?: number; max?: number }
): { value: number; error?: string } {
  const value = body[field];
  
  if (typeof value !== 'number' || isNaN(value)) {
    return { value: 0, error: `${field} is required and must be a number` };
  }
  
  if (options?.min !== undefined && value < options.min) {
    return { value, error: `${field} must be at least ${options.min}` };
  }
  
  if (options?.max !== undefined && value > options.max) {
    return { value, error: `${field} must be at most ${options.max}` };
  }
  
  return { value };
}

// ============================================================================
// Disposable Email Checker
// ============================================================================

const disposableEmailDomains = new Set([
  'tempmail.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'yopmail.com', 'fakeinbox.com',
  'getnada.com', 'maildrop.cc', 'trashmail.com', 'dispostable.com',
  'sharklasers.com', 'spam4.me', 'tempinbox.com', 'roratu.com',
  '1secmail.com', '1secmail.net', '1secmail.org', 'emailondeck.com',
  'mohmal.com', 'burnermail.io', 'mailsac.com', 'guerrillamail.org',
]);

/**
 * Check if email domain is from a known disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return disposableEmailDomains.has(domain);
}

// ============================================================================
// Common Validation Schemas
// ============================================================================

export const validationSchemas = {
  email: {
    validate: (email: string) => {
      if (!email) return 'Email is required';
      if (!isValidEmail(email)) return 'Invalid email format';
      if (isDisposableEmail(email)) return 'Disposable emails are not allowed';
      return null;
    },
  },
  password: {
    validate: (password: string) => {
      const result = validatePassword(password);
      return result.valid ? null : result.errors[0];
    },
  },
  name: {
    validate: (name: string) => {
      if (!name || name.length < 2) return 'Name must be at least 2 characters';
      if (name.length > 100) return 'Name must be less than 100 characters';
      if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
      return null;
    },
  },
};
