/**
 * PulseTrade Leaderboard Service
 * Handles leaderboard calculations, caching, and ranking
 *
 * Features:
 * - Calculate rankings from bet data
 * - Support daily, weekly, and all-time periods
 * - Cache leaderboard data (60 second refresh)
 * - Mock data seeding for demo mode
 */

import {
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardPeriod,
  Bet,
} from './types';
import { getAllBets, getBetStats } from './betService';
import { getUserById, getTotalUsersCount } from './authService';

// ============================================
// Configuration
// ============================================

const CACHE_DURATION_MS = 60 * 1000; // 60 seconds cache
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

// ============================================
// Types
// ============================================

interface CachedLeaderboard {
  data: LeaderboardResponse;
  timestamp: number;
}

interface UserAggregatedStats {
  userId: string;
  username: string;
  avatarUrl: string | null;
  walletAddress: string;
  wins: number;
  losses: number;
  profit: number;
  totalBets: number;
  streak: number;
  bets: Bet[];
}

// ============================================
// In-Memory Storage
// ============================================

// Leaderboard cache: period -> cached data
const leaderboardCache = new Map<LeaderboardPeriod, CachedLeaderboard>();

// Mock users for demo/testing
const mockUsers: Map<string, {
  userId: string;
  username: string;
  avatarUrl: string | null;
  walletAddress: string;
}> = new Map();

// Track all users who have placed bets
const userBetStats = new Map<string, UserAggregatedStats>();

// ============================================
// Mock Data Generation
// ============================================

const MOCK_USERNAMES = [
  'CryptoKing', 'MoonTrader', 'DiamondHands', 'SolWhale', 'DegenzLive',
  'PumpMaster', 'AlphaTrader', 'WenLambo', 'BullRunner', 'WAGMI_Trader',
  'PaperHands', 'BearSlayer', 'TokenKing', 'NFT_Hunter', 'YieldFarmer',
  'GasFeeHater', 'RugPuller69', 'SafeMoonBoy', 'APE_Together', 'HODLer4Life',
  'FloorSweeper', 'LiquidityKing', 'StakeNBake', 'DeFi_Degen', 'MEV_Bot'
];

/**
 * Generate a random wallet address
 */
function generateMockWallet(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate mock leaderboard data for demo
 */
function generateMockLeaderboardData(period: LeaderboardPeriod, count: number): UserAggregatedStats[] {
  const mockData: UserAggregatedStats[] = [];
  const usedNames = new Set<string>();

  // Scale factors based on period
  const scaleFactor = period === 'daily' ? 1 : period === 'weekly' ? 5 : 20;

  for (let i = 0; i < count; i++) {
    // Get unique username
    let username = MOCK_USERNAMES[i % MOCK_USERNAMES.length];
    if (usedNames.has(username)) {
      username = `${username}_${i}`;
    }
    usedNames.add(username);

    const userId = `mock_user_${i}`;
    const walletAddress = generateMockWallet();

    // Generate realistic stats
    // Top users have better win rates
    const rankFactor = 1 - (i / count) * 0.5; // 1.0 to 0.5
    const baseWinRate = 0.3 + Math.random() * 0.4 * rankFactor; // 30-70% win rate
    const totalBets = Math.floor((20 + Math.random() * 180) * scaleFactor);
    const wins = Math.floor(totalBets * baseWinRate);
    const losses = totalBets - wins;

    // Profit calculation with variance
    const avgBetSize = 5 + Math.random() * 20;
    const avgMultiplier = 1.5 + Math.random() * 2;
    const grossWinnings = wins * avgBetSize * avgMultiplier;
    const grossLosses = losses * avgBetSize;
    const profit = Math.round((grossWinnings - grossLosses) * 100) / 100;

    // Random streak (-5 to +5)
    const streak = Math.floor(Math.random() * 11) - 5;

    mockData.push({
      userId,
      username,
      avatarUrl: null,
      walletAddress,
      wins,
      losses,
      profit,
      totalBets,
      streak,
      bets: [],
    });

    // Store in mock users for later retrieval
    mockUsers.set(userId, {
      userId,
      username,
      avatarUrl: null,
      walletAddress,
    });
  }

  // Sort by profit descending
  mockData.sort((a, b) => b.profit - a.profit);

  return mockData;
}

/**
 * Seed leaderboard with mock data
 */
export function seedLeaderboardData(): void {
  console.log('[LeaderboardService] Seeding mock leaderboard data...');

  // Generate different amounts based on period
  const dailyData = generateMockLeaderboardData('daily', 25);
  const weeklyData = generateMockLeaderboardData('weekly', 50);
  const alltimeData = generateMockLeaderboardData('alltime', 100);

  // Store in user stats
  dailyData.forEach(user => userBetStats.set(`daily_${user.userId}`, user));
  weeklyData.forEach(user => userBetStats.set(`weekly_${user.userId}`, user));
  alltimeData.forEach(user => userBetStats.set(`alltime_${user.userId}`, user));

  console.log('[LeaderboardService] Seeded mock data: daily=25, weekly=50, alltime=100');
}

// ============================================
// Data Aggregation
// ============================================

/**
 * Get period start timestamp
 */
function getPeriodStartTime(period: LeaderboardPeriod): number {
  const now = new Date();

  switch (period) {
    case 'daily':
      // Start of today (midnight)
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    case 'weekly':
      // Start of this week (Sunday midnight)
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      return weekStart.getTime();

    case 'alltime':
    default:
      return 0; // Include all bets
  }
}

/**
 * Calculate streak from bets
 */
function calculateStreak(bets: Bet[]): number {
  if (bets.length === 0) return 0;

  // Sort by resolved time (newest first)
  const sortedBets = [...bets]
    .filter(b => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => {
      const aTime = a.resolvedAt?.getTime() || 0;
      const bTime = b.resolvedAt?.getTime() || 0;
      return bTime - aTime;
    });

  if (sortedBets.length === 0) return 0;

  const firstStatus = sortedBets[0].status;
  let streak = 0;

  for (const bet of sortedBets) {
    if (bet.status === firstStatus) {
      streak++;
    } else {
      break;
    }
  }

  return firstStatus === 'won' ? streak : -streak;
}

/**
 * Aggregate bet data for all users
 */
function aggregateUserStats(period: LeaderboardPeriod): UserAggregatedStats[] {
  const periodStart = getPeriodStartTime(period);
  const userStats = new Map<string, UserAggregatedStats>();

  // Get all users with bets from betService
  // Note: In production, this would query the database
  // For demo, we'll combine real bets with mock data

  // First, get mock data for the period
  const mockKey = period;
  const mockEntries: UserAggregatedStats[] = [];

  userBetStats.forEach((stats, key) => {
    if (key.startsWith(mockKey)) {
      mockEntries.push(stats);
    }
  });

  // Add mock entries to user stats
  mockEntries.forEach(mock => {
    userStats.set(mock.userId, mock);
  });

  // Then add real user data (this would be fetched from DB in production)
  // For now, we'll use the betService which has in-memory bets

  return Array.from(userStats.values());
}

// ============================================
// Leaderboard Generation
// ============================================

/**
 * Generate leaderboard entries from aggregated stats
 */
function generateLeaderboard(
  stats: UserAggregatedStats[],
  limit: number
): LeaderboardEntry[] {
  // Sort by profit (descending)
  const sorted = [...stats].sort((a, b) => b.profit - a.profit);

  // Slice to limit and add ranks
  return sorted.slice(0, limit).map((user, index) => ({
    rank: index + 1,
    userId: user.userId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    walletAddress: user.walletAddress,
    wins: user.wins,
    losses: user.losses,
    profit: user.profit,
    winRate: user.totalBets > 0 ? Math.round((user.wins / user.totalBets) * 1000) / 1000 : 0,
    totalBets: user.totalBets,
    streak: user.streak,
  }));
}

// ============================================
// Public API
// ============================================

/**
 * Get leaderboard data
 *
 * @param period - Time period (daily, weekly, alltime)
 * @param limit - Maximum entries to return
 * @param forceRefresh - Bypass cache
 * @returns Leaderboard response
 */
export function getLeaderboard(
  period: LeaderboardPeriod = 'alltime',
  limit: number = DEFAULT_LIMIT,
  forceRefresh: boolean = false
): LeaderboardResponse {
  // Validate limit
  const validLimit = Math.min(Math.max(1, limit), MAX_LIMIT);

  // Check cache
  const cached = leaderboardCache.get(period);
  const now = Date.now();

  if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
    // Return cached data (possibly sliced to limit)
    const slicedLeaderboard = cached.data.leaderboard.slice(0, validLimit);
    return {
      ...cached.data,
      leaderboard: slicedLeaderboard,
    };
  }

  // Generate fresh leaderboard
  console.log(`[LeaderboardService] Generating fresh ${period} leaderboard...`);

  // Ensure mock data is seeded
  if (userBetStats.size === 0) {
    seedLeaderboardData();
  }

  const stats = aggregateUserStats(period);
  const leaderboard = generateLeaderboard(stats, MAX_LIMIT);

  const response: LeaderboardResponse = {
    leaderboard: leaderboard.slice(0, validLimit),
    totalUsers: stats.length,
    period,
    generatedAt: new Date().toISOString(),
  };

  // Cache the full leaderboard
  leaderboardCache.set(period, {
    data: {
      ...response,
      leaderboard, // Store full leaderboard in cache
    },
    timestamp: now,
  });

  return response;
}

/**
 * Get a specific user's rank
 *
 * @param userId - User ID to find
 * @param period - Time period
 * @returns User's leaderboard entry or null
 */
export function getUserRank(
  userId: string,
  period: LeaderboardPeriod = 'alltime'
): LeaderboardEntry | null {
  // Get the full leaderboard
  const fullResponse = getLeaderboard(period, MAX_LIMIT);

  // Find the user in the leaderboard
  const userEntry = fullResponse.leaderboard.find(entry => entry.userId === userId);

  if (userEntry) {
    return userEntry;
  }

  // User not in top ranks - calculate their position
  // This would query the database in production
  return null;
}

/**
 * Add or update a user's stats for leaderboard
 * Called when a bet is resolved
 */
export function updateUserLeaderboardStats(
  userId: string,
  username: string,
  walletAddress: string,
  avatarUrl: string | null,
  bet: Bet
): void {
  // For each period, update the user's stats
  const periods: LeaderboardPeriod[] = ['daily', 'weekly', 'alltime'];

  for (const period of periods) {
    const periodStart = getPeriodStartTime(period);
    const betTime = bet.placedAt.getTime();

    // Only include bets within the period
    if (betTime < periodStart && period !== 'alltime') {
      continue;
    }

    const key = `${period}_${userId}`;
    let stats = userBetStats.get(key);

    if (!stats) {
      stats = {
        userId,
        username,
        avatarUrl,
        walletAddress,
        wins: 0,
        losses: 0,
        profit: 0,
        totalBets: 0,
        streak: 0,
        bets: [],
      };
    }

    // Update stats based on bet status
    stats.totalBets++;
    stats.bets.push(bet);

    if (bet.status === 'won') {
      stats.wins++;
      const payout = bet.payout || 0;
      stats.profit += payout - bet.amount;

      // Update streak
      if (stats.streak >= 0) {
        stats.streak++;
      } else {
        stats.streak = 1;
      }
    } else if (bet.status === 'lost') {
      stats.losses++;
      stats.profit -= bet.amount;

      // Update streak
      if (stats.streak <= 0) {
        stats.streak--;
      } else {
        stats.streak = -1;
      }
    }

    stats.profit = Math.round(stats.profit * 100) / 100;

    userBetStats.set(key, stats);

    // Invalidate cache for this period
    leaderboardCache.delete(period);
  }
}

/**
 * Get leaderboard statistics
 */
export function getLeaderboardStats() {
  return {
    cachedPeriods: Array.from(leaderboardCache.keys()),
    totalTrackedUsers: userBetStats.size,
    mockUsersCount: mockUsers.size,
    cacheAge: {
      daily: leaderboardCache.get('daily')
        ? Date.now() - leaderboardCache.get('daily')!.timestamp
        : null,
      weekly: leaderboardCache.get('weekly')
        ? Date.now() - leaderboardCache.get('weekly')!.timestamp
        : null,
      alltime: leaderboardCache.get('alltime')
        ? Date.now() - leaderboardCache.get('alltime')!.timestamp
        : null,
    },
  };
}

/**
 * Clear leaderboard cache
 */
export function clearLeaderboardCache(): void {
  leaderboardCache.clear();
  console.log('[LeaderboardService] Cache cleared');
}

/**
 * Clear all leaderboard data (for testing)
 */
export function clearAllLeaderboardData(): void {
  leaderboardCache.clear();
  userBetStats.clear();
  mockUsers.clear();
  console.log('[LeaderboardService] All data cleared');
}

// ============================================
// Initialize on module load
// ============================================

// Seed mock data on first import
seedLeaderboardData();
