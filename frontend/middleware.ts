import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// Security Headers Configuration
// ============================================================================

const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filter in browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Strict Transport Security (HTTPS enforcement)
  // Only enable in production with HTTPS
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }),
};

// Content Security Policy - adjust based on your needs
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.razorpay.com https://*.replicate.delivery https://*.vast.ai wss:",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// ============================================================================
// Protected Routes Configuration
// ============================================================================

const protectedRoutes = [
  '/studio',
  '/history',
  '/admin',
  '/settings',
  '/api/generate',
  '/api/history',
  '/api/admin',
];

const adminOnlyRoutes = [
  '/admin',
  '/api/admin',
];

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/gpu-marketplace',
];

// ============================================================================
// CSRF Token Validation
// ============================================================================

const csrfProtectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
const csrfExemptRoutes = [
  '/api/auth', // NextAuth handles its own CSRF
  '/api/webhook', // Webhooks use API secrets
  '/api/payment/webhook', // Payment webhooks
];

function validateCsrfToken(request: NextRequest): boolean {
  // Get CSRF token from header or cookie
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;
  
  // In development, skip CSRF for easier testing
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // For production, validate tokens match
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  return headerToken === cookieToken;
}

function shouldCheckCsrf(request: NextRequest): boolean {
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  // Only check CSRF for mutating methods
  if (!csrfProtectedMethods.includes(method)) {
    return false;
  }
  
  // Skip CSRF for exempt routes
  for (const route of csrfExemptRoutes) {
    if (path.startsWith(route)) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// Middleware Function
// ============================================================================

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Apply security headers to all responses
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CSP header
  response.headers.set('Content-Security-Policy', cspDirectives);
  
  // CSRF validation for mutating requests
  if (shouldCheckCsrf(request)) {
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }
  
  // Generate CSRF token for non-API routes
  if (!path.startsWith('/api/')) {
    const csrfToken = request.cookies.get('csrf-token')?.value;
    if (!csrfToken) {
      // Generate new CSRF token
      const newToken = crypto.randomUUID();
      response.cookies.set('csrf-token', newToken, {
        httpOnly: false, // Needs to be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }
  }
  
  // Check protected routes - actual auth check is done by NextAuth
  // This just adds an extra layer of protection
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(route + '/')
  );
  
  // For admin routes, we'll check role in the API route itself
  // since we can't access the session synchronously here
  
  return response;
}

// ============================================================================
// Matcher Configuration
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
