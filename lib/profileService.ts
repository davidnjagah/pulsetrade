/**
 * PulseTrade Profile Service
 * Handles user profile data, statistics, and bet history
 *
 * Features:
 * - Get user profile with stats
 * - Calculate comprehensive user statistics
 * - Paginated bet history
 * - Win/loss streak tracking
 */

import {
  UserProfile,
  UserStats,
  BetHistoryItem,
  BetHistoryResponse,
  UserProfileResponse,
  Bet,
} from './types';
import { getAllBets, getUser, getBetStats } from './betService';
import { getUserById, UserRecord } from './authService';
import { getUserRank } from './leaderboardService';

// ============================================
// Configuration
// ============================================

const DEFAULT_HISTORY_LIMIT = 10;
const MAX_HISTORY_LIMIT = 100;

// ============================================
// Types
// ============================================

interface StreakInfo {
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

// ============================================
// Stats Calculation
// ============================================

/**
 * Calculate streak information from bets
 */
function calculateStreaks(bets: Bet[]): StreakInfo {
  // Filter to only resolved bets and sort by resolved time
  const resolvedBets = bets
    .filter(b => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => {
      const aTime = a.resolvedAt?.getTime() || 0;
      const bTime = b.resolvedAt?.getTime() || 0;
      return bTime - aTime; // Newest first
    });

  if (resolvedBets.length === 0) {
    return {
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
    };
  }

  // Calculate current streak
  let currentStreak = 0;
  const firstStatus = resolvedBets[0].status;
  for (const bet of resolvedBets) {
    if (bet.status === firstStatus) {
      currentStreak++;
    } else {
      break;
    }
  }
  currentStreak = firstStatus === 'won' ? currentStreak : -currentStreak;

  // Calculate longest streaks (iterate oldest to newest)
  const chronologicalBets = [...resolvedBets].reverse();
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const bet of chronologicalBets) {
    if (bet.status === 'won') {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
    }
  }

  return {
    currentStreak,
    longestWinStreak,
    longestLossStreak,
  };
}

/**
 * Get period start timestamps
 */
function getPeriodTimestamps(): { daily: number; weekly: number; monthly: number } {
  const now = new Date();

  // Start of today (midnight)
  const daily = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Start of this week (Sunday midnight)
  const dayOfWeek = now.getDay();
  const weekly = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();

  // Start of this month
  const monthly = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return { daily, weekly, monthly };
}

/**
 * Calculate profit for a specific period
 */
function calculatePeriodProfit(bets: Bet[], periodStart: number): number {
  let profit = 0;

  for (const bet of bets) {
    const betTime = bet.resolvedAt?.getTime() || bet.placedAt.getTime();
    if (betTime < periodStart) continue;

    if (bet.status === 'won') {
      profit += (bet.payout || 0) - bet.amount;
    } else if (bet.status === 'lost') {
      profit -= bet.amount;
    }
  }

  return Math.round(profit * 100) / 100;
}

/**
 * Calculate comprehensive user statistics
 */
export function calculateUserStats(userId: string): UserStats {
  const bets = getAllBets(userId);

  // Basic counts
  let totalBets = 0;
  let wins = 0;
  let losses = 0;
  let totalWagered = 0;
  let totalPayout = 0;
  let biggestWin = 0;
  let biggestLoss = 0;
  let totalMultiplier = 0;

  for (const bet of bets) {
    totalBets++;
    totalWagered += bet.amount;
    totalMultiplier += bet.multiplier;

    if (bet.status === 'won') {
      wins++;
      const payout = bet.payout || 0;
      totalPayout += payout;
      const profit = payout - bet.amount;
      biggestWin = Math.max(biggestWin, profit);
    } else if (bet.status === 'lost') {
      losses++;
      biggestLoss = Math.max(biggestLoss, bet.amount);
    }
  }

  const completedBets = wins + losses;
  const winRate = completedBets > 0 ? Math.round((wins / completedBets) * 1000) / 1000 : 0;
  const profit = totalPayout - totalWagered;
  const averageBetSize = totalBets > 0 ? Math.round((totalWagered / totalBets) * 100) / 100 : 0;
  const averageMultiplier = totalBets > 0 ? Math.round((totalMultiplier / totalBets) * 100) / 100 : 0;

  // Calculate streaks
  const streaks = calculateStreaks(bets);

  // Calculate period profits
  const periods = getPeriodTimestamps();

  return {
    totalBets,
    wins,
    losses,
    winRate,
    totalWagered: Math.round(totalWagered * 100) / 100,
    totalPayout: Math.round(totalPayout * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    biggestWin: Math.round(biggestWin * 100) / 100,
    biggestLoss: Math.round(biggestLoss * 100) / 100,
    currentStreak: streaks.currentStreak,
    longestWinStreak: streaks.longestWinStreak,
    longestLossStreak: streaks.longestLossStreak,
    averageBetSize,
    averageMultiplier,
    profitByPeriod: {
      daily: calculatePeriodProfit(bets, periods.daily),
      weekly: calculatePeriodProfit(bets, periods.weekly),
      monthly: calculatePeriodProfit(bets, periods.monthly),
    },
  };
}

// ============================================
// Profile Retrieval
// ============================================

/**
 * Get user profile with stats
 */
export function getUserProfile(userId: string): UserProfile | null {
  // Get user record from auth service
  const userRecord = getUserById(userId);

  if (!userRecord) {
    // Check if user exists in bet service
    const userState = getUser(userId);
    if (!userState) {
      return null;
    }

    // Create profile from bet service user state
    const stats = calculateUserStats(userId);
    const rank = getUserRank(userId, 'alltime');

    return {
      id: userId,
      walletAddress: `unknown_${userId.slice(0, 8)}`,
      username: null,
      avatarUrl: null,
      balance: userState.balance,
      createdAt: new Date().toISOString(),
      isDemo: userId.startsWith('demo'),
      rank: rank?.rank,
      stats,
    };
  }

  // Build profile from auth service user record
  const stats = calculateUserStats(userId);
  const rank = getUserRank(userId, 'alltime');

  return {
    id: userRecord.id,
    walletAddress: userRecord.walletAddress,
    username: userRecord.displayName,
    avatarUrl: userRecord.avatarUrl,
    balance: userRecord.balance,
    createdAt: userRecord.createdAt.toISOString(),
    isDemo: userRecord.isDemo,
    rank: rank?.rank,
    stats,
  };
}

/**
 * Get user stats only (lightweight)
 */
export function getUserStats(userId: string): UserStats | null {
  // Check if user exists
  const userRecord = getUserById(userId);
  const userState = getUser(userId);

  if (!userRecord && !userState) {
    return null;
  }

  return calculateUserStats(userId);
}

// ============================================
// Bet History
// ============================================

/**
 * Convert Bet to BetHistoryItem
 */
function betToHistoryItem(bet: Bet): BetHistoryItem {
  const payout = bet.payout || 0;
  const profit = bet.status === 'won'
    ? payout - bet.amount
    : bet.status === 'lost'
      ? -bet.amount
      : 0;

  return {
    id: bet.id,
    amount: bet.amount,
    targetPrice: bet.targetPrice,
    priceAtPlacement: bet.priceAtPlacement,
    multiplier: bet.multiplier,
    status: bet.status,
    placedAt: bet.placedAt.toISOString(),
    resolvedAt: bet.resolvedAt?.toISOString() || null,
    payout: bet.payout,
    profit: Math.round(profit * 100) / 100,
    targetTime: bet.targetTime.toISOString(),
  };
}

/**
 * Get paginated bet history for a user
 */
export function getBetHistory(
  userId: string,
  limit: number = DEFAULT_HISTORY_LIMIT,
  offset: number = 0
): BetHistoryResponse {
  // Validate parameters
  const validLimit = Math.min(Math.max(1, limit), MAX_HISTORY_LIMIT);
  const validOffset = Math.max(0, offset);

  // Get all bets for the user
  const allBets = getAllBets(userId);

  // Sort by placed time (newest first)
  const sortedBets = [...allBets].sort(
    (a, b) => b.placedAt.getTime() - a.placedAt.getTime()
  );

  // Apply pagination
  const paginatedBets = sortedBets.slice(validOffset, validOffset + validLimit);

  // Convert to history items
  const history = paginatedBets.map(betToHistoryItem);

  return {
    history,
    total: allBets.length,
    limit: validLimit,
    offset: validOffset,
    hasMore: validOffset + validLimit < allBets.length,
  };
}

/**
 * Get full user profile response with recent bets
 */
export function getUserProfileResponse(
  userId: string,
  recentBetsLimit: number = 5
): UserProfileResponse | null {
  const profile = getUserProfile(userId);

  if (!profile) {
    return null;
  }

  const historyResponse = getBetHistory(userId, recentBetsLimit, 0);

  return {
    profile,
    recentBets: historyResponse.history,
  };
}

// ============================================
// Public Profile (Limited Data)
// ============================================

/**
 * Get public profile for viewing other users (limited data)
 */
export function getPublicProfile(userId: string): Partial<UserProfile> | null {
  const fullProfile = getUserProfile(userId);

  if (!fullProfile) {
    return null;
  }

  // Return limited public data
  return {
    id: fullProfile.id,
    username: fullProfile.username,
    avatarUrl: fullProfile.avatarUrl,
    rank: fullProfile.rank,
    stats: {
      totalBets: fullProfile.stats.totalBets,
      wins: fullProfile.stats.wins,
      losses: fullProfile.stats.losses,
      winRate: fullProfile.stats.winRate,
      profit: fullProfile.stats.profit,
      // Exclude sensitive stats
      totalWagered: 0,
      totalPayout: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: fullProfile.stats.currentStreak,
      longestWinStreak: fullProfile.stats.longestWinStreak,
      longestLossStreak: 0,
      averageBetSize: 0,
      averageMultiplier: 0,
      profitByPeriod: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
    },
  };
}

// ============================================
// Best/Worst Bet Analysis
// ============================================

/**
 * Get the best and worst bets for a user
 */
export function getBestWorstBets(userId: string): {
  bestBet: BetHistoryItem | null;
  worstBet: BetHistoryItem | null;
} {
  const bets = getAllBets(userId);

  let bestBet: Bet | null = null;
  let bestProfit = -Infinity;
  let worstBet: Bet | null = null;
  let worstProfit = Infinity;

  for (const bet of bets) {
    if (bet.status === 'won') {
      const profit = (bet.payout || 0) - bet.amount;
      if (profit > bestProfit) {
        bestProfit = profit;
        bestBet = bet;
      }
    } else if (bet.status === 'lost') {
      const profit = -bet.amount;
      if (profit < worstProfit) {
        worstProfit = profit;
        worstBet = bet;
      }
    }
  }

  return {
    bestBet: bestBet ? betToHistoryItem(bestBet) : null,
    worstBet: worstBet ? betToHistoryItem(worstBet) : null,
  };
}

// ============================================
// Exports
// ============================================

export {
  DEFAULT_HISTORY_LIMIT,
  MAX_HISTORY_LIMIT,
};
