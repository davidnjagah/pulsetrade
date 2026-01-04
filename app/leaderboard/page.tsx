"use client";

import { motion } from "framer-motion";
import { Trophy, ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { LeaderboardTable } from "@/components/leaderboard";
import { useLeaderboard, type LeaderboardPeriod } from "@/hooks/useLeaderboard";
import { useAuthContext } from "@/context/AuthContext";

const periodOptions: { value: LeaderboardPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "alltime", label: "All Time" },
];

export default function LeaderboardPage() {
  const { user, isConnected } = useAuthContext();
  const {
    entries,
    isLoading,
    period,
    setPeriod,
    refresh,
    currentUserRank,
  } = useLeaderboard({
    currentUserId: user?.id,
  });

  return (
    <div className="min-h-screen bg-pulse-gradient">
      {/* Header */}
      <Header />

      {/* Sidebar */}
      <Sidebar activeItem="leaderboard" />

      {/* Main Content */}
      <main className="pt-14 pl-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Page Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-pulse-text-secondary hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Trade</span>
            </Link>

            {/* Title */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  <Trophy className="w-6 h-6 text-yellow-900" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Leaderboard
                  </h1>
                  <p className="text-pulse-text-secondary">
                    Top traders ranked by profit
                  </p>
                </div>
              </div>

              {/* Refresh button */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-pulse-bg-secondary/50 border border-pulse-pink/20 text-pulse-text-secondary hover:text-white hover:border-pulse-pink/40 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </motion.div>

          {/* Current User Rank Card (if connected) */}
          {isConnected && currentUserRank && (
            <motion.div
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-pulse-pink/20 to-pulse-bg-secondary border border-pulse-pink/30 shadow-pulse-glow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TrendingUp className="w-6 h-6 text-pulse-pink" />
                  <div>
                    <p className="text-sm text-pulse-text-secondary">Your Rank</p>
                    <p className="text-2xl font-bold text-white">
                      #{currentUserRank}
                      <span className="text-sm text-pulse-text-secondary ml-2">
                        of {entries.length}
                      </span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-lg bg-pulse-pink/20 text-pulse-pink hover:bg-pulse-pink/30 transition-colors text-sm font-medium"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          )}

          {/* Period Tabs */}
          <motion.div
            className="mb-6 flex gap-2 p-1 bg-pulse-bg-secondary/50 rounded-xl border border-pulse-pink/10 w-fit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${period === option.value
                    ? "bg-pulse-pink text-white shadow-pulse-glow"
                    : "text-pulse-text-secondary hover:text-white hover:bg-pulse-bg-secondary/50"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            className="bg-pulse-bg-secondary/30 rounded-2xl border border-pulse-pink/10 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LeaderboardTable entries={entries} isLoading={isLoading} />
          </motion.div>

          {/* Footer Info */}
          <motion.div
            className="mt-6 text-center text-sm text-pulse-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p>Rankings update in real-time as bets are resolved.</p>
            <p className="mt-1">
              Period: {period === "daily" ? "Last 24 hours" : period === "weekly" ? "Last 7 days" : "All time"}
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
