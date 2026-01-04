/**
 * PulseTrade Profile Stats API
 * GET /api/profile/stats - Get detailed user statistics
 *
 * Features:
 * - Requires authentication
 * - Returns detailed stats breakdown
 * - Win rate, profit by period
 * - Best and worst bet information
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  UserStats,
  APIErrorResponse,
} from '@/lib/types';
import {
  getUserStats,
  getBestWorstBets,
} from '@/lib/profileService';
import { getAuth } from '@/lib/authMiddleware';
import { getUserRank } from '@/lib/leaderboardService';

// ============================================
// Types
// ============================================

interface StatsResponse {
  stats: UserStats;
  rank: {
    daily: number | null;
    weekly: number | null;
    alltime: number | null;
  };
  bestBet: {
    id: string;
    profit: number;
    multiplier: number;
    amount: number;
    placedAt: string;
  } | null;
  worstBet: {
    id: string;
    loss: number;
    multiplier: number;
    amount: number;
    placedAt: string;
  } | null;
}

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
    // Require authentication
    // Fall back to legacy x-user-id header for backwards compatibility
    const auth = getAuth(request);
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

    // Get user stats
    const stats = getUserStats(userId);

    if (!stats) {
      // User has no stats yet - return empty stats
      const emptyStats: UserStats = {
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
      };

      const response: StatsResponse = {
        stats: emptyStats,
        rank: {
          daily: null,
          weekly: null,
          alltime: null,
        },
        bestBet: null,
        worstBet: null,
      };

      return NextResponse.json(response, { headers: corsHeaders });
    }

    // Get ranks for each period
    const dailyRank = getUserRank(userId, 'daily');
    const weeklyRank = getUserRank(userId, 'weekly');
    const alltimeRank = getUserRank(userId, 'alltime');

    // Get best and worst bets
    const { bestBet, worstBet } = getBestWorstBets(userId);

    // Build response
    const response: StatsResponse = {
      stats,
      rank: {
        daily: dailyRank?.rank || null,
        weekly: weeklyRank?.rank || null,
        alltime: alltimeRank?.rank || null,
      },
      bestBet: bestBet ? {
        id: bestBet.id,
        profit: bestBet.profit,
        multiplier: bestBet.multiplier,
        amount: bestBet.amount,
        placedAt: bestBet.placedAt,
      } : null,
      worstBet: worstBet ? {
        id: worstBet.id,
        loss: Math.abs(worstBet.profit),
        multiplier: worstBet.multiplier,
        amount: worstBet.amount,
        placedAt: worstBet.placedAt,
      } : null,
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('[Profile Stats API] Error:', error);

    const errorResponse: APIErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve statistics',
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
