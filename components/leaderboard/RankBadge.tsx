"use client";

import { motion } from "framer-motion";
import { Crown, Medal } from "lucide-react";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: {
    container: "w-6 h-6 text-xs",
    icon: "w-3 h-3",
  },
  md: {
    container: "w-8 h-8 text-sm",
    icon: "w-4 h-4",
  },
  lg: {
    container: "w-10 h-10 text-base",
    icon: "w-5 h-5",
  },
};

const rankStyles = {
  1: {
    background: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    glow: "shadow-[0_0_12px_rgba(234,179,8,0.5)]",
    textColor: "text-yellow-900",
    icon: Crown,
  },
  2: {
    background: "bg-gradient-to-br from-gray-300 to-gray-500",
    glow: "shadow-[0_0_10px_rgba(156,163,175,0.4)]",
    textColor: "text-gray-900",
    icon: Medal,
  },
  3: {
    background: "bg-gradient-to-br from-amber-500 to-amber-700",
    glow: "shadow-[0_0_10px_rgba(217,119,6,0.4)]",
    textColor: "text-amber-900",
    icon: Medal,
  },
};

export default function RankBadge({ rank, size = "md", className = "" }: RankBadgeProps) {
  const styles = sizeStyles[size];
  const isTopThree = rank >= 1 && rank <= 3;
  const rankStyle = isTopThree ? rankStyles[rank as 1 | 2 | 3] : null;

  if (isTopThree && rankStyle) {
    const IconComponent = rankStyle.icon;

    return (
      <motion.div
        className={`
          ${styles.container}
          ${rankStyle.background}
          ${rankStyle.glow}
          rounded-full flex items-center justify-center
          font-bold ${rankStyle.textColor}
          ${className}
        `}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        whileHover={{ scale: 1.1 }}
      >
        <IconComponent className={styles.icon} />
      </motion.div>
    );
  }

  // Default badge for ranks 4+
  return (
    <motion.div
      className={`
        ${styles.container}
        bg-pulse-bg-secondary border border-pulse-pink/20
        rounded-full flex items-center justify-center
        font-semibold text-pulse-text-secondary
        ${className}
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 15, delay: Math.min(rank * 0.02, 0.5) }}
    >
      {rank}
    </motion.div>
  );
}

// Export a simple variant for inline use
export function RankBadgeInline({ rank, className = "" }: { rank: number; className?: string }) {
  const isTopThree = rank >= 1 && rank <= 3;

  if (rank === 1) {
    return (
      <span className={`inline-flex items-center gap-1 text-yellow-400 ${className}`}>
        <Crown className="w-4 h-4" />
        <span className="font-bold">#{rank}</span>
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className={`inline-flex items-center gap-1 text-gray-400 ${className}`}>
        <Medal className="w-4 h-4" />
        <span className="font-bold">#{rank}</span>
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className={`inline-flex items-center gap-1 text-amber-500 ${className}`}>
        <Medal className="w-4 h-4" />
        <span className="font-bold">#{rank}</span>
      </span>
    );
  }

  return (
    <span className={`text-pulse-text-secondary ${className}`}>
      #{rank}
    </span>
  );
}
