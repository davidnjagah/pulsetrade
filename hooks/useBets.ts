"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { BetStatus } from "@/components/trading/BetChip";

export interface Bet {
  id: string;
  amount: number;
  targetPrice: number;
  targetTime: number; // timestamp when bet expires
  multiplier: number;
  status: BetStatus;
  placedAt: number; // timestamp when bet was placed
  cellId: string; // grid cell identifier
  potentialWin: number;
  resolvedAt?: number;
  actualPrice?: number;
}

interface BetResolution {
  betId: string;
  won: boolean;
  payout: number;
  actualPrice: number;
}

interface UseBetsOptions {
  initialBalance?: number;
  onWin?: (bet: Bet, payout: number) => void;
  onLoss?: (bet: Bet) => void;
  mockResolution?: boolean; // Enable mock bet resolution for demo
}

interface UseBetsReturn {
  bets: Bet[];
  activeBets: Bet[];
  balance: number;
  totalPotentialWin: number;
  placeBet: (
    amount: number,
    targetPrice: number,
    targetTime: number,
    multiplier: number,
    cellId: string
  ) => Bet | null;
  removeBet: (betId: string) => void;
  resolveBet: (resolution: BetResolution) => void;
  clearAllBets: () => void;
  getBetsByCell: (cellId: string) => Bet[];
  setBalance: (amount: number | ((prev: number) => number)) => void;
}

function generateBetId(): string {
  return `bet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function useBets(options: UseBetsOptions = {}): UseBetsReturn {
  const {
    initialBalance = 2566.52,
    onWin,
    onLoss,
    mockResolution = true,
  } = options;

  const [bets, setBets] = useState<Bet[]>([]);
  const [balance, setBalance] = useState(initialBalance);
  const mockResolutionTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get only active bets
  const activeBets = bets.filter((bet) => bet.status === "active" || bet.status === "pending");

  // Calculate total potential win from active bets
  const totalPotentialWin = activeBets.reduce((sum, bet) => sum + bet.potentialWin, 0);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      mockResolutionTimers.current.forEach((timer) => clearTimeout(timer));
      mockResolutionTimers.current.clear();
    };
  }, []);

  // Place a new bet
  const placeBet = useCallback(
    (
      amount: number,
      targetPrice: number,
      targetTime: number,
      multiplier: number,
      cellId: string
    ): Bet | null => {
      // Validate bet
      if (amount <= 0) {
        console.error("Bet amount must be positive");
        return null;
      }

      if (amount > balance) {
        console.error("Insufficient balance");
        return null;
      }

      if (multiplier < 1) {
        console.error("Invalid multiplier");
        return null;
      }

      // Create new bet
      const newBet: Bet = {
        id: generateBetId(),
        amount,
        targetPrice,
        targetTime,
        multiplier,
        status: "active",
        placedAt: Date.now(),
        cellId,
        potentialWin: amount * multiplier,
      };

      // Deduct from balance
      setBalance((prev) => prev - amount);

      // Add bet to list
      setBets((prev) => [...prev, newBet]);

      // If mock resolution is enabled, simulate bet resolution
      if (mockResolution) {
        const resolutionTime = Math.max(targetTime - Date.now(), 3000); // At least 3 seconds
        const timer = setTimeout(() => {
          // Randomly determine win/loss (40% win rate for demo)
          const won = Math.random() < 0.4;
          const actualPrice = won
            ? targetPrice
            : targetPrice + (Math.random() > 0.5 ? 100 : -100);

          resolveBet({
            betId: newBet.id,
            won,
            payout: won ? newBet.potentialWin : 0,
            actualPrice,
          });

          mockResolutionTimers.current.delete(newBet.id);
        }, resolutionTime);

        mockResolutionTimers.current.set(newBet.id, timer);
      }

      return newBet;
    },
    [balance, mockResolution]
  );

  // Remove a bet (cancel/refund)
  const removeBet = useCallback((betId: string) => {
    setBets((prev) => {
      const bet = prev.find((b) => b.id === betId);
      if (bet && (bet.status === "active" || bet.status === "pending")) {
        // Refund the bet amount
        setBalance((prevBalance) => prevBalance + bet.amount);

        // Clear any mock resolution timer
        const timer = mockResolutionTimers.current.get(betId);
        if (timer) {
          clearTimeout(timer);
          mockResolutionTimers.current.delete(betId);
        }

        return prev.filter((b) => b.id !== betId);
      }
      return prev;
    });
  }, []);

  // Resolve a bet (win/loss)
  const resolveBet = useCallback(
    (resolution: BetResolution) => {
      setBets((prev) => {
        const betIndex = prev.findIndex((b) => b.id === resolution.betId);
        if (betIndex === -1) return prev;

        const bet = prev[betIndex];
        if (bet.status !== "active" && bet.status !== "pending") return prev;

        const updatedBet: Bet = {
          ...bet,
          status: resolution.won ? "won" : "lost",
          resolvedAt: Date.now(),
          actualPrice: resolution.actualPrice,
        };

        // Update balance if won
        if (resolution.won) {
          setBalance((prevBalance) => prevBalance + resolution.payout);
          onWin?.(updatedBet, resolution.payout);
        } else {
          onLoss?.(updatedBet);
        }

        const newBets = [...prev];
        newBets[betIndex] = updatedBet;
        return newBets;
      });
    },
    [onWin, onLoss]
  );

  // Clear all bets (refund active ones)
  const clearAllBets = useCallback(() => {
    setBets((prev) => {
      // Calculate total refund
      const refund = prev
        .filter((b) => b.status === "active" || b.status === "pending")
        .reduce((sum, b) => sum + b.amount, 0);

      if (refund > 0) {
        setBalance((prevBalance) => prevBalance + refund);
      }

      // Clear all timers
      mockResolutionTimers.current.forEach((timer) => clearTimeout(timer));
      mockResolutionTimers.current.clear();

      return [];
    });
  }, []);

  // Get bets for a specific grid cell
  const getBetsByCell = useCallback(
    (cellId: string): Bet[] => {
      return bets.filter((bet) => bet.cellId === cellId);
    },
    [bets]
  );

  return {
    bets,
    activeBets,
    balance,
    totalPotentialWin,
    placeBet,
    removeBet,
    resolveBet,
    clearAllBets,
    getBetsByCell,
    setBalance,
  };
}

// Export types for external use
export type { BetResolution };
