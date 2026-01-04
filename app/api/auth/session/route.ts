/**
 * PulseTrade Session Validation API
 * GET /api/auth/session - Validate current session
 *
 * Checks if the current session is valid and returns user data.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AuthSessionResponse,
  APIErrorResponse,
} from '@/lib/types';
import {
  validateSession,
  extractSessionFromHeader,
  extractSessionFromCookie,
  refreshSession,
} from '@/lib/authService';
import { getUser as getBetServiceUser } from '@/lib/betService';

// ============================================
// Response Helpers
// ============================================

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<APIErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Try to get session token from multiple sources
    let sessionToken: string | null = null;

    // 1. Check Authorization header
    const authHeader = request.headers.get('Authorization');
    sessionToken = extractSessionFromHeader(authHeader);

    // 2. Check cookie if no header
    if (!sessionToken) {
      const cookieHeader = request.headers.get('Cookie');
      sessionToken = extractSessionFromCookie(cookieHeader);
    }

    // 3. Check query parameter (for debugging/testing)
    if (!sessionToken) {
      const { searchParams } = new URL(request.url);
      const tokenParam = searchParams.get('token');
      if (tokenParam) {
        sessionToken = tokenParam;
      }
    }

    // If no session token found, return unauthorized
    if (!sessionToken) {
      return NextResponse.json(
        {
          valid: false,
          error: 'No session token provided',
        } as AuthSessionResponse,
        { status: 401 }
      );
    }

    // Validate the session
    const validation = validateSession(sessionToken);

    if (!validation.valid || !validation.session || !validation.user) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.error || 'Invalid or expired session',
        } as AuthSessionResponse,
        { status: 401 }
      );
    }

    // Get latest balance from betService
    const betServiceUser = getBetServiceUser(validation.user.id);
    const currentBalance = betServiceUser.balance;

    // Refresh session to extend expiry
    const refreshedSession = refreshSession(sessionToken);

    // Build response
    const response: AuthSessionResponse = {
      valid: true,
      user: {
        id: validation.user.id,
        walletAddress: validation.user.walletAddress,
        displayName: validation.user.displayName || `User_${validation.user.walletAddress.slice(0, 6)}`,
        avatarUrl: validation.user.avatarUrl,
        balance: currentBalance,
        isDemo: validation.user.isDemo,
      },
      session: {
        createdAt: validation.session.createdAt.toISOString(),
        expiresAt: (refreshedSession || validation.session).expiresAt.toISOString(),
        lastActivityAt: (refreshedSession || validation.session).lastActivityAt.toISOString(),
      },
    };

    // Refresh the cookie with extended expiry
    const cookieValue = `pulsetrade_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`;

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Set-Cookie': cookieValue,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to validate session',
      500
    );
  }
}

// ============================================
// OPTIONS Handler (CORS)
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * GET /api/auth/session
 *
 * Validate the current session and return user data.
 *
 * Headers:
 * - Authorization: Bearer <sessionToken>
 * - Cookie: pulsetrade_session=<token>
 *
 * Response (200 - Valid Session):
 * {
 *   "valid": true,
 *   "user": {
 *     "id": "user_demo1234_abc",
 *     "walletAddress": "demowallet123...",
 *     "displayName": "Demo User",
 *     "avatarUrl": null,
 *     "balance": 9950.50,
 *     "isDemo": true
 *   },
 *   "session": {
 *     "createdAt": "2026-01-03T12:00:00Z",
 *     "expiresAt": "2026-01-04T12:00:00Z",
 *     "lastActivityAt": "2026-01-03T14:30:00Z"
 *   }
 * }
 *
 * Response (401 - Invalid/Expired):
 * {
 *   "valid": false,
 *   "error": "Invalid or expired session"
 * }
 *
 * Notes:
 * - Session is automatically refreshed on each validation
 * - Balance reflects real-time value from bet service
 * - Cookie is refreshed with extended expiry
 */
