/**
 * PulseTrade Leaderboard API
 * GET /api/leaderboard - Get leaderboard rankings
 *
 * Query Parameters:
 * - period: 'daily' | 'weekly' | 'alltime' (default: 'alltime')
 * - limit: number (default: 100, max: 500)
 * - refresh: 'true' to force cache refresh
 *
 * Features:
 * - Returns ranked users with stats
 * - Includes requesting user's rank if authenticated
 * - Supports multiple time periods
 * - Cached with 60 second refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  LeaderboardResponse,
  LeaderboardPeriod,
  APIErrorResponse,
} from '@/lib/types';
import {
  getLeaderboard,
  getUserRank,
  getLeaderboardStats,
  seedLeaderboardData,
} from '@/lib/leaderboardService';
import { getAuth } from '@/lib/authMiddleware';

// ============================================
// Configuration
// ============================================

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const VALID_PERIODS: LeaderboardPeriod[] = ['daily', 'weekly', 'alltime'];

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

    // Parse query parameters
    const periodParam = searchParams.get('period') || 'alltime';
    const limitParam = searchParams.get('limit');
    const refreshParam = searchParams.get('refresh');
    const modeParam = searchParams.get('mode');

    // Handle special modes
    if (modeParam === 'stats') {
      // Return leaderboard service statistics
      const stats = getLeaderboardStats();
      return NextResponse.json(stats, { headers: corsHeaders });
    }

    if (modeParam === 'seed') {
      // Seed mock data (for demo)
      seedLeaderboardData();
      return NextResponse.json(
        { success: true, message: 'Leaderboard data seeded' },
        { headers: corsHeaders }
      );
    }

    // Validate period
    if (!VALID_PERIODS.includes(periodParam as LeaderboardPeriod)) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'INVALID_PERIOD',
          message: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}`,
          details: {
            provided: periodParam,
            valid: VALID_PERIODS,
          },
        },
      };
      return NextResponse.json(errorResponse, { status: 400, headers: corsHeaders });
    }

    const period = periodParam as LeaderboardPeriod;

    // Parse and validate limit
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        const errorResponse: APIErrorResponse = {
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be a positive integer',
            details: { provided: limitParam },
          },
        };
        return NextResponse.json(errorResponse, { status: 400, headers: corsHeaders });
      }
      limit = Math.min(parsedLimit, MAX_LIMIT);
    }

    // Check for force refresh
    const forceRefresh = refreshParam === 'true';

    // Get the leaderboard
    const leaderboardData = getLeaderboard(period, limit, forceRefresh);

    // Check if user is authenticated to include their rank
    const auth = getAuth(request);
    let userRank = null;

    if (auth) {
      // Find user's rank in the leaderboard
      userRank = getUserRank(auth.userId, period);

      // If user not in leaderboard, try to calculate their rank
      if (!userRank) {
        // User hasn't placed any bets in this period
        // Return null rank (they're not on the leaderboard)
      }
    }

    // Build response
    const response: LeaderboardResponse = {
      ...leaderboardData,
      userRank,
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('[Leaderboard API] Error:', error);

    const errorResponse: APIErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve leaderboard data',
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
