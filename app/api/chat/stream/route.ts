/**
 * PulseTrade Chat Stream API
 * SSE (Server-Sent Events) endpoint for real-time chat messages
 *
 * Route: GET /api/chat/stream
 *
 * Features:
 * - Real-time message streaming via SSE
 * - Broadcasts new messages as they arrive
 * - Includes bet notifications
 * - Heartbeat every 30 seconds to keep connection alive
 * - Connection event on initial connect
 *
 * Event types:
 * - connected: Initial connection established
 * - message: New chat message
 * - bet_notification: Bet placed/won/lost notification
 * - heartbeat: Keep-alive ping
 *
 * Note: This endpoint is PUBLIC - no authentication required to listen
 */

import { NextRequest } from 'next/server';
import { subscribe, sendConnectedEvent, getSubscriberCount } from '@/lib/chatBroadcaster';
import { ChatStreamEvent } from '@/lib/types';

// ============================================
// Configuration
// ============================================

// Runtime configuration for edge/nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// GET Handler (SSE Stream)
// ============================================

export async function GET(request: NextRequest): Promise<Response> {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE event
      const sendEvent = (event: ChatStreamEvent) => {
        try {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error('[Chat Stream] Error encoding event:', error);
        }
      };

      // Send connected event immediately
      sendConnectedEvent((event) => {
        sendEvent(event);
        console.log(`[Chat Stream] Client connected. Total subscribers: ${getSubscriberCount() + 1}`);
      });

      // Subscribe to chat events
      const unsubscribe = subscribe((event) => {
        sendEvent(event);
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('[Chat Stream] Client disconnected');
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
      });
    },

    cancel() {
      console.log('[Chat Stream] Stream cancelled');
    },
  });

  // Return SSE response with appropriate headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ============================================
// OPTIONS Handler (CORS preflight)
// ============================================

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
