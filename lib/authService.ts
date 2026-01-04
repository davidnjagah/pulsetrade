/**
 * PulseTrade Authentication Service
 * Session management with in-memory storage for demo
 *
 * Features:
 * - Create/validate/delete sessions
 * - Auto-expire sessions after 24 hours
 * - Track users by wallet address
 * - Support for demo and real wallet connections
 */

import { v4 as uuidv4 } from 'uuid';
import { Session, SessionValidation, WalletType } from './types';

// ============================================
// Configuration
// ============================================

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_BALANCE = 10000; // $10,000 for new users
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Cleanup every hour

// ============================================
// In-Memory Storage
// ============================================

// Sessions: sessionId -> Session
const sessionsStore = new Map<string, Session>();

// Users by wallet: walletAddress -> userId
const walletToUserMap = new Map<string, string>();

// User balances: userId -> balance (managed by betService, but tracked here for new users)
interface UserRecord {
  id: string;
  walletAddress: string;
  walletType: WalletType;
  displayName: string | null;
  avatarUrl: string | null;
  balance: number;
  createdAt: Date;
  isDemo: boolean;
}

const usersStore = new Map<string, UserRecord>();

// ============================================
// Cleanup Timer
// ============================================

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start the session cleanup timer
 */
function startCleanupTimer(): void {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    cleanupExpiredSessions();
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Stop the cleanup timer
 */
function stopCleanupTimer(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions(): number {
  const now = Date.now();
  let cleanedCount = 0;

  sessionsStore.forEach((session, sessionId) => {
    if (now >= session.expiresAt.getTime()) {
      sessionsStore.delete(sessionId);
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`[AuthService] Cleaned up ${cleanedCount} expired sessions`);
  }

  return cleanedCount;
}

// Start cleanup timer on module load
startCleanupTimer();

// ============================================
// Session Management
// ============================================

/**
 * Generate a unique session token
 */
function generateSessionToken(): string {
  // Combine UUID with timestamp for uniqueness
  const uuid = uuidv4();
  const timestamp = Date.now().toString(36);
  return `pts_${timestamp}_${uuid.replace(/-/g, '')}`;
}

/**
 * Generate a user ID from wallet address
 */
function generateUserId(walletAddress: string): string {
  // Use a hash-like approach for consistency
  const normalized = walletAddress.toLowerCase();
  return `user_${normalized.slice(0, 8)}_${Date.now().toString(36)}`;
}

/**
 * Generate display name from wallet address
 */
function generateDisplayName(walletAddress: string, isDemo: boolean): string {
  if (isDemo) {
    return 'Demo User';
  }
  return `User_${walletAddress.slice(0, 6)}`;
}

/**
 * Create a new session for a wallet
 */
export function createSession(
  walletAddress: string,
  walletType: WalletType,
  signature?: string
): Session {
  // Normalize wallet address
  const normalizedAddress = walletAddress.toLowerCase().trim();

  // Check if user already exists
  let userId = walletToUserMap.get(normalizedAddress);
  let user = userId ? usersStore.get(userId) : null;
  let isNewUser = false;

  if (!user) {
    // Create new user
    isNewUser = true;
    userId = generateUserId(normalizedAddress);
    const isDemo = walletType === 'demo';

    user = {
      id: userId,
      walletAddress: normalizedAddress,
      walletType,
      displayName: generateDisplayName(normalizedAddress, isDemo),
      avatarUrl: null,
      balance: DEFAULT_BALANCE,
      createdAt: new Date(),
      isDemo,
    };

    usersStore.set(userId, user);
    walletToUserMap.set(normalizedAddress, userId);

    console.log(`[AuthService] Created new user: ${userId} for wallet: ${normalizedAddress.slice(0, 8)}...`);
  }

  // Invalidate any existing sessions for this user
  sessionsStore.forEach((session, sessionId) => {
    if (session.userId === userId) {
      sessionsStore.delete(sessionId);
    }
  });

  // Create new session
  const sessionId = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MS);

  const session: Session = {
    id: sessionId,
    userId: userId!,
    walletAddress: normalizedAddress,
    walletType,
    createdAt: now,
    expiresAt,
    lastActivityAt: now,
  };

  sessionsStore.set(sessionId, session);

  console.log(`[AuthService] Created session: ${sessionId.slice(0, 20)}... for user: ${userId}`);

  return session;
}

/**
 * Get session by session ID
 */
export function getSession(sessionId: string): Session | null {
  const session = sessionsStore.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (Date.now() >= session.expiresAt.getTime()) {
    sessionsStore.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * Validate session and return validation result
 */
export function validateSession(sessionId: string): SessionValidation {
  if (!sessionId) {
    return {
      valid: false,
      error: 'No session token provided',
    };
  }

  const session = getSession(sessionId);

  if (!session) {
    return {
      valid: false,
      error: 'Invalid or expired session',
    };
  }

  // Update last activity time
  session.lastActivityAt = new Date();
  sessionsStore.set(sessionId, session);

  // Get user data
  const user = usersStore.get(session.userId);

  return {
    valid: true,
    session,
    user: user ? {
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      balance: user.balance,
      isDemo: user.isDemo,
    } : undefined,
  };
}

/**
 * Delete/invalidate a session
 */
export function deleteSession(sessionId: string): boolean {
  const session = sessionsStore.get(sessionId);

  if (!session) {
    return false;
  }

  sessionsStore.delete(sessionId);
  console.log(`[AuthService] Deleted session: ${sessionId.slice(0, 20)}...`);

  return true;
}

/**
 * Delete all sessions for a user
 */
export function deleteUserSessions(userId: string): number {
  let deletedCount = 0;

  sessionsStore.forEach((session, sessionId) => {
    if (session.userId === userId) {
      sessionsStore.delete(sessionId);
      deletedCount++;
    }
  });

  return deletedCount;
}

/**
 * Refresh session expiry
 */
export function refreshSession(sessionId: string): Session | null {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  // Extend expiry
  session.expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  session.lastActivityAt = new Date();
  sessionsStore.set(sessionId, session);

  return session;
}

// ============================================
// User Management
// ============================================

/**
 * Get user by ID
 */
export function getUserById(userId: string): UserRecord | null {
  return usersStore.get(userId) || null;
}

/**
 * Get user by wallet address
 */
export function getUserByWallet(walletAddress: string): UserRecord | null {
  const normalizedAddress = walletAddress.toLowerCase().trim();
  const userId = walletToUserMap.get(normalizedAddress);

  if (!userId) {
    return null;
  }

  return usersStore.get(userId) || null;
}

/**
 * Update user balance
 */
export function updateUserBalance(userId: string, newBalance: number): UserRecord | null {
  const user = usersStore.get(userId);

  if (!user) {
    return null;
  }

  user.balance = Math.round(newBalance * 100) / 100;
  usersStore.set(userId, user);

  return user;
}

/**
 * Update user profile
 */
export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserRecord, 'displayName' | 'avatarUrl'>>
): UserRecord | null {
  const user = usersStore.get(userId);

  if (!user) {
    return null;
  }

  if (updates.displayName !== undefined) {
    user.displayName = updates.displayName;
  }
  if (updates.avatarUrl !== undefined) {
    user.avatarUrl = updates.avatarUrl;
  }

  usersStore.set(userId, user);

  return user;
}

// ============================================
// Session Extraction
// ============================================

/**
 * Extract session token from Authorization header
 */
export function extractSessionFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Support raw token format
  if (authHeader.startsWith('pts_')) {
    return authHeader;
  }

  return null;
}

/**
 * Extract session token from cookie
 */
export function extractSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith('pulsetrade_session=')) {
      return cookie.slice('pulsetrade_session='.length);
    }
  }

  return null;
}

// ============================================
// Admin/Utility Functions
// ============================================

/**
 * Get all active sessions count
 */
export function getActiveSessionsCount(): number {
  cleanupExpiredSessions();
  return sessionsStore.size;
}

/**
 * Get total users count
 */
export function getTotalUsersCount(): number {
  return usersStore.size;
}

/**
 * Get session statistics
 */
export function getSessionStats() {
  cleanupExpiredSessions();

  let demoSessions = 0;
  let walletSessions = 0;

  sessionsStore.forEach((session) => {
    if (session.walletType === 'demo') {
      demoSessions++;
    } else {
      walletSessions++;
    }
  });

  return {
    totalSessions: sessionsStore.size,
    demoSessions,
    walletSessions,
    totalUsers: usersStore.size,
  };
}

/**
 * Clear all sessions (for testing)
 */
export function clearAllSessions(): void {
  sessionsStore.clear();
  console.log('[AuthService] Cleared all sessions');
}

/**
 * Clear all data (for testing)
 */
export function clearAllAuthData(): void {
  sessionsStore.clear();
  usersStore.clear();
  walletToUserMap.clear();
  console.log('[AuthService] Cleared all auth data');
}

// ============================================
// Exports
// ============================================

export {
  SESSION_EXPIRY_MS,
  DEFAULT_BALANCE,
  cleanupExpiredSessions,
  stopCleanupTimer,
};

export type { UserRecord };
