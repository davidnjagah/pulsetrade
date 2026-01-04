/**
 * PulseTrade Profile History API
 * GET /api/profile/history - Get paginated bet history
 *
 * Query Parameters:
 * - limit: number (default: 10, max: 100)
 * - offset: number (default: 0)
 * - status: 'all' | 'won' | 'lost' | 'active' (optional filter)
 *
 * Features:
 * - Requires authentication
 * - Returns paginated bet history
 * - Supports status filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  BetHistoryResponse,
  BetHistoryItem,
  BetStatus,
  APIErrorResponse,
} from '@/lib/types';
import {
  getBetHistory,
  DEFAULT_HISTORY_LIMIT,
  MAX_HISTORY_LIMIT,
} from '@/lib/profileService';
import { getAuth } from '@/lib/authMiddleware';

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

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const statusParam = searchParams.get('status');

    // Parse and validate limit
    let limit = DEFAULT_HISTORY_LIMIT;
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
      limit = Math.min(parsedLimit, MAX_HISTORY_LIMIT);
    }

    // Parse and validate offset
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        const errorResponse: APIErrorResponse = {
          error: {
            code: 'INVALID_OFFSET',
            message: 'Offset must be a non-negative integer',
            details: { provided: offsetParam },
          },
        };
        return NextResponse.json(errorResponse, { status: 400, headers: corsHeaders });
      }
      offset = parsedOffset;
    }

    // Validate status filter
    const validStatuses: (BetStatus | 'all')[] = ['all', 'won', 'lost', 'active', 'expired'];
    if (statusParam && !validStatuses.includes(statusParam as BetStatus | 'all')) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'INVALID_STATUS',
          message: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}`,
          details: { provided: statusParam, valid: validStatuses },
        },
      };
      return NextResponse.json(errorResponse, { status: 400, headers: corsHeaders });
    }

    // Get bet history
    const historyResponse = getBetHistory(userId, limit, offset);

    // Apply status filter if provided
    let filteredHistory = historyResponse.history;
    if (statusParam && statusParam !== 'all') {
      filteredHistory = historyResponse.history.filter(
        (bet: BetHistoryItem) => bet.status === statusParam
      );
    }

    // Calculate summary stats for the current page
    const pageSummary = {
      totalOnPage: filteredHistory.length,
      winsOnPage: filteredHistory.filter((b: BetHistoryItem) => b.status === 'won').length,
      lossesOnPage: filteredHistory.filter((b: BetHistoryItem) => b.status === 'lost').length,
      profitOnPage: filteredHistory.reduce(
        (sum: number, b: BetHistoryItem) => sum + b.profit,
        0
      ),
    };

    // Build response
    const response: BetHistoryResponse & { summary: typeof pageSummary } = {
      history: filteredHistory,
      total: historyResponse.total,
      limit,
      offset,
      hasMore: historyResponse.hasMore,
      summary: {
        ...pageSummary,
        profitOnPage: Math.round(pageSummary.profitOnPage * 100) / 100,
      },
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('[Profile History API] Error:', error);

    const errorResponse: APIErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve bet history',
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
