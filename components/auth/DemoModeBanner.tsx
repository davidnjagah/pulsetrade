"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Info } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface DemoModeBannerProps {
  className?: string;
  position?: "top" | "bottom";
}

const LOCAL_STORAGE_DISMISSED_KEY = "pulsetrade_demo_banner_dismissed";

export default function DemoModeBanner({
  className = "",
  position = "top",
}: DemoModeBannerProps) {
  const { user, isConnected } = useAuthContext();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Show banner when user is in demo mode
  useEffect(() => {
    if (isConnected && user?.isDemo && !isDismissed) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isConnected, user?.isDemo, isDismissed]);

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, "true");
    setTimeout(() => setIsDismissed(true), 300);
  };

  // Don't render if not demo user or dismissed
  if (!isConnected || !user?.isDemo || isDismissed) {
    return null;
  }

  const positionStyles = {
    top: "top-14 left-1/2 -translate-x-1/2",
    bottom: "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            fixed ${positionStyles[position]} z-40
            ${className}
          `}
          initial={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div
            className="
              flex items-center gap-3 px-4 py-2.5
              bg-gradient-to-r from-pulse-yellow/20 to-pulse-yellow/10
              border border-pulse-yellow/30
              rounded-full shadow-lg backdrop-blur-sm
            "
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pulse-yellow/20">
              <Sparkles className="w-3.5 h-3.5 text-pulse-yellow" />
            </div>

            {/* Text */}
            <span className="text-sm font-medium text-white">
              Demo Mode
              <span className="hidden sm:inline text-pulse-yellow ml-1">
                - $10,000 play money
              </span>
            </span>

            {/* Info tooltip */}
            <div className="group relative">
              <Info className="w-4 h-4 text-pulse-text-secondary hover:text-pulse-yellow cursor-help transition-colors" />
              <div
                className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  w-64 p-3 rounded-lg
                  bg-pulse-bg-secondary border border-pulse-pink/20
                  text-xs text-pulse-text-secondary
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200
                  shadow-xl
                "
              >
                <p>
                  You are using demo mode with $10,000 in play money.
                  Connect a real wallet to trade with actual funds.
                </p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-pulse-bg-secondary border-r border-b border-pulse-pink/20 transform rotate-45" />
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="
                p-1 rounded-full
                hover:bg-pulse-yellow/20
                transition-colors
              "
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4 text-pulse-text-secondary hover:text-white transition-colors" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline version for embedding in other components
export function DemoModeInlineBadge({ className = "" }: { className?: string }) {
  const { user, isConnected } = useAuthContext();

  if (!isConnected || !user?.isDemo) {
    return null;
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1
        bg-pulse-yellow/10 border border-pulse-yellow/30
        rounded-full text-xs font-medium text-pulse-yellow
        ${className}
      `}
    >
      <Sparkles className="w-3 h-3" />
      <span>Demo</span>
    </div>
  );
}
