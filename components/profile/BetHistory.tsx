"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Loader2 } from "lucide-react";
import type { BetHistoryItem } from "@/hooks/useProfile";

interface BetHistoryProps {
  bets: BetHistoryItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

// Format date relative to now
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Format currency
function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Loading skeleton
function BetHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-pulse-bg-secondary/30 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-pulse-bg-secondary" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-pulse-bg-secondary rounded mb-2" />
              <div className="h-3 w-16 bg-pulse-bg-secondary/50 rounded" />
            </div>
            <div className="text-right">
              <div className="h-4 w-16 bg-pulse-bg-secondary rounded mb-2" />
              <div className="h-3 w-12 bg-pulse-bg-secondary/50 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Single bet history item
function BetHistoryRow({ bet, index }: { bet: BetHistoryItem; index: number }) {
  const isWin = bet.result === "won";
  const profit = isWin ? bet.payout - bet.amount : -bet.amount;

  return (
    <motion.div
      className={`
        p-4 rounded-xl border transition-all
        ${isWin
          ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
          : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
        }
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center gap-4">
        {/* Result Icon */}
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isWin ? "bg-green-500/20" : "bg-red-500/20"}
          `}
        >
          {isWin ? (
            <TrendingUp className="w-5 h-5 text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" />
          )}
        </div>

        {/* Bet Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {formatCurrency(bet.amount)}
            </span>
            <span className="text-pulse-text-secondary">@</span>
            <span className="text-pulse-multiplier font-medium">
              {bet.multiplier.toFixed(1)}x
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-pulse-text-secondary">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeDate(bet.date)}</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline font-mono text-xs">
              Target: ${bet.targetPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Result */}
        <div className="text-right">
          <div
            className={`font-bold ${isWin ? "text-green-400" : "text-red-400"}`}
          >
            {isWin ? "+" : ""}{formatCurrency(profit)}
          </div>
          <div className="text-xs text-pulse-text-secondary uppercase font-medium">
            {bet.result}
          </div>
        </div>
      </div>

      {/* Payout details for wins */}
      {isWin && (
        <div className="mt-2 pt-2 border-t border-green-500/10 text-sm text-pulse-text-secondary">
          Payout: {formatCurrency(bet.payout)}
        </div>
      )}
    </motion.div>
  );
}

export default function BetHistory({
  bets,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  className = "",
}: BetHistoryProps) {
  if (isLoading) {
    return <BetHistorySkeleton />;
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-12 bg-pulse-bg-secondary/30 rounded-xl border border-pulse-pink/10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pulse-bg-secondary/50 flex items-center justify-center">
          <Clock className="w-8 h-8 text-pulse-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Bet History</h3>
        <p className="text-pulse-text-secondary max-w-sm mx-auto">
          Your bet history will appear here once you start trading.
        </p>
      </div>
    );
  }

  // Calculate summary
  const wins = bets.filter((b) => b.result === "won").length;
  const losses = bets.length - wins;
  const totalProfit = bets.reduce((sum, b) => {
    return sum + (b.result === "won" ? b.payout - b.amount : -b.amount);
  }, 0);

  return (
    <div className={className}>
      {/* Summary Header */}
      <div className="mb-4 p-4 rounded-xl bg-pulse-bg-secondary/30 border border-pulse-pink/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-pulse-text-secondary">Recent Bets</p>
            <p className="text-lg font-semibold text-white">{bets.length} bets</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-pulse-text-secondary">Wins: </span>
              <span className="text-green-400 font-semibold">{wins}</span>
            </div>
            <div>
              <span className="text-pulse-text-secondary">Losses: </span>
              <span className="text-red-400 font-semibold">{losses}</span>
            </div>
            <div>
              <span className="text-pulse-text-secondary">P/L: </span>
              <span className={`font-semibold ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bet List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {bets.map((bet, index) => (
            <BetHistoryRow key={bet.id} bet={bet} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 rounded-xl bg-pulse-bg-secondary/50 border border-pulse-pink/20 text-white hover:bg-pulse-bg-secondary hover:border-pulse-pink/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
