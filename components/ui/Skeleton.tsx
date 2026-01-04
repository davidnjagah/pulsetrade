"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "rectangular" | "text";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "shimmer";
}

// Base skeleton component
export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animation = "shimmer",
}: SkeletonProps) {
  const baseClasses = "bg-pulse-bg-secondary/60";

  const variantClasses = {
    default: "rounded-lg",
    circular: "rounded-full",
    rectangular: "rounded-none",
    text: "rounded h-4",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "",
    shimmer: "",
  };

  const style = {
    width: width,
    height: height,
  };

  if (animation === "shimmer") {
    return (
      <div
        className={cn(
          baseClasses,
          variantClasses[variant],
          "relative overflow-hidden",
          className
        )}
        style={style}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,105,180,0.08), transparent)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    );
  }

  if (animation === "wave") {
    return (
      <motion.div
        className={cn(baseClasses, variantClasses[variant], className)}
        style={style}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
}

// Chart skeleton with animated line
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full min-h-[300px] bg-pulse-bg-secondary/30 rounded-xl overflow-hidden", className)}>
      {/* Grid lines */}
      <div className="absolute inset-0 p-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full border-t border-pulse-pink/5"
            style={{ top: `${20 + i * 15}%` }}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-full border-l border-pulse-pink/5"
            style={{ left: `${10 + i * 15}%` }}
          />
        ))}
      </div>

      {/* Animated chart line */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <svg className="w-full h-32" viewBox="0 0 300 100" preserveAspectRatio="none">
          <motion.path
            d="M0 70 Q 50 50, 75 60 T 150 45 T 225 55 T 300 35"
            fill="none"
            stroke="rgba(255, 105, 180, 0.3)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          />
          <motion.path
            d="M0 70 Q 50 50, 75 60 T 150 45 T 225 55 T 300 35"
            fill="none"
            stroke="rgba(255, 105, 180, 0.1)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="blur(4px)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          />
        </svg>
      </div>

      {/* Price badge skeleton */}
      <div className="absolute top-4 right-4">
        <Skeleton width={100} height={32} className="rounded-full" />
      </div>

      {/* Symbol skeleton */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Skeleton width={80} height={24} />
        <Skeleton width={50} height={24} className="rounded-full" />
      </div>

      {/* Loading text */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-pulse-text-secondary text-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading chart...
      </motion.div>
    </div>
  );
}

// Leaderboard skeleton
export function LeaderboardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-pulse-bg-secondary/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          {/* Rank */}
          <Skeleton variant="circular" width={32} height={32} />

          {/* Avatar */}
          <Skeleton variant="circular" width={40} height={40} />

          {/* User info */}
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="40%" />
            <Skeleton height={12} width="25%" />
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-8">
            <Skeleton height={16} width={40} />
            <Skeleton height={16} width={40} />
            <Skeleton height={16} width={60} />
          </div>

          {/* Profit */}
          <Skeleton height={20} width={80} />
        </motion.div>
      ))}
    </div>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      {/* Profile header */}
      <motion.div
        className="p-6 rounded-2xl bg-pulse-bg-secondary/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <Skeleton variant="circular" width={96} height={96} className="rounded-2xl" />

          {/* User info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton height={28} width={150} />
              <Skeleton height={24} width={60} className="rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton height={16} width={200} />
            </div>
            <Skeleton height={14} width={120} />
          </div>

          {/* Edit button */}
          <Skeleton height={40} width={120} />
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Skeleton height={24} width={100} className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-pulse-bg-secondary/30">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton height={14} width={60} />
              </div>
              <Skeleton height={28} width="60%" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bet history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Skeleton height={24} width={100} className="mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-pulse-bg-secondary/30">
              <Skeleton variant="circular" width={32} height={32} />
              <div className="flex-1 space-y-2">
                <Skeleton height={14} width="30%" />
                <Skeleton height={12} width="20%" />
              </div>
              <Skeleton height={20} width={60} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-pulse-pink/5">
      {[...Array(columns)].map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className="flex-1"
          width={i === 0 ? "30%" : i === columns - 1 ? "15%" : "auto"}
        />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({
  className,
  hasImage = false,
}: {
  className?: string;
  hasImage?: boolean;
}) {
  return (
    <div className={cn("p-4 rounded-xl bg-pulse-bg-secondary/30 space-y-4", className)}>
      {hasImage && <Skeleton height={120} className="rounded-lg" />}
      <div className="space-y-3">
        <Skeleton height={20} width="70%" />
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="85%" />
      </div>
      <div className="flex gap-2">
        <Skeleton height={32} width={80} className="rounded-full" />
        <Skeleton height={32} width={80} className="rounded-full" />
      </div>
    </div>
  );
}

// Avatar group skeleton
export function AvatarGroupSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex -space-x-2">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Skeleton
            variant="circular"
            width={32}
            height={32}
            className="border-2 border-pulse-bg"
          />
        </motion.div>
      ))}
    </div>
  );
}

export default Skeleton;
