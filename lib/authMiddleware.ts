/**
 * PulseTrade Authentication Middleware
 * Provides withAuth wrapper for protected API routes
 *
 * Usage:
 * ```typescript
 * import { withAuth } from '@/lib/authMiddleware';
 *
 * export const POST = withAuth(async (request, auth) => {
 *   // auth.userId, auth.walletAddress, auth.session available
 *   return NextResponse.json({ userId: auth.userId });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AuthenticatedRequest,
  APIErrorResponse,
  Session,
} from './types';
import {
  validateSession,
  extractSessionFromHeader,
  extractSessionFromCookie,
  refreshSession,
} from './authService';

// ============================================
// Types
// ============================================

/**
 * Handler function type for authenticated routes
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  auth: AuthenticatedRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Options for withAuth middleware
 */
export interface WithAuthOptions {
  /**
   * Allow requests without authentication (returns null auth)
   */
  optional?: boolean;

  /**
   * Refresh session on each request (default: true)
   */
  refreshSession?: boolean;
}

// ============================================
// Response Helpers
// ============================================

function unauthorizedResponse(
  message: string = 'Authentication required',
  code: string = 'UNAUTHORIZED'
): NextResponse<APIErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status: 401 }
  );
}

// ============================================
// Session Extraction
// ============================================

/**
 * Extract session token from request (header or cookie)
 */
function extractSessionToken(request: NextRequest): string | null {
  // 1. Check Authorization header (preferred)
  const authHeader = request.headers.get('Authorization');
  const headerToken = extractSessionFromHeader(authHeader);

  if (headerToken) {
    return headerToken;
  }

  // 2. Check cookie
  const cookieHeader = request.headers.get('Cookie');
  const cookieToken = extractSessionFromCookie(cookieHeader);

  if (cookieToken) {
    return cookieToken;
  }

  // 3. Check x-session-token header (alternative)
  const sessionHeader = request.headers.get('x-session-token');
  if (sessionHeader) {
    return sessionHeader;
  }

  return null;
}

// ============================================
// withAuth Middleware
// ============================================

/**
 * Wrap an API handler with authentication
 *
 * @param handler - The authenticated handler function
 * @param options - Middleware options
 * @returns Next.js API route handler
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: WithAuthOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const { optional = false, refreshSession: shouldRefresh = true } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract session token
      const sessionToken = extractSessionToken(request);

      // If no token and auth is required
      if (!sessionToken) {
        if (optional) {
          // For optional auth, we can't proceed without a token
          // But we could allow the handler to decide
          return unauthorizedResponse('No session token provided');
        }
        return unauthorizedResponse('Authentication required. Please connect your wallet.');
      }

      // Validate the session
      const validation = validateSession(sessionToken);

      if (!validation.valid || !validation.session) {
        if (optional) {
          return unauthorizedResponse(validation.error || 'Invalid session');
        }
        return unauthorizedResponse(
          validation.error || 'Session expired. Please reconnect your wallet.',
          'SESSION_EXPIRED'
        );
      }

      // Refresh session if enabled
      if (shouldRefresh) {
        refreshSession(sessionToken);
      }

      // Build authenticated request context
      const auth: AuthenticatedRequest = {
        userId: validation.session.userId,
        walletAddress: validation.session.walletAddress,
        session: validation.session,
        isDemo: validation.session.walletType === 'demo',
      };

      // Call the handler with auth context
      return await handler(request, auth);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authentication error',
          },
        },
        { status: 500 }
      );
    }
  };
}

// ============================================
// Alternative: getAuth helper
// ============================================

/**
 * Get auth context from request without middleware
 * Useful for routes that need conditional auth
 *
 * @param request - Next.js request
 * @returns Auth context or null if not authenticated
 */
export function getAuth(request: NextRequest): AuthenticatedRequest | null {
  const sessionToken = extractSessionToken(request);

  if (!sessionToken) {
    return null;
  }

  const validation = validateSession(sessionToken);

  if (!validation.valid || !validation.session) {
    return null;
  }

  return {
    userId: validation.session.userId,
    walletAddress: validation.session.walletAddress,
    session: validation.session,
    isDemo: validation.session.walletType === 'demo',
  };
}

/**
 * Require auth and return context, or throw error response
 * For use in traditional handler patterns
 *
 * @param request - Next.js request
 * @returns Auth context
 * @throws NextResponse with 401 status
 */
export function requireAuth(request: NextRequest): AuthenticatedRequest {
  const auth = getAuth(request);

  if (!auth) {
    throw unauthorizedResponse('Authentication required');
  }

  return auth;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if request is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  return getAuth(request) !== null;
}

/**
 * Get user ID from request (or null if not authenticated)
 */
export function getUserId(request: NextRequest): string | null {
  const auth = getAuth(request);
  return auth?.userId || null;
}

/**
 * Get user ID from request, falling back to legacy x-user-id header
 * Useful for backwards compatibility during migration
 */
export function getUserIdWithFallback(request: NextRequest): string {
  // First try session auth
  const auth = getAuth(request);
  if (auth) {
    return auth.userId;
  }

  // Fall back to legacy header
  const legacyUserId = request.headers.get('x-user-id');
  if (legacyUserId) {
    return legacyUserId;
  }

  // Default to demo user
  return 'demo-user';
}

// ============================================
// Exports
// ============================================

export {
  extractSessionToken,
  unauthorizedResponse,
};
