/**
 * PulseTrade Bet Service
 * Handles bet placement, tracking, and resolution
 *
 * For demo/development: Uses in-memory Map storage
 * For production: Would integrate with Supabase database
 */

import {
  Bet,
  BetStatus,
  BetPlaceRequest,
  BetPlaceResponse,
  BetResolveRequest,
  BetResolveResponse,
  ActiveBetsResponse,
  BETTING_LIMITS,
  FEE_CONFIG,
} from './types';
import { calculateMultiplier, calculatePayout, resolveBet as resolveMultiplier } from './multiplierCalculator';
import { validateBetRequest, BetValidationContext } from './betValidator';

// ============================================
// Types
// ============================================

export interface UserState {
  id: string;
  balance: number;
  dailyPayoutTotal: number;
  lastBetTime: number;
}

export interface BetResolutionResult {
  bet: Bet;
  won: boolean;
  payout: number;
  platformFee: number;
  newBalance: number;
}

// ============================================
// In-Memory Storage
// ============================================

// Bets storage: betId -> Bet
const betsStore = new Map<string, Bet>();

// User state storage: userId -> UserState
const usersStore = new Map<string, UserState>();

// Active bet timers: betId -> Timer
const betTimers = new Map<string, NodeJS.Timeout>();

// Resolution callbacks
type ResolutionCallback = (result: BetResolutionResult) => void;
const resolutionCallbacks: ResolutionCallback[] = [];

// Default user for demo mode
const DEFAULT_USER_ID = 'demo-user';
const DEFAULT_BALANCE = 10000;

// ============================================
// User Management
// ============================================

/**
 * Get or create user state
 */
export function getUser(userId: string = DEFAULT_USER_ID): UserState {
  let user = usersStore.get(userId);

  if (!user) {
    user = {
      id: userId,
      balance: DEFAULT_BALANCE,
      dailyPayoutTotal: 0,
      lastBetTime: 0,
    };
    usersStore.set(userId, user);
  }

  return user;
}

/**
 * Update user balance
 */
export function updateUserBalance(userId: string, newBalance: number): UserState {
  const user = getUser(userId);
  user.balance = Math.round(newBalance * 100) / 100; // Round to 2 decimals
  usersStore.set(userId, user);
  return user;
}

/**
 * Add to user balance
 */
export function addToBalance(userId: string, amount: number): UserState {
  const user = getUser(userId);
  return updateUserBalance(userId, user.balance + amount);
}

/**
 * Deduct from user balance
 */
export function deductFromBalance(userId: string, amount: number): UserState {
  const user = getUser(userId);
  return updateUserBalance(userId, user.balance - amount);
}

/**
 * Reset user daily payout (should be called at midnight)
 */
export function resetDailyPayout(userId: string): void {
  const user = getUser(userId);
  user.dailyPayoutTotal = 0;
  usersStore.set(userId, user);
}

// ============================================
// Bet Placement
// ============================================

/**
 * Generate a unique bet ID
 */
function generateBetId(): string {
  return `bet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Place a new bet
 */
export async function placeBet(
  userId: string,
  request: BetPlaceRequest,
  currentPrice?: number
): Promise<BetPlaceResponse> {
  const user = getUser(userId);
  const now = Date.now();

  // Check cooldown
  if (now - user.lastBetTime < BETTING_LIMITS.COOLDOWN_MS) {
    const waitTime = BETTING_LIMITS.COOLDOWN_MS - (now - user.lastBetTime);
    throw new Error(`Please wait ${waitTime}ms before placing another bet`);
  }

  // Use provided current price or request's priceAtPlacement
  const effectiveCurrentPrice = currentPrice || request.priceAtPlacement;

  // Get active bets count for this user
  const activeBets = getActiveBets(userId);

  // Build validation context
  const context: BetValidationContext = {
    userBalance: user.balance,
    activeBetsCount: activeBets.bets.length,
    currentPrice: effectiveCurrentPrice,
    currentTime: now,
    dailyPayoutTotal: user.dailyPayoutTotal,
  };

  // Validate the bet request
  const validation = validateBetRequest(request, context);

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid bet request');
  }

  // Parse target time
  const targetTimeMs = new Date(request.targetTime).getTime();

  // Calculate multiplier
  const multiplier = validation.calculatedMultiplier || calculateMultiplier(
    effectiveCurrentPrice,
    request.targetPrice,
    now,
    targetTimeMs
  );

  const potentialPayout = validation.potentialPayout || (request.amount * multiplier);

  // Create the bet
  const betId = generateBetId();
  const bet: Bet = {
    id: betId,
    userId,
    amount: request.amount,
    targetPrice: request.targetPrice,
    targetTime: new Date(request.targetTime),
    multiplier,
    placedAt: new Date(now),
    resolvedAt: null,
    status: 'active',
    payout: null,
    priceAtPlacement: request.priceAtPlacement,
  };

  // Deduct bet amount from balance
  deductFromBalance(userId, request.amount);

  // Update last bet time
  user.lastBetTime = now;
  usersStore.set(userId, user);

  // Store the bet
  betsStore.set(betId, bet);

  // Set up auto-resolution timer
  scheduleResolution(bet);

  // Return response
  return {
    id: betId,
    amount: request.amount,
    targetPrice: request.targetPrice,
    targetTime: request.targetTime,
    multiplier,
    priceAtPlacement: request.priceAtPlacement,
    placedAt: bet.placedAt.toISOString(),
    status: 'active',
    potentialPayout: Math.round(potentialPayout * 100) / 100,
  };
}

// ============================================
// Bet Resolution
// ============================================

/**
 * Schedule automatic bet resolution
 */
function scheduleResolution(bet: Bet): void {
  const targetTime = bet.targetTime.getTime();
  const delay = targetTime - Date.now();

  if (delay <= 0) {
    // Should resolve immediately (shouldn't happen in normal flow)
    console.warn(`Bet ${bet.id} has target time in the past`);
    return;
  }

  // Add small random delay to prevent front-running (100-500ms)
  const randomDelay = Math.floor(Math.random() * 400) + 100;

  const timer = setTimeout(async () => {
    try {
      // Get current price (mock for now - in production would fetch from price service)
      const actualPrice = getMockResolutionPrice(bet);

      await resolveBetInternal(bet.id, actualPrice);
    } catch (error) {
      console.error(`Failed to auto-resolve bet ${bet.id}:`, error);
    }
  }, delay + randomDelay);

  betTimers.set(bet.id, timer);
}

/**
 * Get mock resolution price (for demo)
 * In production, this would fetch from price service
 */
function getMockResolutionPrice(bet: Bet): number {
  // Generate a price that gives ~35-45% win rate
  const priceDistance = Math.abs(bet.targetPrice - bet.priceAtPlacement);
  const direction = bet.targetPrice > bet.priceAtPlacement ? 1 : -1;

  // Random factor for price movement
  const randomFactor = Math.random();

  // 40% chance to hit target (within slippage)
  if (randomFactor < 0.40) {
    // Winner - price reaches target (with some variance)
    const slippageVariance = (Math.random() - 0.5) * 0.002 * bet.priceAtPlacement;
    return bet.targetPrice + slippageVariance;
  } else {
    // Loser - price doesn't reach target
    const shortfall = 0.3 + Math.random() * 0.5; // 30-80% of the way
    return bet.priceAtPlacement + (direction * priceDistance * shortfall);
  }
}

/**
 * Internal bet resolution
 */
async function resolveBetInternal(betId: string, actualPrice: number): Promise<BetResolutionResult> {
  const bet = betsStore.get(betId);

  if (!bet) {
    throw new Error(`Bet ${betId} not found`);
  }

  if (bet.status !== 'active') {
    throw new Error(`Bet ${betId} is already resolved`);
  }

  // Clear the timer
  const timer = betTimers.get(betId);
  if (timer) {
    clearTimeout(timer);
    betTimers.delete(betId);
  }

  // Resolve the bet
  const resolution = resolveMultiplier(
    bet.targetPrice,
    actualPrice,
    bet.amount,
    bet.multiplier
  );

  // Update bet status
  bet.status = resolution.won ? 'won' : 'lost';
  bet.resolvedAt = new Date();
  bet.payout = resolution.won ? resolution.payout : 0;

  betsStore.set(betId, bet);

  // Update user balance if won
  const user = getUser(bet.userId);
  let newBalance = user.balance;

  if (resolution.won) {
    newBalance = addToBalance(bet.userId, resolution.payout).balance;
    user.dailyPayoutTotal += resolution.payout;
    usersStore.set(bet.userId, user);
  }

  const result: BetResolutionResult = {
    bet,
    won: resolution.won,
    payout: resolution.payout,
    platformFee: resolution.platformFee,
    newBalance,
  };

  // Notify callbacks
  resolutionCallbacks.forEach((callback) => {
    try {
      callback(result);
    } catch (error) {
      console.error('Resolution callback error:', error);
    }
  });

  return result;
}

/**
 * Manually resolve a bet (for API use)
 */
export async function resolveBetManually(
  request: BetResolveRequest
): Promise<BetResolveResponse> {
  const { betId, actualPrice, resolvedAt } = request;

  const result = await resolveBetInternal(betId, actualPrice);

  return {
    id: result.bet.id,
    status: result.bet.status,
    payout: result.payout,
    platformFee: result.platformFee,
  };
}

/**
 * Register a callback for bet resolutions
 */
export function onBetResolution(callback: ResolutionCallback): () => void {
  resolutionCallbacks.push(callback);

  // Return unsubscribe function
  return () => {
    const index = resolutionCallbacks.indexOf(callback);
    if (index > -1) {
      resolutionCallbacks.splice(index, 1);
    }
  };
}

// ============================================
// Bet Queries
// ============================================

/**
 * Get a single bet by ID
 */
export function getBet(betId: string): Bet | null {
  return betsStore.get(betId) || null;
}

/**
 * Get all active bets for a user
 */
export function getActiveBets(userId: string): ActiveBetsResponse {
  const userBets: Bet[] = [];
  let totalExposure = 0;

  betsStore.forEach((bet) => {
    if (bet.userId === userId && bet.status === 'active') {
      userBets.push(bet);
      totalExposure += bet.amount;
    }
  });

  // Sort by placed time (newest first)
  userBets.sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());

  return {
    bets: userBets,
    totalExposure,
  };
}

/**
 * Get all bets for a user (including resolved)
 */
export function getAllBets(userId: string): Bet[] {
  const userBets: Bet[] = [];

  betsStore.forEach((bet) => {
    if (bet.userId === userId) {
      userBets.push(bet);
    }
  });

  // Sort by placed time (newest first)
  userBets.sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());

  return userBets;
}

/**
 * Get recent resolved bets for a user
 */
export function getRecentResolvedBets(userId: string, limit: number = 10): Bet[] {
  const resolvedBets: Bet[] = [];

  betsStore.forEach((bet) => {
    if (bet.userId === userId && bet.status !== 'active') {
      resolvedBets.push(bet);
    }
  });

  // Sort by resolved time (newest first)
  resolvedBets.sort((a, b) => {
    const aTime = a.resolvedAt?.getTime() || 0;
    const bTime = b.resolvedAt?.getTime() || 0;
    return bTime - aTime;
  });

  return resolvedBets.slice(0, limit);
}

/**
 * Get bet statistics for a user
 */
export function getBetStats(userId: string) {
  let totalBets = 0;
  let wins = 0;
  let losses = 0;
  let totalWagered = 0;
  let totalPayout = 0;
  let activeBetsAmount = 0;

  betsStore.forEach((bet) => {
    if (bet.userId === userId) {
      totalBets++;
      totalWagered += bet.amount;

      if (bet.status === 'won') {
        wins++;
        totalPayout += bet.payout || 0;
      } else if (bet.status === 'lost') {
        losses++;
      } else if (bet.status === 'active') {
        activeBetsAmount += bet.amount;
      }
    }
  });

  const completedBets = wins + losses;
  const winRate = completedBets > 0 ? wins / completedBets : 0;
  const profit = totalPayout - (totalWagered - activeBetsAmount);

  return {
    totalBets,
    wins,
    losses,
    winRate,
    totalWagered,
    totalPayout,
    profit,
    activeBetsAmount,
  };
}

// ============================================
// Bet Expiration
// ============================================

/**
 * Expire a bet (mark as expired without resolution)
 */
export function expireBet(betId: string): Bet | null {
  const bet = betsStore.get(betId);

  if (!bet || bet.status !== 'active') {
    return null;
  }

  // Clear timer if exists
  const timer = betTimers.get(betId);
  if (timer) {
    clearTimeout(timer);
    betTimers.delete(betId);
  }

  // Mark as expired and refund
  bet.status = 'expired';
  bet.resolvedAt = new Date();
  bet.payout = 0;

  betsStore.set(betId, bet);

  // Refund the bet amount
  addToBalance(bet.userId, bet.amount);

  return bet;
}

/**
 * Check for and expire stale bets
 */
export function expireStaleBets(): number {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes past target time
  let expiredCount = 0;

  betsStore.forEach((bet, betId) => {
    if (bet.status === 'active') {
      const targetTime = bet.targetTime.getTime();
      if (now - targetTime > staleThreshold) {
        expireBet(betId);
        expiredCount++;
      }
    }
  });

  return expiredCount;
}

// ============================================
// Admin / Utility Functions
// ============================================

/**
 * Cancel a bet (admin function)
 */
export function cancelBet(betId: string): Bet | null {
  return expireBet(betId);
}

/**
 * Clear all bets (for testing)
 */
export function clearAllBets(): void {
  // Clear all timers
  betTimers.forEach((timer) => clearTimeout(timer));
  betTimers.clear();

  // Clear bets
  betsStore.clear();
}

/**
 * Clear all data (for testing)
 */
export function clearAllData(): void {
  clearAllBets();
  usersStore.clear();
}

/**
 * Get system statistics
 */
export function getSystemStats() {
  let totalActiveBets = 0;
  let totalActiveExposure = 0;

  betsStore.forEach((bet) => {
    if (bet.status === 'active') {
      totalActiveBets++;
      totalActiveExposure += bet.amount * bet.multiplier;
    }
  });

  return {
    totalUsers: usersStore.size,
    totalBets: betsStore.size,
    totalActiveBets,
    totalActiveExposure,
    maxPlatformExposure: BETTING_LIMITS.MAX_PLATFORM_EXPOSURE,
  };
}

// ============================================
// Export singleton-like functions
// ============================================

export {
  DEFAULT_USER_ID,
  DEFAULT_BALANCE,
};
