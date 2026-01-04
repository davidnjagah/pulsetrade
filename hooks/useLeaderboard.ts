"use client";

import { useState, useEffect, useCallback } from "react";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  walletAddress: string;
  username: string;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
  isCurrentUser?: boolean;
}

export type LeaderboardPeriod = "daily" | "weekly" | "alltime";

interface UseLeaderboardOptions {
  initialPeriod?: LeaderboardPeriod;
  currentUserId?: string;
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  period: LeaderboardPeriod;
  setPeriod: (period: LeaderboardPeriod) => void;
  refresh: () => void;
  currentUserRank: number | null;
}

// Mock usernames for demo
const mockUsernames = [
  "CryptoKing",
  "SolanaWhale",
  "TradeBot3000",
  "DiamondHands",
  "MoonShooter",
  "DegenTrader",
  "PulseHunter",
  "WinStreak",
  "BullRunner",
  "SOLdier",
  "ChartMaster",
  "YieldFarmer",
  "TokenTycoon",
  "WhaleWatcher",
  "GainGoblin",
  "ProfitPunk",
  "CandleReader",
  "AlphaSeeker",
  "BetaBreaker",
  "GammaGainer",
];

// Generate mock wallet address
function generateWalletAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let address = "";
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

// Generate mock leaderboard data
function generateMockLeaderboard(
  period: LeaderboardPeriod,
  currentUserId?: string
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  const count = period === "daily" ? 15 : period === "weekly" ? 25 : 50;

  // Scale factors based on period
  const profitMultiplier = period === "daily" ? 1 : period === "weekly" ? 5 : 30;
  const betMultiplier = period === "daily" ? 1 : period === "weekly" ? 4 : 20;

  for (let i = 0; i < count; i++) {
    // Higher ranked users have better stats
    const baseWinRate = Math.max(35, 75 - i * 1.5);
    const winRate = baseWinRate + Math.random() * 10 - 5;
    const totalBets = Math.floor(
      (50 + Math.random() * 100) * betMultiplier - i * betMultiplier * 0.3
    );
    const wins = Math.floor((totalBets * winRate) / 100);
    const losses = totalBets - wins;

    // Profit calculation based on win rate and rank
    const baseProfit = (Math.max(0, winRate - 40) * 50 - i * 10) * profitMultiplier;
    const profit = baseProfit + (Math.random() * 200 - 100) * profitMultiplier;

    const entry: LeaderboardEntry = {
      rank: i + 1,
      id: `user_${i}_${period}`,
      walletAddress: generateWalletAddress(),
      username: mockUsernames[i % mockUsernames.length] + (i >= 20 ? (i - 19).toString() : ""),
      wins,
      losses,
      winRate: Math.round(winRate * 10) / 10,
      profit: Math.round(profit * 100) / 100,
      isCurrentUser: false,
    };

    entries.push(entry);
  }

  // Sort by profit
  entries.sort((a, b) => b.profit - a.profit);

  // Reassign ranks after sorting
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // If we have a current user, add them to the leaderboard if not already there
  if (currentUserId) {
    const currentUserIndex = Math.floor(Math.random() * Math.min(20, entries.length));
    if (entries[currentUserIndex]) {
      entries[currentUserIndex].isCurrentUser = true;
      entries[currentUserIndex].id = currentUserId;
      entries[currentUserIndex].username = "You";
    }
  }

  return entries;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const { initialPeriod = "daily", currentUserId } = options;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);

  // Find current user's rank
  const currentUserRank = entries.find((e) => e.isCurrentUser)?.rank ?? null;

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate mock data for demo
      const mockData = generateMockLeaderboard(period, currentUserId);
      setEntries(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, [period, currentUserId]);

  // Fetch on mount and period change
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    isLoading,
    error,
    period,
    setPeriod,
    refresh,
    currentUserRank,
  };
}

export default useLeaderboard;
