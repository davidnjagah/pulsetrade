/**
 * PulseTrade Monetization Service
 * Handles house edge calculation, platform fees, and revenue tracking
 *
 * Revenue Sources:
 * 1. House Edge: 20% reduction from fair multipliers (built into every bet)
 * 2. Platform Fee: 5% fee on winnings (additional revenue on wins)
 *
 * Expected Platform Edge: ~22-25% on all betting volume
 */

import { FEE_CONFIG, BETTING_LIMITS } from './types';

// ============================================
// Types
// ============================================

export interface RevenueEvent {
  id: string;
  timestamp: number;
  type: 'house_edge' | 'platform_fee' | 'loss_revenue';
  amount: number;
  betId: string;
  userId: string;
  betAmount: number;
  multiplier: number;
  won: boolean;
}

export interface RevenueStats {
  totalVolume: number;
  totalRevenue: number;
  houseEdgeRevenue: number;
  platformFeeRevenue: number;
  lossRevenue: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  effectiveEdge: number;
  averageBetSize: number;
  averageMultiplier: number;
}

export interface PeriodStats {
  daily: RevenueStats;
  weekly: RevenueStats;
  monthly: RevenueStats;
  allTime: RevenueStats;
}

export interface HouseEdgeCalculation {
  trueProbability: number;
  fairMultiplier: number;
  houseEdge: number;
  displayMultiplier: number;
  expectedHouseRevenue: number;
}

export interface PlatformFeeCalculation {
  grossPayout: number;
  winnings: number;
  platformFee: number;
  netPayout: number;
  feeRate: number;
}

// ============================================
// Constants
// ============================================

const HOUSE_EDGE = FEE_CONFIG.HOUSE_EDGE; // 20%
const PLATFORM_FEE_RATE = FEE_CONFIG.PLATFORM_FEE_RATE; // 5%

// Time periods in milliseconds
const PERIODS = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

// ============================================
// In-Memory Revenue Storage
// ============================================

const revenueEvents: RevenueEvent[] = [];
let eventIdCounter = 0;

// Aggregated stats cache (updated on each event)
let cachedStats: PeriodStats | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 5000; // 5 seconds

// ============================================
// House Edge Calculation
// ============================================

/**
 * Calculate house edge revenue from a bet
 *
 * The house edge is the difference between fair odds and displayed odds.
 * For a 20% house edge, if the fair multiplier is 5x, we display 4x.
 * Expected house edge revenue = betAmount * (fairMultiplier - displayMultiplier) * probability
 *
 * @param betAmount - Amount wagered
 * @param trueProbability - True probability of winning (0-1)
 * @returns House edge calculation details
 */
export function calculateHouseEdge(
  betAmount: number,
  trueProbability: number
): HouseEdgeCalculation {
  // Validate inputs
  const validProb = Math.max(0.001, Math.min(0.95, trueProbability));

  // Fair multiplier is the inverse of true probability
  const fairMultiplier = 1 / validProb;

  // Display multiplier has house edge baked in
  const displayMultiplier = fairMultiplier * (1 - HOUSE_EDGE);

  // Expected house revenue per bet
  // = betAmount * probability * (fairMultiplier - displayMultiplier)
  // = betAmount * probability * fairMultiplier * HOUSE_EDGE
  // = betAmount * HOUSE_EDGE (simplified since prob * fairMult = 1)
  const expectedHouseRevenue = betAmount * HOUSE_EDGE;

  return {
    trueProbability: validProb,
    fairMultiplier: Math.round(fairMultiplier * 100) / 100,
    houseEdge: HOUSE_EDGE,
    displayMultiplier: Math.round(displayMultiplier * 100) / 100,
    expectedHouseRevenue: Math.round(expectedHouseRevenue * 100) / 100,
  };
}

/**
 * Verify that house edge is correctly applied to a multiplier
 *
 * @param displayMultiplier - The multiplier shown to users
 * @param trueProbability - The true probability of winning
 * @returns Whether the house edge is correctly applied (within tolerance)
 */
export function verifyHouseEdge(
  displayMultiplier: number,
  trueProbability: number
): { valid: boolean; actualEdge: number; expectedEdge: number } {
  const fairMultiplier = 1 / trueProbability;
  const actualEdge = 1 - displayMultiplier / fairMultiplier;

  return {
    valid: Math.abs(actualEdge - HOUSE_EDGE) < 0.01, // 1% tolerance
    actualEdge: Math.round(actualEdge * 10000) / 10000,
    expectedEdge: HOUSE_EDGE,
  };
}

// ============================================
// Platform Fee Calculation
// ============================================

/**
 * Calculate platform fee on winnings
 *
 * @param betAmount - Original bet amount
 * @param multiplier - Display multiplier
 * @returns Platform fee calculation details
 */
export function calculatePlatformFee(
  betAmount: number,
  multiplier: number
): PlatformFeeCalculation {
  const grossPayout = betAmount * multiplier;
  const winnings = grossPayout - betAmount;
  const platformFee = winnings * PLATFORM_FEE_RATE;
  const netPayout = grossPayout - platformFee;

  return {
    grossPayout: Math.round(grossPayout * 100) / 100,
    winnings: Math.round(winnings * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    netPayout: Math.round(netPayout * 100) / 100,
    feeRate: PLATFORM_FEE_RATE,
  };
}

// ============================================
// Revenue Tracking
// ============================================

/**
 * Record revenue from a bet resolution
 *
 * @param betId - Unique bet identifier
 * @param userId - User who placed the bet
 * @param betAmount - Amount wagered
 * @param multiplier - Display multiplier
 * @param won - Whether the bet was won
 * @param trueProbability - True probability (for house edge calculation)
 */
export function recordBetRevenue(
  betId: string,
  userId: string,
  betAmount: number,
  multiplier: number,
  won: boolean,
  trueProbability: number = 0.5
): void {
  const timestamp = Date.now();

  if (won) {
    // Record platform fee revenue on wins
    const feeCalc = calculatePlatformFee(betAmount, multiplier);

    revenueEvents.push({
      id: `rev_${++eventIdCounter}`,
      timestamp,
      type: 'platform_fee',
      amount: feeCalc.platformFee,
      betId,
      userId,
      betAmount,
      multiplier,
      won: true,
    });
  } else {
    // Record full bet amount as loss revenue
    revenueEvents.push({
      id: `rev_${++eventIdCounter}`,
      timestamp,
      type: 'loss_revenue',
      amount: betAmount,
      betId,
      userId,
      betAmount,
      multiplier,
      won: false,
    });
  }

  // Also record house edge as a separate tracking metric
  const houseEdgeCalc = calculateHouseEdge(betAmount, trueProbability);

  revenueEvents.push({
    id: `rev_${++eventIdCounter}`,
    timestamp,
    type: 'house_edge',
    amount: houseEdgeCalc.expectedHouseRevenue,
    betId,
    userId,
    betAmount,
    multiplier,
    won,
  });

  // Invalidate cache
  cachedStats = null;
}

/**
 * Calculate revenue statistics for a time period
 *
 * @param events - Array of revenue events to analyze
 * @returns Aggregated revenue statistics
 */
function calculateRevenueStats(events: RevenueEvent[]): RevenueStats {
  if (events.length === 0) {
    return {
      totalVolume: 0,
      totalRevenue: 0,
      houseEdgeRevenue: 0,
      platformFeeRevenue: 0,
      lossRevenue: 0,
      totalBets: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      effectiveEdge: 0,
      averageBetSize: 0,
      averageMultiplier: 0,
    };
  }

  // Group by bet to avoid double counting
  const betMap = new Map<string, RevenueEvent[]>();
  events.forEach((event) => {
    const existing = betMap.get(event.betId) || [];
    existing.push(event);
    betMap.set(event.betId, existing);
  });

  let totalVolume = 0;
  let houseEdgeRevenue = 0;
  let platformFeeRevenue = 0;
  let lossRevenue = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalMultiplier = 0;

  betMap.forEach((betEvents) => {
    // Use first event's bet data for volume calculation
    const firstEvent = betEvents[0];
    totalVolume += firstEvent.betAmount;
    totalMultiplier += firstEvent.multiplier;

    // Aggregate revenue by type
    betEvents.forEach((event) => {
      switch (event.type) {
        case 'house_edge':
          houseEdgeRevenue += event.amount;
          break;
        case 'platform_fee':
          platformFeeRevenue += event.amount;
          totalWins++;
          break;
        case 'loss_revenue':
          lossRevenue += event.amount;
          totalLosses++;
          break;
      }
    });
  });

  const totalBets = betMap.size;
  const totalRevenue = platformFeeRevenue + lossRevenue;
  const winRate = totalBets > 0 ? totalWins / totalBets : 0;
  const effectiveEdge = totalVolume > 0 ? totalRevenue / totalVolume : 0;
  const averageBetSize = totalBets > 0 ? totalVolume / totalBets : 0;
  const averageMultiplier = totalBets > 0 ? totalMultiplier / totalBets : 0;

  return {
    totalVolume: Math.round(totalVolume * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    houseEdgeRevenue: Math.round(houseEdgeRevenue * 100) / 100,
    platformFeeRevenue: Math.round(platformFeeRevenue * 100) / 100,
    lossRevenue: Math.round(lossRevenue * 100) / 100,
    totalBets,
    totalWins,
    totalLosses,
    winRate: Math.round(winRate * 10000) / 10000,
    effectiveEdge: Math.round(effectiveEdge * 10000) / 10000,
    averageBetSize: Math.round(averageBetSize * 100) / 100,
    averageMultiplier: Math.round(averageMultiplier * 100) / 100,
  };
}

/**
 * Get revenue statistics by period
 *
 * @returns Statistics for daily, weekly, monthly, and all-time periods
 */
export function getRevenueStats(): PeriodStats {
  const now = Date.now();

  // Return cached stats if still valid
  if (cachedStats && now - lastCacheUpdate < CACHE_TTL) {
    return cachedStats;
  }

  const dailyCutoff = now - PERIODS.DAILY;
  const weeklyCutoff = now - PERIODS.WEEKLY;
  const monthlyCutoff = now - PERIODS.MONTHLY;

  const dailyEvents = revenueEvents.filter((e) => e.timestamp >= dailyCutoff);
  const weeklyEvents = revenueEvents.filter((e) => e.timestamp >= weeklyCutoff);
  const monthlyEvents = revenueEvents.filter((e) => e.timestamp >= monthlyCutoff);

  cachedStats = {
    daily: calculateRevenueStats(dailyEvents),
    weekly: calculateRevenueStats(weeklyEvents),
    monthly: calculateRevenueStats(monthlyEvents),
    allTime: calculateRevenueStats(revenueEvents),
  };

  lastCacheUpdate = now;

  return cachedStats;
}

/**
 * Get recent revenue events
 *
 * @param limit - Maximum number of events to return
 * @returns Array of recent revenue events
 */
export function getRecentRevenueEvents(limit: number = 100): RevenueEvent[] {
  return revenueEvents.slice(-limit).reverse();
}

/**
 * Get revenue breakdown by user
 *
 * @param limit - Maximum number of users to return
 * @returns Array of user revenue summaries
 */
export function getRevenueByUser(
  limit: number = 50
): Array<{ userId: string; revenue: number; bets: number }> {
  const userRevenue = new Map<string, { revenue: number; bets: Set<string> }>();

  revenueEvents.forEach((event) => {
    if (event.type === 'platform_fee' || event.type === 'loss_revenue') {
      const existing = userRevenue.get(event.userId) || { revenue: 0, bets: new Set() };
      existing.revenue += event.amount;
      existing.bets.add(event.betId);
      userRevenue.set(event.userId, existing);
    }
  });

  return Array.from(userRevenue.entries())
    .map(([userId, data]) => ({
      userId,
      revenue: Math.round(data.revenue * 100) / 100,
      bets: data.bets.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// ============================================
// Expected Value Calculations
// ============================================

/**
 * Calculate the expected value for a bet (from user's perspective)
 *
 * EV = (probability * netPayout) - (1 - probability) * betAmount
 *
 * For the house to profit, user EV should be negative.
 *
 * @param betAmount - Amount wagered
 * @param multiplier - Display multiplier
 * @param trueProbability - True probability of winning
 * @returns Expected value (negative means house advantage)
 */
export function calculateUserEV(
  betAmount: number,
  multiplier: number,
  trueProbability: number
): number {
  const feeCalc = calculatePlatformFee(betAmount, multiplier);
  const netWin = feeCalc.netPayout - betAmount;

  const ev =
    trueProbability * netWin - (1 - trueProbability) * betAmount;

  return Math.round(ev * 100) / 100;
}

/**
 * Calculate the expected house revenue per bet
 *
 * @param betAmount - Amount wagered
 * @param multiplier - Display multiplier
 * @param trueProbability - True probability of winning
 * @returns Expected house revenue (positive means profitable)
 */
export function calculateHouseEV(
  betAmount: number,
  multiplier: number,
  trueProbability: number
): number {
  return -calculateUserEV(betAmount, multiplier, trueProbability);
}

/**
 * Calculate total expected revenue at a given volume
 *
 * @param dailyVolume - Expected daily betting volume
 * @returns Projected revenue at various time scales
 */
export function projectRevenue(dailyVolume: number): {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  effectiveEdge: number;
} {
  // Combined edge: house edge + (win rate * platform fee on wins)
  // Assuming ~40% win rate and average multiplier of 2x
  const avgWinRate = 0.4;
  const avgMultiplier = 2.0;
  const avgWinAmount = dailyVolume * avgWinRate * avgMultiplier;
  const platformFeeRev = avgWinAmount * PLATFORM_FEE_RATE * 0.4; // Winnings portion

  // Loss revenue: (1 - winRate) * volume
  const lossRevenue = dailyVolume * (1 - avgWinRate);

  // Actual payouts: winRate * volume * multiplier * (1 - fee)
  const payouts = dailyVolume * avgWinRate * avgMultiplier * (1 - PLATFORM_FEE_RATE);

  // Net revenue = volume - payouts + fees
  const dailyRevenue = dailyVolume - payouts + platformFeeRev;
  const effectiveEdge = dailyRevenue / dailyVolume;

  return {
    daily: Math.round(dailyRevenue * 100) / 100,
    weekly: Math.round(dailyRevenue * 7 * 100) / 100,
    monthly: Math.round(dailyRevenue * 30 * 100) / 100,
    yearly: Math.round(dailyRevenue * 365 * 100) / 100,
    effectiveEdge: Math.round(effectiveEdge * 10000) / 10000,
  };
}

// ============================================
// Admin Functions
// ============================================

/**
 * Clear all revenue data (for testing)
 */
export function clearRevenueData(): void {
  revenueEvents.length = 0;
  eventIdCounter = 0;
  cachedStats = null;
}

/**
 * Get raw revenue events (for debugging)
 */
export function getRawRevenueEvents(): RevenueEvent[] {
  return [...revenueEvents];
}

// ============================================
// Export Constants
// ============================================

export { HOUSE_EDGE, PLATFORM_FEE_RATE, PERIODS };
