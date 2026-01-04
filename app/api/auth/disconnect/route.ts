/**
 * PulseTrade Wallet Disconnect API
 * POST /api/auth/disconnect - Disconnect wallet and invalidate session
 *
 * Logs out the user by invalidating their session token.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AuthDisconnectResponse,
  APIErrorResponse,
} from '@/lib/types';
import {
  deleteSession,
  extractSessionFromHeader,
  extractSessionFromCookie,
  getSession,
} from '@/lib/authService';

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
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
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

    // 3. Check request body
    if (!sessionToken) {
      try {
        const body = await request.json();
        if (body.sessionToken) {
          sessionToken = body.sessionToken;
        }
      } catch {
        // No body or invalid JSON - that's okay
      }
    }

    // If no session token found, still return success (idempotent logout)
    if (!sessionToken) {
      const response: AuthDisconnectResponse = {
        success: true,
        message: 'No active session found',
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          // Clear the session cookie
          'Set-Cookie': 'pulsetrade_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Get session info before deleting (for logging)
    const session = getSession(sessionToken);
    const userId = session?.userId;

    // Delete the session
    const deleted = deleteSession(sessionToken);

    if (deleted) {
      console.log(`[Auth] Disconnected session for user: ${userId}`);
    }

    const response: AuthDisconnectResponse = {
      success: true,
      message: deleted ? 'Successfully disconnected' : 'Session was already expired',
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Clear the session cookie
        'Set-Cookie': 'pulsetrade_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Auth disconnect error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to disconnect',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * POST /api/auth/disconnect
 *
 * Disconnect the wallet and invalidate the current session.
 *
 * Headers:
 * - Authorization: Bearer <sessionToken> (optional)
 * - Cookie: pulsetrade_session=<token> (optional)
 *
 * Request Body (optional):
 * {
 *   "sessionToken": "pts_123abc..."
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Successfully disconnected"
 * }
 *
 * Notes:
 * - This endpoint is idempotent - calling it multiple times is safe
 * - Session cookie is cleared automatically
 * - Returns success even if no session was found
 */
