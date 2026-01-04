"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { SimpleAvatar } from "@/components/auth/UserAvatar";

export type BetNotificationType = "placed" | "won" | "lost";

export interface BetNotificationData {
  id: string;
  userId: string;
  username: string;
  walletAddress: string;
  amount: number;
  multiplier: number;
  type: BetNotificationType;
  timestamp: number;
  payout?: number; // For won bets
  isOwn?: boolean;
}

interface BetNotificationProps {
  notification: BetNotificationData;
  isOwn?: boolean;
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else {
    return `${Math.floor(minutes / 60)}h ago`;
  }
}

function BetNotificationComponent({ notification, isOwn = false }: BetNotificationProps) {
  const relativeTime = formatRelativeTime(notification.timestamp);
  const displayName = isOwn ? "You" : notification.username;

  // Determine styling based on notification type
  const getTypeConfig = () => {
    switch (notification.type) {
      case "placed":
        return {
          icon: <Zap className="w-3 h-3" />,
          bgColor: "bg-pulse-yellow/10",
          borderColor: "border-pulse-yellow/30",
          textColor: "text-pulse-yellow",
          text: `placed $${notification.amount} bet at ${notification.multiplier.toFixed(1)}x`,
        };
      case "won":
        return {
          icon: <TrendingUp className="w-3 h-3" />,
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          textColor: "text-green-400",
          text: `won $${notification.payout?.toFixed(2) || (notification.amount * notification.multiplier).toFixed(2)} at ${notification.multiplier.toFixed(1)}x`,
        };
      case "lost":
        return {
          icon: <TrendingDown className="w-3 h-3" />,
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          textColor: "text-red-400",
          text: `lost $${notification.amount} bet`,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <motion.div
      className={`
        flex items-center gap-2 px-2.5 py-2 rounded-lg border
        ${config.bgColor} ${config.borderColor}
      `}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <SimpleAvatar
        address={notification.walletAddress}
        displayName={notification.username}
        size="sm"
        className="flex-shrink-0 w-5 h-5 text-[8px]"
      />

      {/* Notification content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug">
          <span className={`font-semibold ${config.textColor}`}>
            {displayName}
          </span>
          <span className="text-pulse-text-secondary ml-1">
            {config.text}
          </span>
        </p>
      </div>

      {/* Icon indicator */}
      <div className={`flex-shrink-0 ${config.textColor}`}>
        {config.icon}
      </div>

      {/* Timestamp */}
      <span className="text-[9px] text-pulse-text-secondary flex-shrink-0">
        {relativeTime}
      </span>
    </motion.div>
  );
}

// Compact inline version for chat feed
export function BetNotificationInline({ notification, isOwn = false }: BetNotificationProps) {
  const displayName = isOwn ? "You" : notification.username;

  const getInlineText = () => {
    switch (notification.type) {
      case "placed":
        return (
          <>
            <span className="text-pulse-yellow font-medium">{displayName}</span>
            <span className="text-pulse-text-secondary"> placed </span>
            <span className="text-pulse-yellow font-bold">${notification.amount}</span>
            <span className="text-pulse-text-secondary"> bet at </span>
            <span className="text-pulse-yellow">{notification.multiplier.toFixed(1)}x</span>
          </>
        );
      case "won":
        return (
          <>
            <span className="text-green-400 font-medium">{displayName}</span>
            <span className="text-pulse-text-secondary"> won </span>
            <span className="text-green-400 font-bold">
              ${notification.payout?.toFixed(2) || (notification.amount * notification.multiplier).toFixed(2)}
            </span>
          </>
        );
      case "lost":
        return (
          <>
            <span className="text-red-400 font-medium">{displayName}</span>
            <span className="text-pulse-text-secondary"> lost </span>
            <span className="text-red-400">${notification.amount}</span>
          </>
        );
    }
  };

  return (
    <motion.div
      className="flex items-center gap-1.5 py-1 text-xs"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Zap className="w-3 h-3 text-pulse-yellow flex-shrink-0" />
      <span className="truncate">{getInlineText()}</span>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
const BetNotification = memo(BetNotificationComponent);
export default BetNotification;
