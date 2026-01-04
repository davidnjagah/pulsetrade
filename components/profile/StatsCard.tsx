"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

export type StatsCardVariant = "default" | "success" | "danger";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  variant?: StatsCardVariant;
  className?: string;
  delay?: number;
}

const variantStyles = {
  default: {
    iconBg: "bg-pulse-pink/20",
    iconColor: "text-pulse-pink",
    border: "border-pulse-pink/10",
    trendUp: "text-green-400",
    trendDown: "text-red-400",
  },
  success: {
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    border: "border-green-500/20",
    trendUp: "text-green-300",
    trendDown: "text-red-400",
  },
  danger: {
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    border: "border-red-500/20",
    trendUp: "text-green-400",
    trendDown: "text-red-300",
  },
};

export default function StatsCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  variant = "default",
  className = "",
  delay = 0,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className={`
        p-4 rounded-xl bg-pulse-bg-secondary/50 border ${styles.border}
        backdrop-blur-sm transition-all hover:bg-pulse-bg-secondary/70
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.direction === "up" ? styles.trendUp : styles.trendDown}`}>
            {trend.direction === "up" ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">{trend.value}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <p className="mt-3 text-sm text-pulse-text-secondary">{label}</p>

      {/* Value */}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {subValue && (
          <span className="text-sm text-pulse-text-secondary">{subValue}</span>
        )}
      </div>
    </motion.div>
  );
}

// Compact variant for inline stats
export function StatsCardCompact({
  icon: Icon,
  label,
  value,
  variant = "default",
  className = "",
}: Omit<StatsCardProps, "trend" | "subValue" | "delay">) {
  const styles = variantStyles[variant];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${styles.iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-pulse-text-secondary">{label}</p>
        <p className="text-lg font-semibold text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

// Grid of stats for profile page
interface StatsGridProps {
  stats: Array<Omit<StatsCardProps, "delay">>;
  className?: string;
}

export function StatsGrid({ stats, className = "" }: StatsGridProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatsCard key={stat.label} {...stat} delay={index} />
      ))}
    </div>
  );
}
