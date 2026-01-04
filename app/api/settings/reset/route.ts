/**
 * PulseTrade Settings Reset API
 * POST /api/settings/reset - Reset settings to defaults
 *
 * Resets all user settings to their default values.
 *
 * AUTHENTICATION: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIErrorResponse, SettingsResponse } from '@/lib/types';
import { resetSettings, DEFAULT_SETTINGS } from '@/lib/settingsService';
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
// POST Handler - Reset Settings to Defaults
// ============================================

export async function POST(request: NextRequest) {
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

    // Reset settings to defaults
    const result = resetSettings(userId);

    console.log(`[Settings] Reset settings to defaults for user ${userId}`);

    const response: SettingsResponse & { message: string } = {
      success: true,
      message: 'Settings reset to defaults',
      settings: result.settings,
      updatedAt: result.updatedAt,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to reset settings',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-session-token',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * POST /api/settings/reset
 *
 * Reset all user settings to default values.
 *
 * Authentication:
 * - Authorization: Bearer <sessionToken>
 * - Cookie: pulsetrade_session=<token>
 * - Legacy: x-user-id header (for backwards compatibility)
 *
 * Request Body: (none required)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Settings reset to defaults",
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
 *
 * Error Responses:
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
