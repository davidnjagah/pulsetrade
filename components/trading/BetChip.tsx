"use client";

import { motion } from "framer-motion";

export type BetStatus = "active" | "won" | "lost" | "pending";

interface BetChipProps {
  amount: number;
  multiplier: number;
  position?: { x: number; y: number };
  status?: BetStatus;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

const sizeStyles = {
  sm: {
    width: "50px",
    padding: "4px 8px",
    amountSize: "text-sm",
    multiplierSize: "text-[10px]",
  },
  md: {
    width: "60px",
    padding: "6px 10px",
    amountSize: "text-base",
    multiplierSize: "text-xs",
  },
  lg: {
    width: "70px",
    padding: "8px 12px",
    amountSize: "text-lg",
    multiplierSize: "text-sm",
  },
};

const statusStyles = {
  active: {
    background: "linear-gradient(135deg, #e6ff00 0%, #d4ed00 100%)",
    shadow: "0 4px 12px rgba(230, 255, 0, 0.4)",
    textColor: "text-gray-900",
  },
  won: {
    background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
    shadow: "0 4px 12px rgba(0, 255, 136, 0.5)",
    textColor: "text-gray-900",
  },
  lost: {
    background: "linear-gradient(135deg, #ff4d6d 0%, #cc3d57 100%)",
    shadow: "0 4px 12px rgba(255, 77, 109, 0.4)",
    textColor: "text-white",
  },
  pending: {
    background: "linear-gradient(135deg, #ffd700 0%, #ffb700 100%)",
    shadow: "0 4px 12px rgba(255, 215, 0, 0.3)",
    textColor: "text-gray-900",
  },
};

export default function BetChip({
  amount,
  multiplier,
  position,
  status = "active",
  size = "md",
  onClick,
  className = "",
}: BetChipProps) {
  const sizeStyle = sizeStyles[size];
  const statusStyle = statusStyles[status];

  const chipVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      y: -20,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: statusStyle.shadow.replace("0.4", "0.6"),
    },
    tap: {
      scale: 0.95,
    },
    exit: {
      scale: 0,
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.2,
      },
    },
  };

  const pulseVariants = {
    animate: {
      boxShadow: [
        statusStyle.shadow,
        statusStyle.shadow.replace("0.4", "0.7"),
        statusStyle.shadow,
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className={`
        inline-flex flex-col items-center justify-center
        rounded-lg cursor-pointer select-none
        font-bold ${statusStyle.textColor}
        ${className}
      `}
      style={{
        width: sizeStyle.width,
        padding: sizeStyle.padding,
        background: statusStyle.background,
        boxShadow: statusStyle.shadow,
        position: position ? "absolute" : "relative",
        left: position?.x,
        top: position?.y,
        transform: position ? "translate(-50%, -50%)" : undefined,
      }}
      variants={chipVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      layout
    >
      {/* Pulse effect for active bets */}
      {status === "active" && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          variants={pulseVariants}
          animate="animate"
          style={{
            background: "transparent",
          }}
        />
      )}

      {/* Amount */}
      <span className={`${sizeStyle.amountSize} font-bold leading-tight`}>
        ${amount}
      </span>

      {/* Multiplier */}
      <span
        className={`${sizeStyle.multiplierSize} opacity-70 leading-tight`}
      >
        {multiplier.toFixed(1)}x
      </span>
    </motion.div>
  );
}

// Quick bet chip selector component
interface QuickBetChipProps {
  amounts?: number[];
  selectedAmount: number;
  onSelect: (amount: number) => void;
}

export function QuickBetChips({
  amounts = [1, 3, 5, 10],
  selectedAmount,
  onSelect,
}: QuickBetChipProps) {
  return (
    <div className="flex items-center gap-2">
      {amounts.map((amount) => (
        <motion.button
          key={amount}
          className={`
            px-4 py-2 rounded-lg font-bold text-sm
            transition-colors duration-200
            ${
              selectedAmount === amount
                ? "bg-pulse-yellow text-gray-900"
                : "bg-pulse-bg-secondary border border-pulse-pink/20 text-white hover:bg-pulse-pink/20"
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(amount)}
        >
          ${amount}
        </motion.button>
      ))}
    </div>
  );
}
