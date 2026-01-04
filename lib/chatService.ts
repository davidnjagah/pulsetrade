/**
 * PulseTrade Chat Service
 * In-memory chat message storage and management
 *
 * Features:
 * - In-memory message storage (last 100 messages)
 * - addMessage(userId, text) function
 * - getMessages(limit, before) function with pagination
 * - addBetNotification(userId, betData) function
 * - Rate limiting (1 message per 2 seconds per user)
 * - Message validation (max 200 chars)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ChatMessage,
  BetNotification,
  ChatItem,
  ChatMessagesResponse,
} from './types';
import { getUserById } from './authService';
import { broadcast } from './chatBroadcaster';

// ============================================
// Configuration
// ============================================

const MAX_MESSAGES = 100; // Maximum messages to store in memory
const MAX_MESSAGE_LENGTH = 200; // Maximum characters per message
const RATE_LIMIT_MS = 2000; // 1 message per 2 seconds per user

// ============================================
// In-Memory Storage
// ============================================

// Chat items storage (messages + notifications)
const chatItems: ChatItem[] = [];

// Rate limit tracking: userId -> lastMessageTimestamp
const rateLimitMap = new Map<string, number>();

// ============================================
// Validation
// ============================================

export interface MessageValidation {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Validate message text
 */
export function validateMessage(text: string): MessageValidation {
  if (!text || typeof text !== 'string') {
    return {
      valid: false,
      error: 'Message text is required',
      errorCode: 'MISSING_MESSAGE',
    };
  }

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return {
      valid: false,
      error: 'Message cannot be empty',
      errorCode: 'EMPTY_MESSAGE',
    };
  }

  if (trimmedText.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed`,
      errorCode: 'MESSAGE_TOO_LONG',
    };
  }

  return { valid: true };
}

/**
 * Check rate limit for a user
 */
export function checkRateLimit(userId: string): MessageValidation {
  const now = Date.now();
  const lastMessageTime = rateLimitMap.get(userId);

  if (lastMessageTime) {
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastMessage) / 1000);
      return {
        valid: false,
        error: `Please wait ${waitTime} second(s) before sending another message`,
        errorCode: 'RATE_LIMITED',
      };
    }
  }

  return { valid: true };
}

/**
 * Update rate limit timestamp for a user
 */
function updateRateLimit(userId: string): void {
  rateLimitMap.set(userId, Date.now());
}

// ============================================
// Message Management
// ============================================

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${uuidv4().slice(0, 8)}`;
}

/**
 * Generate a unique notification ID
 */
function generateNotificationId(): string {
  return `notif_${Date.now()}_${uuidv4().slice(0, 8)}`;
}

/**
 * Add a new chat message
 * @param userId - The user's ID
 * @param text - The message text
 * @param username - Optional username (will lookup from authService if not provided)
 * @param avatarUrl - Optional avatar URL
 * @returns The created message or error
 */
export function addMessage(
  userId: string,
  text: string,
  username?: string,
  avatarUrl?: string | null
): ChatMessage | MessageValidation {
  // Validate message text
  const textValidation = validateMessage(text);
  if (!textValidation.valid) {
    return textValidation;
  }

  // Check rate limit
  const rateLimitValidation = checkRateLimit(userId);
  if (!rateLimitValidation.valid) {
    return rateLimitValidation;
  }

  // Get user info if not provided
  let displayName = username;
  let userAvatar = avatarUrl;

  if (!displayName) {
    const user = getUserById(userId);
    if (user) {
      displayName = user.displayName || `User_${userId.slice(0, 6)}`;
      userAvatar = user.avatarUrl || null;
    } else {
      displayName = `User_${userId.slice(0, 6)}`;
    }
  }

  // Create the message
  const message: ChatMessage = {
    id: generateMessageId(),
    userId,
    username: displayName,
    avatarUrl: userAvatar ?? null,
    message: text.trim(),
    type: 'message',
    createdAt: new Date(),
  };

  // Add to storage
  chatItems.push(message);

  // Trim to max messages if needed
  while (chatItems.length > MAX_MESSAGES) {
    chatItems.shift();
  }

  // Update rate limit
  updateRateLimit(userId);

  // Broadcast to subscribers
  broadcast(message);

  console.log(`[ChatService] Message added from ${displayName}: "${text.slice(0, 30)}..."`);

  return message;
}

/**
 * Add a bet notification to chat
 * @param userId - The user's ID
 * @param betData - Bet notification data
 * @returns The created notification
 */
export function addBetNotification(
  userId: string,
  betData: {
    notificationType: 'placed' | 'won' | 'lost';
    amount: number;
    multiplier: number;
    payout?: number;
    targetPrice?: number;
  },
  username?: string,
  avatarUrl?: string | null
): BetNotification {
  // Get user info if not provided
  let displayName = username;
  let userAvatar = avatarUrl;

  if (!displayName) {
    const user = getUserById(userId);
    if (user) {
      displayName = user.displayName || `User_${userId.slice(0, 6)}`;
      userAvatar = user.avatarUrl || null;
    } else {
      displayName = `User_${userId.slice(0, 6)}`;
    }
  }

  // Create the notification
  const notification: BetNotification = {
    id: generateNotificationId(),
    userId,
    username: displayName,
    avatarUrl: userAvatar ?? null,
    type: 'bet_notification',
    notificationType: betData.notificationType,
    amount: betData.amount,
    multiplier: betData.multiplier,
    payout: betData.payout,
    targetPrice: betData.targetPrice,
    createdAt: new Date(),
  };

  // Add to storage
  chatItems.push(notification);

  // Trim to max messages if needed
  while (chatItems.length > MAX_MESSAGES) {
    chatItems.shift();
  }

  // Broadcast to subscribers
  broadcast(notification);

  console.log(
    `[ChatService] Bet notification: ${displayName} ${betData.notificationType} $${betData.amount} bet`
  );

  return notification;
}

// ============================================
// Message Retrieval
// ============================================

/**
 * Get chat messages with pagination
 * @param limit - Number of messages to return (default: 50, max: 100)
 * @param before - Cursor for pagination (message ID to get messages before)
 * @returns Messages array with pagination info
 */
export function getMessages(
  limit: number = 50,
  before?: string
): ChatMessagesResponse {
  // Clamp limit to valid range
  const actualLimit = Math.min(Math.max(1, limit), MAX_MESSAGES);

  let filteredItems = [...chatItems];

  // If cursor provided, filter to items before that cursor
  if (before) {
    const cursorIndex = filteredItems.findIndex((item) => item.id === before);

    if (cursorIndex > -1) {
      filteredItems = filteredItems.slice(0, cursorIndex);
    }
  }

  // Sort by creation time (newest first for response, but we return oldest first for display)
  filteredItems.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Take the requested limit
  const resultItems = filteredItems.slice(0, actualLimit);

  // Reverse to get chronological order (oldest first)
  resultItems.reverse();

  // Get cursor for next page (oldest item in result)
  const cursor = resultItems.length > 0 ? resultItems[0].id : undefined;

  // Check if there are more messages
  const hasMore = filteredItems.length > actualLimit;

  return {
    messages: resultItems,
    cursor: hasMore ? cursor : undefined,
    hasMore,
  };
}

/**
 * Get all recent messages (no pagination)
 * @param limit - Number of messages to return
 * @returns Array of chat items
 */
export function getRecentMessages(limit: number = 50): ChatItem[] {
  const actualLimit = Math.min(Math.max(1, limit), MAX_MESSAGES);

  // Return most recent messages in chronological order
  return chatItems.slice(-actualLimit);
}

/**
 * Get only bet notifications
 * @param limit - Number of notifications to return
 * @returns Array of bet notifications
 */
export function getRecentBetNotifications(limit: number = 10): BetNotification[] {
  const notifications = chatItems.filter(
    (item): item is BetNotification => item.type === 'bet_notification'
  );

  return notifications.slice(-limit);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get chat statistics
 */
export function getChatStats(): {
  totalMessages: number;
  totalNotifications: number;
  totalItems: number;
  activeUsers: number;
} {
  const notifications = chatItems.filter(
    (item) => item.type === 'bet_notification'
  ).length;

  const uniqueUsers = new Set(chatItems.map((item) => item.userId)).size;

  return {
    totalMessages: chatItems.length - notifications,
    totalNotifications: notifications,
    totalItems: chatItems.length,
    activeUsers: uniqueUsers,
  };
}

/**
 * Clear all chat data (for testing)
 */
export function clearAllChatData(): void {
  chatItems.length = 0;
  rateLimitMap.clear();
  console.log('[ChatService] Cleared all chat data');
}

/**
 * Clear rate limit for a user (for testing)
 */
export function clearRateLimit(userId: string): void {
  rateLimitMap.delete(userId);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitMap.clear();
}

// ============================================
// Seed Data (for demo)
// ============================================

/**
 * Seed chat with sample messages (for demo purposes)
 */
export function seedChatWithSampleMessages(): void {
  const sampleUsers = [
    { id: 'demo_user_1', username: 'CryptoKing', avatarUrl: null },
    { id: 'demo_user_2', username: 'SolanaWhale', avatarUrl: null },
    { id: 'demo_user_3', username: 'DegenzLive', avatarUrl: null },
    { id: 'demo_user_4', username: 'MoonShot420', avatarUrl: null },
    { id: 'demo_user_5', username: 'DiamondHands', avatarUrl: null },
  ];

  const sampleMessages = [
    "LFG! SOL pumping!",
    "Just hit a 5x, lets go!",
    "Anyone else bullish rn?",
    "That candle was insane",
    "WAGMI",
    "Paper hands getting rekt",
    "Time to load up",
    "Who else is riding this wave?",
  ];

  // Add some messages
  sampleMessages.forEach((msg, index) => {
    const user = sampleUsers[index % sampleUsers.length];

    // Clear rate limit before adding
    clearRateLimit(user.id);

    const message: ChatMessage = {
      id: generateMessageId(),
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      message: msg,
      type: 'message',
      createdAt: new Date(Date.now() - (sampleMessages.length - index) * 30000), // Stagger timestamps
    };

    chatItems.push(message);
  });

  // Add some bet notifications
  const betNotifications = [
    { notificationType: 'placed' as const, amount: 10, multiplier: 2.5 },
    { notificationType: 'won' as const, amount: 25, multiplier: 3.2, payout: 80 },
    { notificationType: 'placed' as const, amount: 50, multiplier: 1.8 },
    { notificationType: 'lost' as const, amount: 15, multiplier: 4.1 },
  ];

  betNotifications.forEach((bet, index) => {
    const user = sampleUsers[(index + 2) % sampleUsers.length];

    const notification: BetNotification = {
      id: generateNotificationId(),
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      type: 'bet_notification',
      notificationType: bet.notificationType,
      amount: bet.amount,
      multiplier: bet.multiplier,
      payout: bet.payout,
      createdAt: new Date(Date.now() - (betNotifications.length - index) * 45000),
    };

    chatItems.push(notification);
  });

  // Sort by creation time
  chatItems.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  console.log(`[ChatService] Seeded ${chatItems.length} sample chat items`);
}

// ============================================
// Exports
// ============================================

export {
  MAX_MESSAGES,
  MAX_MESSAGE_LENGTH,
  RATE_LIMIT_MS,
};
