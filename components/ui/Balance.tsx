"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Wallet } from "lucide-react";

interface BalanceProps {
  amount: number;
  currency?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: {
    icon: "w-4 h-4",
    text: "text-sm",
    padding: "px-2 py-1",
  },
  md: {
    icon: "w-5 h-5",
    text: "text-base",
    padding: "px-3 py-1.5",
  },
  lg: {
    icon: "w-6 h-6",
    text: "text-lg",
    padding: "px-4 py-2",
  },
};

// Animated number component that rolls digits
function AnimatedNumber({ value }: { value: number }) {
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 20,
    mass: 1,
  });

  const displayValue = useTransform(springValue, (latest) =>
    latest.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );

  const [displayText, setDisplayText] = useState(
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );

  useEffect(() => {
    springValue.set(value);
    const unsubscribe = displayValue.on("change", (latest) => {
      setDisplayText(latest);
    });
    return unsubscribe;
  }, [value, springValue, displayValue]);

  return <span>{displayText}</span>;
}

export default function Balance({
  amount,
  currency = "$",
  showIcon = true,
  size = "md",
  className = "",
}: BalanceProps) {
  const [prevAmount, setPrevAmount] = useState(amount);
  const [changeType, setChangeType] = useState<"increase" | "decrease" | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const style = sizeStyles[size];

  useEffect(() => {
    if (amount !== prevAmount) {
      // Determine if increase or decrease
      if (amount > prevAmount) {
        setChangeType("increase");
      } else if (amount < prevAmount) {
        setChangeType("decrease");
      }

      setPrevAmount(amount);

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset flash after animation
      timeoutRef.current = setTimeout(() => {
        setChangeType(null);
      }, 600);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [amount, prevAmount]);

  const getFlashColor = () => {
    switch (changeType) {
      case "increase":
        return "rgba(34, 197, 94, 0.3)"; // Green
      case "decrease":
        return "rgba(239, 68, 68, 0.3)"; // Red
      default:
        return "transparent";
    }
  };

  const getBorderColor = () => {
    switch (changeType) {
      case "increase":
        return "border-green-500/50";
      case "decrease":
        return "border-red-500/50";
      default:
        return "border-pulse-pink/20";
    }
  };

  return (
    <motion.div
      className={`
        inline-flex items-center gap-2 rounded-lg
        bg-pulse-bg-secondary/80 backdrop-blur-sm
        border ${getBorderColor()}
        ${style.padding} ${className}
        transition-colors duration-300
      `}
      animate={{
        backgroundColor: getFlashColor(),
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      {/* Wallet Icon */}
      {showIcon && (
        <motion.div
          className="text-pulse-balance-icon"
          animate={changeType ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Wallet className={style.icon} />
        </motion.div>
      )}

      {/* Balance Amount */}
      <div className={`font-bold font-mono text-white ${style.text}`}>
        {currency}
        <AnimatedNumber value={amount} />
      </div>

      {/* Change indicator arrow */}
      <AnimatePresence>
        {changeType && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: changeType === "increase" ? -2 : 2
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
            className={`
              text-xs font-bold
              ${changeType === "increase" ? "text-green-400" : "text-red-400"}
            `}
          >
            {changeType === "increase" ? "+" : "-"}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact balance for header use
interface CompactBalanceProps {
  amount: number;
  className?: string;
}

export function CompactBalance({ amount, className = "" }: CompactBalanceProps) {
  const [prevAmount, setPrevAmount] = useState(amount);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  useEffect(() => {
    if (amount !== prevAmount) {
      if (amount > prevAmount) {
        setFlashColor("green");
      } else {
        setFlashColor("red");
      }
      setPrevAmount(amount);

      const timer = setTimeout(() => setFlashColor(null), 500);
      return () => clearTimeout(timer);
    }
  }, [amount, prevAmount]);

  return (
    <motion.div
      className={`flex items-center gap-1.5 ${className}`}
      animate={{
        scale: flashColor ? [1, 1.05, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{
          color: flashColor === "green" ? "#22c55e" : flashColor === "red" ? "#ef4444" : "#ff4d6d",
        }}
        transition={{ duration: 0.3 }}
      >
        <Wallet className="w-4 h-4" />
      </motion.div>
      <motion.span
        className="font-bold font-mono text-sm"
        animate={{
          color: flashColor === "green" ? "#22c55e" : flashColor === "red" ? "#ef4444" : "#ffffff",
        }}
        transition={{ duration: 0.3 }}
      >
        ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </motion.span>
    </motion.div>
  );
}

// Demo component to test balance changes
export function BalanceDemo() {
  const [balance, setBalance] = useState(2566.52);

  return (
    <div className="flex flex-col gap-4 p-6">
      <Balance amount={balance} size="lg" />

      <div className="flex gap-2">
        <button
          onClick={() => setBalance((prev) => prev + Math.random() * 50)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Add Money
        </button>
        <button
          onClick={() => setBalance((prev) => Math.max(0, prev - Math.random() * 30))}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Remove Money
        </button>
      </div>
    </div>
  );
}
