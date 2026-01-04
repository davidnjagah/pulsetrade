/**
 * PulseTrade Profile API
 * GET /api/profile - Get user profile
 *
 * Query Parameters:
 * - userId: string (optional) - View another user's public profile
 *
 * Features:
 * - Returns own profile when authenticated (full data)
 * - Returns public profile for other users (limited data)
 * - Includes user info, stats, and recent bets
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  UserProfileResponse,
  APIErrorResponse,
} from '@/lib/types';
import {
  getUserProfileResponse,
  getPublicProfile,
} from '@/lib/profileService';
import { getAuth } from '@/lib/authMiddleware';
import { getUserById } from '@/lib/authService';

// ============================================
// CORS Headers
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-token',
};

// ============================================
// Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // Get authentication context
    const auth = getAuth(request);

    // If viewing another user's profile
    if (userIdParam) {
      // Check if it's the authenticated user viewing their own profile
      if (auth && auth.userId === userIdParam) {
        // Return full profile
        const profileResponse = getUserProfileResponse(auth.userId, 10);

        if (!profileResponse) {
          const errorResponse: APIErrorResponse = {
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'Profile not found',
            },
          };
          return NextResponse.json(errorResponse, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json(profileResponse, { headers: corsHeaders });
      }

      // Return public profile for other users
      const publicProfile = getPublicProfile(userIdParam);

      if (!publicProfile) {
        const errorResponse: APIErrorResponse = {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
        return NextResponse.json(errorResponse, { status: 404, headers: corsHeaders });
      }

      return NextResponse.json(
        { profile: publicProfile, isPublic: true },
        { headers: corsHeaders }
      );
    }

    // No userId param - require authentication for own profile
    // Fall back to legacy x-user-id header for backwards compatibility
    let userId = auth?.userId;
    if (!userId) {
      const legacyUserId = request.headers.get('x-user-id');
      if (legacyUserId) {
        userId = legacyUserId;
      }
    }

    if (!userId) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please connect your wallet.',
        },
      };
      return NextResponse.json(errorResponse, { status: 401, headers: corsHeaders });
    }

    // Get full profile for authenticated user
    const profileResponse = getUserProfileResponse(userId, 10);

    if (!profileResponse) {
      // User is authenticated but profile doesn't exist yet
      // Create a minimal profile response
      const userRecord = getUserById(userId);

      if (!userRecord) {
        const errorResponse: APIErrorResponse = {
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profile not found. Please try reconnecting your wallet.',
          },
        };
        return NextResponse.json(errorResponse, { status: 404, headers: corsHeaders });
      }

      // Return basic profile from auth record
      const basicProfile: UserProfileResponse = {
        profile: {
          id: userRecord.id,
          walletAddress: userRecord.walletAddress,
          username: userRecord.displayName,
          avatarUrl: userRecord.avatarUrl,
          balance: userRecord.balance,
          createdAt: userRecord.createdAt.toISOString(),
          isDemo: userRecord.isDemo,
          stats: {
            totalBets: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalWagered: 0,
            totalPayout: 0,
            profit: 0,
            biggestWin: 0,
            biggestLoss: 0,
            currentStreak: 0,
            longestWinStreak: 0,
            longestLossStreak: 0,
            averageBetSize: 0,
            averageMultiplier: 0,
            profitByPeriod: {
              daily: 0,
              weekly: 0,
              monthly: 0,
            },
          },
        },
        recentBets: [],
      };

      return NextResponse.json(basicProfile, { headers: corsHeaders });
    }

    return NextResponse.json(profileResponse, { headers: corsHeaders });

  } catch (error) {
    console.error('[Profile API] Error:', error);

    const errorResponse: APIErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve profile data',
        details: error instanceof Error ? { message: error.message } : undefined,
      },
    };

    return NextResponse.json(errorResponse, { status: 500, headers: corsHeaders });
  }
}

// ============================================
// OPTIONS Handler (CORS)
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
