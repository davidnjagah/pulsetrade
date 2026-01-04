"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { AnimatedLogo } from "./Logo";

interface LoadingScreenProps {
  isLoading: boolean;
  minDuration?: number; // Minimum time to show loading screen
  onLoadComplete?: () => void;
}

// Progress messages for the loading sequence
const loadingMessages = [
  "Connecting to price feeds...",
  "Loading market data...",
  "Preparing trading interface...",
  "Almost ready...",
];

export default function LoadingScreen({
  isLoading,
  minDuration = 2000,
  onLoadComplete,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [canHide, setCanHide] = useState(false);

  // Simulate progress
  useEffect(() => {
    if (!isLoading) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Slow down as we approach 100
        const increment = prev < 70 ? 5 : prev < 90 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isLoading]);

  // Cycle through messages
  useEffect(() => {
    if (!isLoading) return;

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(messageInterval);
  }, [isLoading]);

  // Minimum duration timer
  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setCanHide(true);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [isLoading, minDuration]);

  // Call onLoadComplete when ready
  useEffect(() => {
    if (!isLoading && canHide && progress >= 100) {
      onLoadComplete?.();
    }
  }, [isLoading, canHide, progress, onLoadComplete]);

  const showLoading = isLoading || !canHide || progress < 100;

  return (
    <AnimatePresence>
      {showLoading && (
        <motion.div
          className="fixed inset-0 z-[200] bg-pulse-gradient flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.5, ease: "easeInOut" },
          }}
        >
          {/* Background gradient animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-radial from-pulse-pink/5 via-transparent to-transparent"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Logo */}
          <div className="relative z-10">
            <AnimatedLogo size="xl" />
          </div>

          {/* Progress bar */}
          <motion.div
            className="relative z-10 mt-12 w-64"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Progress track */}
            <div className="h-1 bg-pulse-bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #ff69b4, #ff1493)",
                  boxShadow: "0 0 10px rgba(255, 105, 180, 0.5)",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Progress percentage */}
            <motion.div
              className="mt-3 text-center text-sm text-pulse-text-secondary font-mono"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {progress}%
            </motion.div>
          </motion.div>

          {/* Loading message */}
          <motion.div
            className="relative z-10 mt-6 h-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                className="text-pulse-text-secondary text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {loadingMessages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-pulse-pink/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Bottom tagline */}
          <motion.p
            className="absolute bottom-8 text-xs text-pulse-text-secondary/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Trade the Pulse
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple spinner for inline loading states
export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-pulse-pink/30 border-t-pulse-pink rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// Dots loading indicator
export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-pulse-pink"
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// Pulse loading indicator
export function LoadingPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="w-3 h-3 rounded-full bg-pulse-pink"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.6, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-0 w-3 h-3 rounded-full border-2 border-pulse-pink"
        animate={{
          scale: [1, 2],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    </div>
  );
}

// Skeleton pulse animation wrapper
export function SkeletonPulse({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {children}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,105,180,0.05), transparent)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
