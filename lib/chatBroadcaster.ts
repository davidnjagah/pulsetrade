/**
 * PulseTrade Chat Broadcaster
 * Event emitter pattern for real-time chat message broadcasting
 *
 * Features:
 * - Subscribe/unsubscribe to chat events
 * - Broadcast messages to all subscribers
 * - Support for message and bet notification events
 * - Used by SSE endpoint to stream updates to clients
 */

import { ChatItem, ChatStreamEvent } from './types';

// ============================================
// Types
// ============================================

export type ChatEventCallback = (event: ChatStreamEvent) => void;

interface Subscriber {
  id: string;
  callback: ChatEventCallback;
  createdAt: Date;
}

// ============================================
// Broadcaster State
// ============================================

// Active subscribers: subscriberId -> Subscriber
const subscribers = new Map<string, Subscriber>();

// Counter for unique subscriber IDs
let subscriberCounter = 0;

// ============================================
// Subscriber Management
// ============================================

/**
 * Generate a unique subscriber ID
 */
function generateSubscriberId(): string {
  subscriberCounter++;
  return `sub_${Date.now()}_${subscriberCounter}`;
}

/**
 * Subscribe to chat events
 * @param callback - Function to call when events occur
 * @returns Unsubscribe function
 */
export function subscribe(callback: ChatEventCallback): () => void {
  const id = generateSubscriberId();

  const subscriber: Subscriber = {
    id,
    callback,
    createdAt: new Date(),
  };

  subscribers.set(id, subscriber);

  console.log(`[ChatBroadcaster] Subscriber added: ${id}. Total: ${subscribers.size}`);

  // Return unsubscribe function
  return () => {
    unsubscribe(id);
  };
}

/**
 * Unsubscribe from chat events
 * @param subscriberId - The subscriber ID to remove
 */
export function unsubscribe(subscriberId: string): boolean {
  const removed = subscribers.delete(subscriberId);

  if (removed) {
    console.log(`[ChatBroadcaster] Subscriber removed: ${subscriberId}. Total: ${subscribers.size}`);
  }

  return removed;
}

// ============================================
// Broadcasting
// ============================================

/**
 * Broadcast a chat item (message or notification) to all subscribers
 * @param item - The chat item to broadcast
 */
export function broadcast(item: ChatItem): void {
  const event: ChatStreamEvent = {
    type: item.type === 'bet_notification' ? 'bet_notification' : 'message',
    data: item,
    timestamp: Date.now(),
  };

  broadcastEvent(event);
}

/**
 * Broadcast a raw event to all subscribers
 * @param event - The event to broadcast
 */
export function broadcastEvent(event: ChatStreamEvent): void {
  const subscriberCount = subscribers.size;

  if (subscriberCount === 0) {
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  subscribers.forEach((subscriber) => {
    try {
      subscriber.callback(event);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`[ChatBroadcaster] Error broadcasting to ${subscriber.id}:`, error);
      // Remove subscriber on error (connection likely closed)
      subscribers.delete(subscriber.id);
    }
  });

  if (event.type !== 'heartbeat') {
    console.log(`[ChatBroadcaster] Broadcast ${event.type}: ${successCount} success, ${errorCount} errors`);
  }
}

/**
 * Broadcast a heartbeat to all subscribers
 * Used to keep SSE connections alive
 */
export function broadcastHeartbeat(): void {
  const event: ChatStreamEvent = {
    type: 'heartbeat',
    timestamp: Date.now(),
  };

  broadcastEvent(event);
}

/**
 * Send connected event to a specific subscriber
 * @param subscriberId - The subscriber to notify
 */
export function sendConnectedEvent(callback: ChatEventCallback): void {
  const event: ChatStreamEvent = {
    type: 'connected',
    timestamp: Date.now(),
  };

  try {
    callback(event);
  } catch (error) {
    console.error('[ChatBroadcaster] Error sending connected event:', error);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get number of active subscribers
 */
export function getSubscriberCount(): number {
  return subscribers.size;
}

/**
 * Get subscriber statistics
 */
export function getStats(): {
  subscriberCount: number;
  oldestSubscriber: Date | null;
  newestSubscriber: Date | null;
} {
  let oldest: Date | null = null;
  let newest: Date | null = null;

  subscribers.forEach((sub) => {
    if (!oldest || sub.createdAt < oldest) {
      oldest = sub.createdAt;
    }
    if (!newest || sub.createdAt > newest) {
      newest = sub.createdAt;
    }
  });

  return {
    subscriberCount: subscribers.size,
    oldestSubscriber: oldest,
    newestSubscriber: newest,
  };
}

/**
 * Clear all subscribers (for testing)
 */
export function clearAllSubscribers(): void {
  subscribers.clear();
  console.log('[ChatBroadcaster] Cleared all subscribers');
}

// ============================================
// Heartbeat Timer
// ============================================

let heartbeatTimer: NodeJS.Timeout | null = null;
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

/**
 * Start the heartbeat timer
 * Sends periodic heartbeats to keep SSE connections alive
 */
export function startHeartbeat(): void {
  if (heartbeatTimer) return;

  heartbeatTimer = setInterval(() => {
    if (subscribers.size > 0) {
      broadcastHeartbeat();
    }
  }, HEARTBEAT_INTERVAL_MS);

  console.log('[ChatBroadcaster] Heartbeat timer started (30s interval)');
}

/**
 * Stop the heartbeat timer
 */
export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.log('[ChatBroadcaster] Heartbeat timer stopped');
  }
}

// Start heartbeat on module load
startHeartbeat();

// ============================================
// Exports
// ============================================

export {
  HEARTBEAT_INTERVAL_MS,
};
