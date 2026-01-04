/**
 * PulseTrade User API
 * GET /api/user - Get user profile with balance
 * POST /api/user - Update balance (for demo)
 * PUT /api/user - Reset balance to default
 *
 * Provides user information and balance management for the demo.
 *
 * AUTHENTICATION: Required for protected operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIErrorResponse, UserBalance, SettingsData } from '@/lib/types';
import {
  getUser,
  updateUserBalance,
  addToBalance,
  deductFromBalance,
  getActiveBets,
  getBetStats,
  DEFAULT_USER_ID,
  DEFAULT_BALANCE,
} from '@/lib/betService';
import { getAuth, getUserIdWithFallback } from '@/lib/authMiddleware';
import { getSettings } from '@/lib/settingsService';

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
// Types
// ============================================

interface UserProfileResponse {
  id: string;
  walletAddress: string | null;
  username: string;
  avatarUrl: string | null;
  balance: number;
  lockedInBets: number;
  available: number;
  isDemo: boolean;
  stats: {
    totalBets: number;
    wins: number;
    losses: number;
    winRate: number;
    profit: number;
  };
  settings: SettingsData;
}

interface BalanceUpdateRequest {
  action: 'set' | 'add' | 'deduct';
  amount: number;
}

interface BalanceUpdateResponse {
  success: boolean;
  balance: number;
  available: number;
  lockedInBets: number;
}

// ============================================
// GET Handler - Get User Profile
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'full';

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
      console.log(`[User] Using legacy auth for user: ${legacyUserId}`);
    }

    const user = getUser(userId);
    const activeBets = getActiveBets(userId);
    const lockedInBets = activeBets.totalExposure;
    const available = Math.max(0, user.balance - lockedInBets);

    // Return balance only
    if (mode === 'balance') {
      const response: UserBalance = {
        balance: user.balance,
        lockedInBets,
        available,
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Return full profile
    const stats = getBetStats(userId);
    const { settings } = getSettings(userId);

    // Determine username from auth or generate
    let username = 'Demo User';
    let walletAddress: string | null = null;
    let isDemo = true;

    if (auth) {
      walletAddress = auth.walletAddress;
      isDemo = auth.isDemo;
      username = isDemo ? 'Demo User' : `User_${auth.walletAddress.slice(0, 6)}`;
    } else if (userId !== DEFAULT_USER_ID) {
      username = `User_${userId.slice(0, 6)}`;
    }

    const response: UserProfileResponse = {
      id: userId,
      walletAddress,
      username,
      avatarUrl: null,
      balance: user.balance,
      lockedInBets,
      available,
      isDemo,
      stats: {
        totalBets: stats.totalBets,
        wins: stats.wins,
        losses: stats.losses,
        winRate: Math.round(stats.winRate * 100) / 100,
        profit: Math.round(stats.profit * 100) / 100,
      },
      settings,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('User profile error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch user profile',
      500
    );
  }
}

// ============================================
// POST Handler - Update Balance (Demo)
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
      console.log(`[User] Using legacy auth for user: ${legacyUserId}`);
    }

    // Parse request body
    let body: BalanceUpdateRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        'INVALID_JSON',
        'Request body must be valid JSON',
        400
      );
    }

    const { action, amount } = body;

    // Validate action
    if (!action || !['set', 'add', 'deduct'].includes(action)) {
      return errorResponse(
        'INVALID_ACTION',
        'Action must be one of: set, add, deduct',
        400
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      return errorResponse(
        'INVALID_AMOUNT',
        'Amount must be a valid number',
        400
      );
    }

    if (amount < 0) {
      return errorResponse(
        'NEGATIVE_AMOUNT',
        'Amount cannot be negative',
        400
      );
    }

    // Get current state
    const user = getUser(userId);
    const activeBets = getActiveBets(userId);
    const lockedInBets = activeBets.totalExposure;

    // Perform action
    let newUser;
    switch (action) {
      case 'set':
        // Cannot set balance below locked amount
        if (amount < lockedInBets) {
          return errorResponse(
            'INVALID_BALANCE',
            `Cannot set balance below locked amount (${lockedInBets})`,
            400,
            { lockedInBets }
          );
        }
        newUser = updateUserBalance(userId, amount);
        break;

      case 'add':
        newUser = addToBalance(userId, amount);
        break;

      case 'deduct':
        // Check if deduction would go below locked amount
        const newBalance = user.balance - amount;
        if (newBalance < lockedInBets) {
          return errorResponse(
            'INSUFFICIENT_BALANCE',
            `Cannot deduct ${amount}. Available: ${user.balance - lockedInBets}`,
            400,
            { available: user.balance - lockedInBets, lockedInBets }
          );
        }
        newUser = deductFromBalance(userId, amount);
        break;

      default:
        return errorResponse('INVALID_ACTION', 'Unknown action', 400);
    }

    const response: BalanceUpdateResponse = {
      success: true,
      balance: newUser.balance,
      available: newUser.balance - lockedInBets,
      lockedInBets,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Balance update error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to update balance',
      500
    );
  }
}

// ============================================
// PUT Handler - Reset Balance to Default
// ============================================

export async function PUT(request: NextRequest) {
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
      console.log(`[User] Using legacy auth for user: ${legacyUserId}`);
    }

    // Reset to default balance
    const newUser = updateUserBalance(userId, DEFAULT_BALANCE);

    const activeBets = getActiveBets(userId);
    const lockedInBets = activeBets.totalExposure;

    return NextResponse.json(
      {
        success: true,
        message: 'Balance reset to default',
        balance: newUser.balance,
        available: newUser.balance - lockedInBets,
        lockedInBets,
        defaultBalance: DEFAULT_BALANCE,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error) {
    console.error('Balance reset error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to reset balance',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-session-token',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * GET /api/user
 *
 * Get user profile with balance and stats.
 *
 * Authentication:
 * - Authorization: Bearer <sessionToken>
 * - Cookie: pulsetrade_session=<token>
 * - Legacy: x-user-id header (for backwards compatibility)
 *
 * Query Parameters:
 * - mode: "full" (default) | "balance"
 *
 * Response (mode=full, 200):
 * {
 *   "id": "user_demo1234_abc",
 *   "walletAddress": "demo123...",
 *   "username": "Demo User",
 *   "avatarUrl": null,
 *   "balance": 10000,
 *   "lockedInBets": 50,
 *   "available": 9950,
 *   "isDemo": true,
 *   "stats": {
 *     "totalBets": 10,
 *     "wins": 4,
 *     "losses": 5,
 *     "winRate": 0.44,
 *     "profit": -25.50
 *   },
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
 *   }
 * }
 *
 * Response (mode=balance, 200):
 * {
 *   "balance": 10000,
 *   "lockedInBets": 50,
 *   "available": 9950
 * }
 *
 * POST /api/user
 *
 * Update user balance (for demo purposes).
 *
 * Request Body:
 * {
 *   "action": "set" | "add" | "deduct",
 *   "amount": 1000
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "balance": 11000,
 *   "available": 10950,
 *   "lockedInBets": 50
 * }
 *
 * PUT /api/user
 *
 * Reset balance to default value ($10,000).
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Balance reset to default",
 *   "balance": 10000,
 *   "available": 10000,
 *   "lockedInBets": 0,
 *   "defaultBalance": 10000
 * }
 *
 * Error Responses:
 * - 401: Unauthorized (no valid session)
 * - 400: Invalid request parameters
 * - 500: Internal server error
 */
