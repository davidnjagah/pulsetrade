/**
 * PulseTrade Bet Placement API
 * POST /api/bets/place - Place a new bet
 *
 * Validates bet parameters, checks balance, calculates multiplier,
 * and creates a new active bet.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  BetPlaceRequest,
  BetPlaceResponse,
  APIErrorResponse,
  BETTING_LIMITS,
} from '@/lib/types';
import { placeBet, getUser, DEFAULT_USER_ID } from '@/lib/betService';

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
// Mock Current Price (for demo)
// ============================================

/**
 * Get current price from price feed
 * In production, this would call the price service
 */
async function getCurrentPrice(): Promise<number> {
  try {
    // Try to get from price feed API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/price-feed`);
    if (response.ok) {
      const data = await response.json();
      return data.price;
    }
  } catch {
    // Fall back to mock price
  }

  // Mock price for development
  return 200 + (Math.random() - 0.5) * 10;
}

// ============================================
// Rate Limiting (Simple in-memory)
// ============================================

const rateLimitMap = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(userId) || 0;

  if (now - lastRequest < BETTING_LIMITS.COOLDOWN_MS) {
    return false;
  }

  rateLimitMap.set(userId, now);
  return true;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: BetPlaceRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        'INVALID_JSON',
        'Request body must be valid JSON',
        400
      );
    }

    // Extract user ID from header (mock auth) or use default
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID;

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return errorResponse(
        'RATE_LIMITED',
        `Please wait ${BETTING_LIMITS.COOLDOWN_MS}ms between bets`,
        429,
        { cooldownMs: BETTING_LIMITS.COOLDOWN_MS }
      );
    }

    // Validate required fields
    const { amount, targetPrice, targetTime, priceAtPlacement } = body;

    if (amount === undefined || amount === null) {
      return errorResponse(
        'MISSING_AMOUNT',
        'Amount is required',
        400
      );
    }

    if (targetPrice === undefined || targetPrice === null) {
      return errorResponse(
        'MISSING_TARGET_PRICE',
        'Target price is required',
        400
      );
    }

    if (!targetTime) {
      return errorResponse(
        'MISSING_TARGET_TIME',
        'Target time is required (ISO 8601 format)',
        400
      );
    }

    if (priceAtPlacement === undefined || priceAtPlacement === null) {
      return errorResponse(
        'MISSING_PRICE_AT_PLACEMENT',
        'Price at placement is required for slippage check',
        400
      );
    }

    // Get current market price for validation
    const currentPrice = await getCurrentPrice();

    // Place the bet
    const response = await placeBet(userId, body, currentPrice);

    // Return success response
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    // Handle known error types
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Map error messages to appropriate codes and status codes
    if (message.includes('Insufficient balance')) {
      return errorResponse('INSUFFICIENT_BALANCE', message, 402);
    }

    if (message.includes('Please wait')) {
      return errorResponse('RATE_LIMITED', message, 429);
    }

    if (message.includes('Maximum active bets')) {
      return errorResponse('MAX_BETS_REACHED', message, 400);
    }

    if (message.includes('Target time')) {
      return errorResponse('INVALID_TARGET_TIME', message, 400);
    }

    if (message.includes('Target price')) {
      return errorResponse('INVALID_TARGET_PRICE', message, 400);
    }

    if (message.includes('payout exceeds')) {
      return errorResponse('PAYOUT_LIMIT_EXCEEDED', message, 400);
    }

    if (message.includes('Minimum bet') || message.includes('Maximum bet')) {
      return errorResponse('INVALID_AMOUNT', message, 400);
    }

    // Generic error
    console.error('Bet placement error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to place bet. Please try again.',
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
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * POST /api/bets/place
 *
 * Place a new bet on price movement.
 *
 * Request Body:
 * {
 *   "amount": 10,               // Bet amount (1-100)
 *   "targetPrice": 205.50,      // Target price to hit
 *   "targetTime": "ISO8601",    // When to check price
 *   "priceAtPlacement": 200.25  // Current price for slippage check
 * }
 *
 * Response (200):
 * {
 *   "id": "bet_123...",
 *   "amount": 10,
 *   "targetPrice": 205.50,
 *   "targetTime": "2026-01-03T18:00:00Z",
 *   "multiplier": 2.45,
 *   "priceAtPlacement": 200.25,
 *   "placedAt": "2026-01-03T17:55:00Z",
 *   "status": "active",
 *   "potentialPayout": 24.50
 * }
 *
 * Error Responses:
 * - 400: Invalid parameters (amount, price, time)
 * - 402: Insufficient balance
 * - 429: Rate limited (cooldown)
 * - 500: Internal server error
 */
