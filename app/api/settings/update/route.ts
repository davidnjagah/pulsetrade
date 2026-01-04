/**
 * PulseTrade Settings Update API
 * POST /api/settings/update - Update user settings
 *
 * Supports partial updates - only include fields you want to change.
 *
 * AUTHENTICATION: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  APIErrorResponse,
  SettingsResponse,
  SettingsUpdateRequest,
} from '@/lib/types';
import {
  updateSettings,
  validateSettings,
  SETTINGS_VALIDATION,
} from '@/lib/settingsService';
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
// POST Handler - Update User Settings
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

    // Parse request body
    let body: SettingsUpdateRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        'INVALID_JSON',
        'Request body must be valid JSON',
        400
      );
    }

    // Check if body is empty or not an object
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse(
        'INVALID_REQUEST',
        'Request body must be a non-empty object',
        400
      );
    }

    // Check if there are any updates
    const updateKeys = Object.keys(body).filter(key => body[key as keyof SettingsUpdateRequest] !== undefined);
    if (updateKeys.length === 0) {
      return errorResponse(
        'NO_UPDATES',
        'No settings to update. Provide at least one setting to change.',
        400
      );
    }

    // Validate the settings before updating
    const validationErrors = validateSettings(body);
    if (validationErrors.length > 0) {
      return errorResponse(
        'VALIDATION_ERROR',
        'One or more settings have invalid values',
        400,
        {
          errors: validationErrors,
          validRanges: {
            slippageTolerance: {
              min: SETTINGS_VALIDATION.slippageTolerance.min,
              max: SETTINGS_VALIDATION.slippageTolerance.max,
            },
            animationSpeed: SETTINGS_VALIDATION.animationSpeed,
          },
        }
      );
    }

    // Update the settings
    const result = updateSettings(userId, body);

    if (!result.success || !result.settings) {
      return errorResponse(
        'UPDATE_FAILED',
        'Failed to update settings',
        500,
        result.errors ? { errors: result.errors } : undefined
      );
    }

    console.log(`[Settings] Updated ${updateKeys.length} setting(s) for user ${userId}:`, updateKeys);

    const response: SettingsResponse = {
      success: true,
      settings: result.settings,
      updatedAt: result.updatedAt!,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to update settings',
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
 * POST /api/settings/update
 *
 * Update user settings. Supports partial updates - only include fields you want to change.
 *
 * Authentication:
 * - Authorization: Bearer <sessionToken>
 * - Cookie: pulsetrade_session=<token>
 * - Legacy: x-user-id header (for backwards compatibility)
 *
 * Request Body (all fields optional):
 * {
 *   "backgroundMusic": boolean,      // Enable/disable background music
 *   "soundEffects": boolean,         // Enable/disable sound effects
 *   "slippageTolerance": number,     // 1-50 (percentage)
 *   "showHighLowArea": boolean,      // Show high/low area on chart
 *   "doubleTapForTrading": boolean,  // Require double-tap to place bet
 *   "confirmBeforeBet": boolean,     // Show confirmation before placing bet
 *   "showMultipliers": boolean,      // Show multipliers on grid
 *   "compactMode": boolean,          // Enable compact UI mode
 *   "animationSpeed": "slow" | "normal" | "fast"
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "settings": { ... },  // Full updated settings object
 *   "updatedAt": "2026-01-04T12:00:00Z"
 * }
 *
 * Error Responses:
 * - 400: INVALID_JSON - Request body must be valid JSON
 * - 400: INVALID_REQUEST - Request body must be a non-empty object
 * - 400: NO_UPDATES - No settings to update
 * - 400: VALIDATION_ERROR - Invalid setting values
 *   - slippageTolerance must be 1-50
 *   - animationSpeed must be "slow", "normal", or "fast"
 *   - Boolean fields must be true/false
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 *
 * Validation Rules:
 * - slippageTolerance: integer 1-50
 * - animationSpeed: "slow" | "normal" | "fast"
 * - All toggle fields: boolean
 */
