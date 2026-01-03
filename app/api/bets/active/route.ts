/**
 * PulseTrade Active Bets API
 * GET /api/bets/active - Get user's active bets
 *
 * Returns all active (unresolved) bets for a user along with
 * total exposure calculation.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ActiveBetsResponse,
  Bet,
  APIErrorResponse,
} from '@/lib/types';
import {
  getActiveBets,
  getAllBets,
  getRecentResolvedBets,
  getBetStats,
  DEFAULT_USER_ID,
} from '@/lib/betService';

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
// Serialization
// ============================================

/**
 * Serialize bet for JSON response (convert dates to ISO strings)
 */
function serializeBet(bet: Bet) {
  return {
    ...bet,
    targetTime: bet.targetTime.toISOString(),
    placedAt: bet.placedAt.toISOString(),
    resolvedAt: bet.resolvedAt?.toISOString() || null,
  };
}

// ============================================
// Extended Response Types
// ============================================

interface ExtendedActiveBetsResponse {
  bets: ReturnType<typeof serializeBet>[];
  totalExposure: number;
  totalPotentialPayout: number;
  count: number;
}

interface BetsHistoryResponse {
  bets: ReturnType<typeof serializeBet>[];
  total: number;
  page: number;
  limit: number;
}

interface BetStatsResponse {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalWagered: number;
  totalPayout: number;
  profit: number;
  activeBetsAmount: number;
}

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'active';

    // Extract user ID from header (mock auth) or use default
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID;

    switch (mode) {
      case 'active':
        return handleActiveRequest(userId);

      case 'history':
        return handleHistoryRequest(userId, searchParams);

      case 'recent':
        return handleRecentRequest(userId, searchParams);

      case 'stats':
        return handleStatsRequest(userId);

      default:
        return errorResponse(
          'INVALID_MODE',
          'Mode must be one of: active, history, recent, stats',
          400
        );
    }
  } catch (error) {
    console.error('Active bets error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch bets',
      500
    );
  }
}

/**
 * Handle active bets request
 */
function handleActiveRequest(
  userId: string
): NextResponse<ExtendedActiveBetsResponse | APIErrorResponse> {
  const result = getActiveBets(userId);

  // Calculate total potential payout
  let totalPotentialPayout = 0;
  result.bets.forEach((bet) => {
    totalPotentialPayout += bet.amount * bet.multiplier;
  });

  const response: ExtendedActiveBetsResponse = {
    bets: result.bets.map(serializeBet),
    totalExposure: result.totalExposure,
    totalPotentialPayout: Math.round(totalPotentialPayout * 100) / 100,
    count: result.bets.length,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Handle bet history request (all bets including resolved)
 */
function handleHistoryRequest(
  userId: string,
  searchParams: URLSearchParams
): NextResponse<BetsHistoryResponse | APIErrorResponse> {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const status = searchParams.get('status'); // active, won, lost, expired, or null for all

  let bets = getAllBets(userId);

  // Filter by status if provided
  if (status) {
    bets = bets.filter((bet) => bet.status === status);
  }

  const total = bets.length;

  // Paginate
  const startIndex = (page - 1) * limit;
  const paginatedBets = bets.slice(startIndex, startIndex + limit);

  const response: BetsHistoryResponse = {
    bets: paginatedBets.map(serializeBet),
    total,
    page,
    limit,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Handle recent resolved bets request
 */
function handleRecentRequest(
  userId: string,
  searchParams: URLSearchParams
): NextResponse<{ bets: ReturnType<typeof serializeBet>[] } | APIErrorResponse> {
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  const recentBets = getRecentResolvedBets(userId, limit);

  return NextResponse.json(
    { bets: recentBets.map(serializeBet) },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

/**
 * Handle bet statistics request
 */
function handleStatsRequest(
  userId: string
): NextResponse<BetStatsResponse | APIErrorResponse> {
  const stats = getBetStats(userId);

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
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
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * GET /api/bets/active
 *
 * Get user's active bets.
 *
 * Query Parameters:
 * - mode: "active" (default) | "history" | "recent" | "stats"
 * - page: Page number for history mode (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status for history mode (active, won, lost, expired)
 *
 * Headers:
 * - x-user-id: User identifier (optional, defaults to demo user)
 *
 * Response (mode=active, 200):
 * {
 *   "bets": [...],
 *   "totalExposure": 50,
 *   "totalPotentialPayout": 122.50,
 *   "count": 5
 * }
 *
 * Response (mode=history, 200):
 * {
 *   "bets": [...],
 *   "total": 100,
 *   "page": 1,
 *   "limit": 20
 * }
 *
 * Response (mode=stats, 200):
 * {
 *   "totalBets": 100,
 *   "wins": 40,
 *   "losses": 55,
 *   "winRate": 0.42,
 *   "totalWagered": 500,
 *   "totalPayout": 480,
 *   "profit": -20,
 *   "activeBetsAmount": 25
 * }
 */
