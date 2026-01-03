/**
 * PulseTrade Bet Resolution API
 * POST /api/bets/resolve - Resolve a bet (internal use)
 *
 * This endpoint is intended for internal use by the system
 * to resolve bets when the target time is reached.
 * In production, this would be protected with an API key.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  BetResolveRequest,
  BetResolveResponse,
  APIErrorResponse,
} from '@/lib/types';
import { resolveBetManually, getBet, expireBet } from '@/lib/betService';

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
// Internal API Key Check
// ============================================

/**
 * Verify the request is authorized (internal use only)
 * In production, this would check for a valid API key
 */
function isAuthorized(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const internalKey = process.env.INTERNAL_API_KEY;

  // For development, allow requests without key
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // In production, require API key
  if (!internalKey) {
    console.warn('INTERNAL_API_KEY not set - allowing request');
    return true;
  }

  return apiKey === internalKey;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return errorResponse(
        'UNAUTHORIZED',
        'Invalid or missing API key',
        401
      );
    }

    // Parse request body
    let body: BetResolveRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        'INVALID_JSON',
        'Request body must be valid JSON',
        400
      );
    }

    const { betId, actualPrice, resolvedAt } = body;

    // Validate required fields
    if (!betId) {
      return errorResponse(
        'MISSING_BET_ID',
        'Bet ID is required',
        400
      );
    }

    if (actualPrice === undefined || actualPrice === null) {
      return errorResponse(
        'MISSING_ACTUAL_PRICE',
        'Actual price is required',
        400
      );
    }

    if (typeof actualPrice !== 'number' || isNaN(actualPrice) || actualPrice <= 0) {
      return errorResponse(
        'INVALID_ACTUAL_PRICE',
        'Actual price must be a positive number',
        400
      );
    }

    // Check if bet exists
    const bet = getBet(betId);
    if (!bet) {
      return errorResponse(
        'BET_NOT_FOUND',
        `Bet with ID ${betId} not found`,
        404
      );
    }

    // Check if bet is already resolved
    if (bet.status !== 'active') {
      return errorResponse(
        'BET_ALREADY_RESOLVED',
        `Bet is already ${bet.status}`,
        400,
        { currentStatus: bet.status }
      );
    }

    // Resolve the bet
    const response = await resolveBetManually({
      betId,
      actualPrice,
      resolvedAt: resolvedAt || new Date().toISOString(),
    });

    // Return success response with resolution details
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Handle known errors
    if (message.includes('not found')) {
      return errorResponse('BET_NOT_FOUND', message, 404);
    }

    if (message.includes('already resolved')) {
      return errorResponse('BET_ALREADY_RESOLVED', message, 400);
    }

    // Generic error
    console.error('Bet resolution error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to resolve bet',
      500
    );
  }
}

// ============================================
// Additional Handlers
// ============================================

/**
 * PUT /api/bets/resolve - Batch resolve multiple bets
 */
export async function PUT(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return errorResponse('UNAUTHORIZED', 'Invalid or missing API key', 401);
    }

    const body = await request.json();
    const { bets } = body as { bets: BetResolveRequest[] };

    if (!Array.isArray(bets) || bets.length === 0) {
      return errorResponse(
        'INVALID_BETS',
        'Bets array is required and must not be empty',
        400
      );
    }

    // Limit batch size
    if (bets.length > 100) {
      return errorResponse(
        'BATCH_TOO_LARGE',
        'Maximum 100 bets per batch',
        400
      );
    }

    const results: Array<BetResolveResponse | { betId: string; error: string }> = [];

    for (const betRequest of bets) {
      try {
        const result = await resolveBetManually(betRequest);
        results.push(result);
      } catch (error) {
        results.push({
          betId: betRequest.betId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(
      {
        processed: results.length,
        results,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Batch resolution error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to process batch', 500);
  }
}

/**
 * DELETE /api/bets/resolve - Cancel/expire a bet
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return errorResponse('UNAUTHORIZED', 'Invalid or missing API key', 401);
    }

    const { searchParams } = new URL(request.url);
    const betId = searchParams.get('betId');

    if (!betId) {
      return errorResponse('MISSING_BET_ID', 'Bet ID is required', 400);
    }

    const bet = getBet(betId);
    if (!bet) {
      return errorResponse('BET_NOT_FOUND', `Bet with ID ${betId} not found`, 404);
    }

    if (bet.status !== 'active') {
      return errorResponse(
        'BET_ALREADY_RESOLVED',
        `Cannot cancel bet that is ${bet.status}`,
        400
      );
    }

    const expiredBet = expireBet(betId);

    return NextResponse.json(
      {
        success: true,
        message: 'Bet cancelled and amount refunded',
        betId,
        refundedAmount: bet.amount,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Bet cancellation error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to cancel bet', 500);
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
      'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * POST /api/bets/resolve
 *
 * Resolve a single bet (internal use).
 *
 * Headers:
 * - x-api-key: Internal API key (required in production)
 *
 * Request Body:
 * {
 *   "betId": "bet_123...",
 *   "actualPrice": 205.50,
 *   "resolvedAt": "2026-01-03T18:00:00Z" (optional)
 * }
 *
 * Response (200):
 * {
 *   "id": "bet_123...",
 *   "status": "won" | "lost",
 *   "payout": 23.275,
 *   "platformFee": 1.225
 * }
 *
 * PUT /api/bets/resolve
 *
 * Batch resolve multiple bets.
 *
 * Request Body:
 * {
 *   "bets": [
 *     { "betId": "...", "actualPrice": 205.50 },
 *     { "betId": "...", "actualPrice": 198.30 }
 *   ]
 * }
 *
 * DELETE /api/bets/resolve?betId=...
 *
 * Cancel/expire a bet and refund the amount.
 */
