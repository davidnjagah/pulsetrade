/**
 * PulseTrade Wallet Connection API
 * POST /api/auth/connect - Connect wallet and create session
 *
 * Handles wallet connection for Phantom, Solflare, and demo mode.
 * Creates or retrieves user by wallet address and initializes session.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AuthConnectRequest,
  AuthConnectResponse,
  APIErrorResponse,
  WalletType,
} from '@/lib/types';
import {
  createSession,
  getUserByWallet,
  getUserById,
} from '@/lib/authService';
import { getUser as getBetServiceUser } from '@/lib/betService';

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
// Validation
// ============================================

const VALID_WALLET_TYPES: WalletType[] = ['phantom', 'solflare', 'demo'];

function isValidWalletAddress(address: string, walletType: WalletType): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Trim and check length
  const trimmed = address.trim();

  if (walletType === 'demo') {
    // Demo addresses can be any non-empty string
    return trimmed.length >= 1;
  }

  // Solana addresses are base58 encoded and typically 32-44 characters
  // We'll be lenient for development
  if (trimmed.length < 20 || trimmed.length > 50) {
    return false;
  }

  // Basic base58 check (Solana addresses don't contain 0, O, I, l)
  // But we'll be lenient for demo purposes
  return true;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: AuthConnectRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse(
        'INVALID_JSON',
        'Request body must be valid JSON',
        400
      );
    }

    const { walletAddress, walletType, signature } = body;

    // Validate wallet type
    if (!walletType || !VALID_WALLET_TYPES.includes(walletType)) {
      return errorResponse(
        'INVALID_WALLET_TYPE',
        `Wallet type must be one of: ${VALID_WALLET_TYPES.join(', ')}`,
        400,
        { validTypes: VALID_WALLET_TYPES }
      );
    }

    // Validate wallet address
    if (!walletAddress) {
      return errorResponse(
        'MISSING_WALLET_ADDRESS',
        'Wallet address is required',
        400
      );
    }

    if (!isValidWalletAddress(walletAddress, walletType)) {
      return errorResponse(
        'INVALID_WALLET_ADDRESS',
        'Invalid wallet address format',
        400
      );
    }

    // TODO: In production, verify signature for non-demo wallets
    // For now, we skip signature verification for demo mode
    if (walletType !== 'demo' && signature) {
      // Signature verification would go here
      // This would typically verify that the wallet owns this address
      console.log(`[Auth] Signature provided for ${walletType} wallet (verification skipped in demo)`);
    }

    // Check if user already exists
    const existingUser = getUserByWallet(walletAddress);
    const isNewUser = !existingUser;

    // Create session (this also creates user if new)
    const session = createSession(walletAddress, walletType, signature);

    // Get user data
    const user = getUserById(session.userId);

    if (!user) {
      return errorResponse(
        'USER_CREATION_FAILED',
        'Failed to create or retrieve user',
        500
      );
    }

    // Sync with betService for balance tracking
    // This ensures the betService has the user with the correct initial balance
    const betServiceUser = getBetServiceUser(session.userId);

    // Use betService balance as source of truth (for demo continuity)
    const balance = betServiceUser.balance;

    // Build response
    const response: AuthConnectResponse = {
      success: true,
      sessionToken: session.id,
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: user.displayName || `User_${walletAddress.slice(0, 6)}`,
        avatarUrl: user.avatarUrl,
        balance,
        isDemo: user.isDemo,
        isNewUser,
      },
    };

    // Set session cookie for browser-based auth
    const cookieValue = `pulsetrade_session=${session.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`;

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Set-Cookie': cookieValue,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Auth connect error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to connect wallet',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================
// API Documentation
// ============================================

/**
 * POST /api/auth/connect
 *
 * Connect a wallet and create a new session.
 *
 * Request Body:
 * {
 *   "walletAddress": "DemoWallet123...",    // Wallet public key
 *   "walletType": "phantom" | "solflare" | "demo",
 *   "signature": "optional_signature"       // Wallet signature (optional)
 * }
 *
 * Response (200):
 * {
 *   "success": true,
 *   "sessionToken": "pts_123abc...",
 *   "expiresAt": "2026-01-04T12:00:00Z",
 *   "user": {
 *     "id": "user_demo1234_abc",
 *     "walletAddress": "demowallet123...",
 *     "displayName": "Demo User",
 *     "avatarUrl": null,
 *     "balance": 10000,
 *     "isDemo": true,
 *     "isNewUser": true
 *   }
 * }
 *
 * Error Responses:
 * - 400: Invalid wallet type or address
 * - 500: Internal server error
 *
 * Notes:
 * - New users receive $10,000 initial balance
 * - Session token valid for 24 hours
 * - Session cookie set automatically for browser use
 */
