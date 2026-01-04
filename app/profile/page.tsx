"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Award,
  Flame,
  Copy,
  Check,
  Edit2,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { StatsGrid } from "@/components/profile/StatsCard";
import BetHistory from "@/components/profile/BetHistory";
import { RankBadgeInline } from "@/components/leaderboard/RankBadge";
import { useProfile } from "@/hooks/useProfile";
import { useAuthContext } from "@/context/AuthContext";

// Truncate wallet address
function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

// Generate gradient from wallet address
function generateGradient(address: string): string {
  const colors = [
    ["#ff69b4", "#ff1493"],
    ["#ff1493", "#9b59b6"],
    ["#9b59b6", "#3498db"],
    ["#3498db", "#1abc9c"],
    ["#1abc9c", "#2ecc71"],
    ["#2ecc71", "#f1c40f"],
    ["#f1c40f", "#e67e22"],
    ["#e67e22", "#e74c3c"],
    ["#e74c3c", "#ff69b4"],
    ["#00d4ff", "#9b59b6"],
  ];

  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorPair = colors[hash % colors.length];
  return `linear-gradient(135deg, ${colorPair[0]}, ${colorPair[1]})`;
}

// Format date
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Not connected view
function NotConnectedView() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <motion.div
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-pulse-bg-secondary border border-pulse-pink/20 flex items-center justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Wallet className="w-12 h-12 text-pulse-text-secondary" />
      </motion.div>

      <motion.h2
        className="text-2xl font-bold text-white mb-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Connect to View Profile
      </motion.h2>

      <motion.p
        className="text-pulse-text-secondary mb-6 max-w-md mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Connect your wallet or start in demo mode to see your trading profile and statistics.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pulse-pink text-white font-medium hover:bg-pulse-pink-deep transition-colors shadow-pulse-glow"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Trade
        </Link>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  const { isConnected, walletAddress } = useAuthContext();
  const {
    user,
    stats,
    betHistory,
    isLoading,
    isLoadingHistory,
    hasMoreHistory,
    loadMoreHistory,
  } = useProfile();

  const [copied, setCopied] = useState(false);

  // Handle copy address
  const handleCopyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Stats cards configuration
  const statsCards = [
    {
      icon: Target,
      label: "Total Bets",
      value: stats.totalBets,
      variant: "default" as const,
    },
    {
      icon: TrendingUp,
      label: "Wins",
      value: stats.wins,
      variant: "success" as const,
      trend: stats.totalBets > 0 ? { direction: "up" as const, value: `${stats.winRate.toFixed(1)}%` } : undefined,
    },
    {
      icon: TrendingDown,
      label: "Losses",
      value: stats.losses,
      variant: "danger" as const,
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      variant: "default" as const,
    },
    {
      icon: DollarSign,
      label: "Total Profit",
      value: `${stats.totalProfit >= 0 ? "+" : ""}$${Math.abs(stats.totalProfit).toLocaleString()}`,
      variant: stats.totalProfit >= 0 ? "success" as const : "danger" as const,
    },
    {
      icon: Award,
      label: "Biggest Win",
      value: `$${stats.biggestWin.toLocaleString()}`,
      variant: "success" as const,
    },
    {
      icon: Flame,
      label: "Best Streak",
      value: stats.longestWinStreak,
      subValue: "wins",
      variant: "default" as const,
    },
    {
      icon: Trophy,
      label: "Rank",
      value: stats.rank ? `#${stats.rank}` : "-",
      variant: "default" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-pulse-gradient">
      {/* Header */}
      <Header />

      {/* Sidebar */}
      <Sidebar activeItem="profile" />

      {/* Main Content */}
      <main className="pt-14 pl-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-pulse-text-secondary hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Trade</span>
            </Link>
          </motion.div>

          {!isConnected ? (
            <NotConnectedView />
          ) : (
            <>
              {/* Profile Header */}
              <motion.div
                className="mb-8 p-6 rounded-2xl bg-pulse-bg-secondary/50 border border-pulse-pink/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Large Avatar */}
                  <motion.div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                    style={{ background: walletAddress ? generateGradient(walletAddress) : undefined }}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    {user?.username?.substring(0, 2).toUpperCase() || "??"}
                  </motion.div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold text-white">
                        {user?.username || "Anonymous"}
                      </h1>
                      {stats.rank && <RankBadgeInline rank={stats.rank} />}
                    </div>

                    {/* Wallet Address */}
                    <div className="mt-2 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-pulse-text-secondary" />
                      <span className="font-mono text-sm text-pulse-text-secondary">
                        {walletAddress ? truncateAddress(walletAddress) : "Not connected"}
                      </span>
                      {walletAddress && (
                        <>
                          <button
                            onClick={handleCopyAddress}
                            className="p-1 hover:bg-pulse-pink/10 rounded transition-colors"
                            title="Copy address"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-pulse-text-secondary hover:text-white" />
                            )}
                          </button>
                          <a
                            href={`https://solscan.io/account/${walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-pulse-pink/10 rounded transition-colors"
                            title="View on Solscan"
                          >
                            <ExternalLink className="w-4 h-4 text-pulse-text-secondary hover:text-white" />
                          </a>
                        </>
                      )}
                    </div>

                    {/* Joined date */}
                    {user?.joinedAt && (
                      <p className="mt-1 text-xs text-pulse-text-secondary">
                        Member since {formatDate(user.joinedAt)}
                      </p>
                    )}
                  </div>

                  {/* Edit Profile Button */}
                  <button
                    className="px-4 py-2 rounded-xl bg-pulse-bg-secondary border border-pulse-pink/20 text-pulse-text-secondary hover:text-white hover:border-pulse-pink/40 transition-all flex items-center gap-2"
                    onClick={() => {
                      // Placeholder for edit profile modal
                      console.log("Edit profile clicked");
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </button>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-semibold text-white mb-4">Statistics</h2>
                <StatsGrid stats={statsCards} />
              </motion.div>

              {/* Bet History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-white mb-4">Bet History</h2>
                <BetHistory
                  bets={betHistory}
                  isLoading={isLoading}
                  isLoadingMore={isLoadingHistory}
                  hasMore={hasMoreHistory}
                  onLoadMore={loadMoreHistory}
                />
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
