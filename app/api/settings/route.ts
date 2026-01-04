/**
 * PulseTrade Settings API
 * GET /api/settings - Get user settings
 *
 * Returns the user's current settings or defaults if none set.
 *
 * AUTHENTICATION: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIErrorResponse, SettingsResponse } from '@/lib/types';
import { getSettings, DEFAULT_SETTINGS } from '@/lib/settingsService';
import { getAuth, getUserIdWithFallback } from '@/lib/authMiddleware';

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
// GET Handler - Get User Settings
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (with fallback to legacy header)
    const auth = getAuth(request);
    const userId = auth?.userId || getUserIdWithFallback(request);

    // Check if user is authenticated
    if (!auth) {
      // Allow legacy x-user-id header for backwards compatibility
      const legacyUserId = request.headers.get('x-user-id');
      if (!legacyUserId) {
        return errorResponse(
          'UNAUTHORIZED',
          'Authentication required. Please connect your wallet.',
          401
        );
      }
      console.log(`[Settings] Using legacy auth for user: ${legacyUserId}`);
    }

    // Get settings for the user
    const { settings, updatedAt, isDefault } = getSettings(userId);

    console.log(`[Settings] Retrieved settings for user ${userId}, isDefault: ${isDefault}`);

    const response: SettingsResponse = {
      success: true,
      settings,
      updatedAt,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to retrieve settings',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-session-token',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * GET /api/settings
 *
 * Get user settings.
 *
 * Authentication:
 * - Authorization: Bearer <sessionToken>
 * - Cookie: pulsetrade_session=<token>
 * - Legacy: x-user-id header (for backwards compatibility)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "settings": {
 *     "backgroundMusic": false,
 *     "soundEffects": true,
 *     "slippageTolerance": 30,
 *     "showHighLowArea": false,
 *     "doubleTapForTrading": false,
 *     "confirmBeforeBet": true,
 *     "showMultipliers": true,
 *     "compactMode": false,
 *     "animationSpeed": "normal"
 *   },
 *   "updatedAt": "2026-01-04T12:00:00Z"
 * }
 *
 * Error Responses:
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 *
 * Default Settings:
 * - backgroundMusic: false
 * - soundEffects: true
 * - slippageTolerance: 30 (30%)
 * - showHighLowArea: false
 * - doubleTapForTrading: false
 * - confirmBeforeBet: true
 * - showMultipliers: true
 * - compactMode: false
 * - animationSpeed: "normal"
 */
