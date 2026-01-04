"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SimpleAvatar } from "@/components/auth/UserAvatar";
import RankBadge from "./RankBadge";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  className?: string;
}

// Truncate wallet address
function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

// Format profit with + or - sign
function formatProfit(profit: number): string {
  const formatted = Math.abs(profit).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (profit > 0) return `+${formatted}`;
  if (profit < 0) return `-${formatted.replace("$", "")}`;
  return formatted;
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-pulse-bg-secondary/30 animate-pulse"
        >
          <div className="w-8 h-8 rounded-full bg-pulse-bg-secondary" />
          <div className="w-8 h-8 rounded-full bg-pulse-bg-secondary" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-pulse-bg-secondary rounded mb-2" />
            <div className="h-3 w-16 bg-pulse-bg-secondary/50 rounded" />
          </div>
          <div className="hidden md:block h-4 w-12 bg-pulse-bg-secondary rounded" />
          <div className="hidden md:block h-4 w-12 bg-pulse-bg-secondary rounded" />
          <div className="hidden md:block h-4 w-16 bg-pulse-bg-secondary rounded" />
          <div className="h-5 w-20 bg-pulse-bg-secondary rounded" />
        </div>
      ))}
    </div>
  );
}

// Mobile card view
function LeaderboardCard({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isTopThree = entry.rank <= 3;
  const isProfitable = entry.profit > 0;

  return (
    <motion.div
      className={`
        p-4 rounded-xl border transition-all
        ${entry.isCurrentUser
          ? "bg-pulse-pink/10 border-pulse-pink/40 shadow-pulse-glow"
          : isTopThree
          ? "bg-pulse-bg-secondary/60 border-pulse-pink/20"
          : "bg-pulse-bg-secondary/30 border-pulse-pink/10"
        }
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <RankBadge rank={entry.rank} size="md" />

        {/* Avatar */}
        <SimpleAvatar
          address={entry.walletAddress}
          displayName={entry.username}
          size="sm"
        />

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold truncate ${entry.isCurrentUser ? "text-pulse-pink" : "text-white"}`}>
              {entry.username}
            </span>
            {entry.isCurrentUser && (
              <span className="px-2 py-0.5 text-xs bg-pulse-pink/20 text-pulse-pink rounded-full">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-pulse-text-secondary font-mono">
            {truncateAddress(entry.walletAddress)}
          </p>
        </div>

        {/* Profit */}
        <div className="text-right">
          <div className={`font-bold ${isProfitable ? "text-green-400" : "text-red-400"}`}>
            {formatProfit(entry.profit)}
          </div>
          <div className="text-xs text-pulse-text-secondary">
            {entry.winRate.toFixed(1)}% WR
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 pt-3 border-t border-pulse-pink/10 flex justify-between text-sm">
        <div className="text-pulse-text-secondary">
          <span className="text-green-400 font-medium">{entry.wins}W</span>
          {" / "}
          <span className="text-red-400 font-medium">{entry.losses}L</span>
        </div>
        <div className="text-pulse-text-secondary">
          {entry.wins + entry.losses} bets
        </div>
      </div>
    </motion.div>
  );
}

// Desktop table row
function TableRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isTopThree = entry.rank <= 3;
  const isProfitable = entry.profit > 0;

  return (
    <motion.tr
      className={`
        border-b border-pulse-pink/5 transition-all
        ${entry.isCurrentUser
          ? "bg-pulse-pink/10"
          : isTopThree
          ? "bg-pulse-bg-secondary/40"
          : "hover:bg-pulse-bg-secondary/20"
        }
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Rank */}
      <td className="py-4 px-4">
        <RankBadge rank={entry.rank} size="sm" />
      </td>

      {/* User */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <SimpleAvatar
            address={entry.walletAddress}
            displayName={entry.username}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${entry.isCurrentUser ? "text-pulse-pink" : "text-white"}`}>
                {entry.username}
              </span>
              {entry.isCurrentUser && (
                <span className="px-1.5 py-0.5 text-[10px] bg-pulse-pink/20 text-pulse-pink rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-pulse-text-secondary font-mono">
              {truncateAddress(entry.walletAddress, 4)}
            </p>
          </div>
        </div>
      </td>

      {/* Wins */}
      <td className="py-4 px-4 text-center">
        <span className="text-green-400 font-medium">{entry.wins}</span>
      </td>

      {/* Losses */}
      <td className="py-4 px-4 text-center">
        <span className="text-red-400 font-medium">{entry.losses}</span>
      </td>

      {/* Win Rate */}
      <td className="py-4 px-4 text-center">
        <span className="text-pulse-text-secondary">{entry.winRate.toFixed(1)}%</span>
      </td>

      {/* Profit */}
      <td className="py-4 px-4 text-right">
        <span className={`font-bold ${isProfitable ? "text-green-400" : "text-red-400"}`}>
          {formatProfit(entry.profit)}
        </span>
      </td>
    </motion.tr>
  );
}

export default function LeaderboardTable({
  entries,
  isLoading = false,
  className = "",
}: LeaderboardTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pulse-bg-secondary/50 flex items-center justify-center">
          <span className="text-3xl">🏆</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Rankings Yet</h3>
        <p className="text-pulse-text-secondary">
          Be the first to climb the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, index) => (
            <LeaderboardCard key={entry.id} entry={entry} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-pulse-pink/20 text-pulse-text-secondary text-sm">
              <th className="py-3 px-4 text-left font-medium">Rank</th>
              <th className="py-3 px-4 text-left font-medium">User</th>
              <th className="py-3 px-4 text-center font-medium">Wins</th>
              <th className="py-3 px-4 text-center font-medium">Losses</th>
              <th className="py-3 px-4 text-center font-medium">Win Rate</th>
              <th className="py-3 px-4 text-right font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <TableRow key={entry.id} entry={entry} index={index} />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
