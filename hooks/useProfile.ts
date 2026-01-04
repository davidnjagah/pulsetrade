"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "@/context/AuthContext";

export interface ProfileStats {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalWagered: number;
  biggestWin: number;
  longestWinStreak: number;
  rank: number | null;
}

export interface BetHistoryItem {
  id: string;
  date: Date;
  amount: number;
  multiplier: number;
  targetPrice: number;
  result: "won" | "lost";
  payout: number;
}

interface UseProfileOptions {
  userId?: string;
}

interface UseProfileReturn {
  user: {
    id: string;
    walletAddress: string;
    username: string;
    avatarColor: string;
    joinedAt: Date;
  } | null;
  stats: ProfileStats;
  betHistory: BetHistoryItem[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  refresh: () => void;
  loadMoreHistory: () => void;
  hasMoreHistory: boolean;
}

// Generate mock bet history
function generateMockBetHistory(count: number, offset: number = 0): BetHistoryItem[] {
  const history: BetHistoryItem[] = [];
  const baseDate = new Date();

  for (let i = 0; i < count; i++) {
    const index = offset + i;
    const hoursAgo = index * (Math.random() * 3 + 0.5); // Random hours between bets
    const date = new Date(baseDate.getTime() - hoursAgo * 60 * 60 * 1000);

    const amount = [1, 3, 5, 10][Math.floor(Math.random() * 4)];
    const multiplier = Math.round((1.2 + Math.random() * 3) * 10) / 10;
    const won = Math.random() < 0.45; // 45% win rate for mock
    const payout = won ? Math.round(amount * multiplier * 100) / 100 : 0;

    history.push({
      id: `bet_history_${index}_${Date.now()}`,
      date,
      amount,
      multiplier,
      targetPrice: 97000 + Math.floor(Math.random() * 2000),
      result: won ? "won" : "lost",
      payout,
    });
  }

  return history;
}

// Calculate stats from bet history
function calculateStats(history: BetHistoryItem[]): ProfileStats {
  if (history.length === 0) {
    return {
      totalBets: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalProfit: 0,
      totalWagered: 0,
      biggestWin: 0,
      longestWinStreak: 0,
      rank: null,
    };
  }

  const wins = history.filter((b) => b.result === "won").length;
  const losses = history.length - wins;
  const totalWagered = history.reduce((sum, b) => sum + b.amount, 0);
  const totalPayout = history.reduce((sum, b) => sum + b.payout, 0);
  const totalProfit = totalPayout - totalWagered;

  // Find biggest win
  const biggestWin = Math.max(
    0,
    ...history.filter((b) => b.result === "won").map((b) => b.payout - b.amount)
  );

  // Calculate longest win streak
  let longestStreak = 0;
  let currentStreak = 0;
  // Sort by date descending for streak calculation
  const sortedHistory = [...history].sort((a, b) => b.date.getTime() - a.date.getTime());
  for (const bet of sortedHistory) {
    if (bet.result === "won") {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return {
    totalBets: history.length,
    wins,
    losses,
    winRate: Math.round((wins / history.length) * 1000) / 10,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalWagered: Math.round(totalWagered * 100) / 100,
    biggestWin: Math.round(biggestWin * 100) / 100,
    longestWinStreak: longestStreak,
    rank: Math.floor(Math.random() * 100) + 1, // Mock rank
  };
}

const PAGE_SIZE = 10;

export function useProfile(options: UseProfileOptions = {}): UseProfileReturn {
  const { userId: providedUserId } = options;
  const { user: authUser, walletAddress, isConnected } = useAuthContext();

  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Determine which user to fetch
  const userId = providedUserId || authUser?.id;

  // Build user object
  const user = useMemo(() => {
    if (!isConnected || !authUser || !walletAddress) {
      return null;
    }

    return {
      id: authUser.id,
      walletAddress: walletAddress,
      username: authUser.displayName || "Anonymous",
      avatarColor: authUser.avatarColor || "#ff69b4",
      joinedAt: authUser.createdAt ? new Date(authUser.createdAt) : new Date(),
    };
  }, [isConnected, authUser, walletAddress]);

  // Calculate stats from history
  const stats = useMemo(() => calculateStats(betHistory), [betHistory]);

  // Initial fetch
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Generate mock bet history
      const mockHistory = generateMockBetHistory(PAGE_SIZE);
      setBetHistory(mockHistory);
      setHasMoreHistory(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load more history
  const loadMoreHistory = useCallback(async () => {
    if (isLoadingHistory || !hasMoreHistory) return;

    setIsLoadingHistory(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      const newHistory = generateMockBetHistory(PAGE_SIZE, betHistory.length);

      // Simulate end of history after 50 items
      if (betHistory.length + newHistory.length >= 50) {
        setHasMoreHistory(false);
      }

      setBetHistory((prev) => [...prev, ...newHistory]);
    } catch (err) {
      console.error("Failed to load more history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, hasMoreHistory, betHistory.length]);

  // Fetch on mount and user change
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Manual refresh
  const refresh = useCallback(() => {
    setBetHistory([]);
    setHasMoreHistory(true);
    fetchProfile();
  }, [fetchProfile]);

  return {
    user,
    stats,
    betHistory,
    isLoading,
    isLoadingHistory,
    error,
    refresh,
    loadMoreHistory,
    hasMoreHistory,
  };
}

export default useProfile;
