/**
 * PulseTrade Chat Messages API
 * GET endpoint to retrieve recent chat messages
 *
 * Route: GET /api/chat/messages
 *
 * Query params:
 * - limit: Number of messages (default: 50, max: 100)
 * - before: Cursor for pagination (message ID to get messages before)
 *
 * Returns:
 * - messages: Array of chat messages/notifications with user info
 * - cursor: Cursor for next page (if more messages available)
 * - hasMore: Boolean indicating if more messages exist
 *
 * Note: This endpoint is PUBLIC - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMessages, getRecentBetNotifications, getChatStats, seedChatWithSampleMessages } from '@/lib/chatService';
import { ChatMessagesResponse, APIErrorResponse } from '@/lib/types';

// ============================================
// Configuration
// ============================================

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse<ChatMessagesResponse | APIErrorResponse>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const before = searchParams.get('before') || undefined;
    const mode = searchParams.get('mode');

    // Parse and validate limit
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_LIMIT',
              message: 'Limit must be a positive integer',
            },
          },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, MAX_LIMIT);
    }

    // Handle different modes
    if (mode === 'notifications') {
      // Return only bet notifications
      const notifications = getRecentBetNotifications(limit);
      return NextResponse.json({
        messages: notifications,
        hasMore: false,
      });
    }

    if (mode === 'stats') {
      // Return chat statistics
      const stats = getChatStats();
      return NextResponse.json(stats as unknown as ChatMessagesResponse);
    }

    if (mode === 'seed') {
      // Seed sample data (for demo/development)
      seedChatWithSampleMessages();
      const response = getMessages(limit);
      return NextResponse.json(response);
    }

    // Get messages with pagination
    const response = getMessages(limit, before);

    // Add CORS headers for cross-origin requests
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('[Chat Messages API] Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve messages',
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
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');

  return new NextResponse(null, { status: 204, headers });
}
