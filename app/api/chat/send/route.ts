/**
 * PulseTrade Chat Send API
 * POST endpoint to send a chat message
 *
 * Route: POST /api/chat/send
 *
 * Request body:
 * - message: string (required, max 200 chars)
 *
 * Headers:
 * - Authorization: Bearer <sessionToken> (required)
 *
 * Returns:
 * - success: boolean
 * - message: The created message object
 *
 * Errors:
 * - 400: Message too long (max 200 chars) or missing
 * - 401: Authentication required
 * - 429: Rate limited (1 message per 2 seconds)
 */

import { NextRequest, NextResponse } from 'next/server';
import { addMessage, validateMessage, checkRateLimit, MAX_MESSAGE_LENGTH } from '@/lib/chatService';
import { getAuth } from '@/lib/authMiddleware';
import { getUserById } from '@/lib/authService';
import { ChatSendRequest, SendMessageResponse, APIErrorResponse, ChatMessage } from '@/lib/types';

// ============================================
// POST Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<SendMessageResponse | APIErrorResponse>> {
  try {
    // Check authentication
    const auth = getAuth(request);

    if (!auth) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Please connect your wallet.',
          },
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: ChatSendRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Validate message exists
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_MESSAGE',
            message: 'Message text is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate message content
    const messageValidation = validateMessage(body.message);
    if (!messageValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: messageValidation.errorCode || 'INVALID_MESSAGE',
            message: messageValidation.error || 'Invalid message',
            details: {
              maxLength: MAX_MESSAGE_LENGTH,
              actualLength: body.message.length,
            },
          },
        },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitValidation = checkRateLimit(auth.userId);
    if (!rateLimitValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: rateLimitValidation.errorCode || 'RATE_LIMITED',
            message: rateLimitValidation.error || 'Too many messages',
          },
        },
        { status: 429 }
      );
    }

    // Get user info for display name
    const user = getUserById(auth.userId);
    const username = user?.displayName || `User_${auth.walletAddress.slice(0, 6)}`;
    const avatarUrl = user?.avatarUrl || null;

    // Add the message
    const result = addMessage(auth.userId, body.message, username, avatarUrl);

    // Check if result is an error (MessageValidation) or success (ChatMessage)
    if ('valid' in result && !result.valid) {
      // This shouldn't happen since we validated above, but handle gracefully
      const errorCode = result.errorCode || 'MESSAGE_FAILED';
      const statusCode = errorCode === 'RATE_LIMITED' ? 429 : 400;

      return NextResponse.json(
        {
          error: {
            code: errorCode,
            message: result.error || 'Failed to send message',
          },
        },
        { status: statusCode }
      );
    }

    // Success - result is ChatMessage
    const message = result as ChatMessage;

    console.log(`[Chat Send API] Message from ${username}: "${body.message.slice(0, 30)}..."`);

    // Add CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { headers }
    );

  } catch (error) {
    console.error('[Chat Send API] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send message',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONS Handler (CORS preflight)
// ============================================

export async function OPTIONS(): Promise<NextResponse> {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return new NextResponse(null, { status: 204, headers });
}
