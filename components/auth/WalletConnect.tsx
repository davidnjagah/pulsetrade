"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Loader2, Check } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import AuthModal from "./AuthModal";

interface WalletConnectProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const variantStyles = {
  primary: `
    bg-gradient-to-r from-pulse-pink to-pulse-pink-deep
    hover:from-pulse-pink-deep hover:to-pulse-pink
    text-white font-semibold
    shadow-pulse-glow hover:shadow-pulse-glow-lg
  `,
  secondary: `
    bg-pulse-bg-secondary/80
    border border-pulse-pink/30
    hover:border-pulse-pink/60
    text-white
  `,
  outline: `
    bg-transparent
    border border-pulse-pink/50
    hover:bg-pulse-pink/10
    text-pulse-pink hover:text-white
  `,
};

export default function WalletConnect({
  className = "",
  size = "md",
  variant = "primary",
}: WalletConnectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, isConnecting, walletAddress, truncateAddress } = useAuthContext();

  // If connected, show abbreviated address
  if (isConnected && walletAddress) {
    return (
      <motion.div
        className={`
          inline-flex items-center gap-2 rounded-lg
          bg-pulse-bg-secondary/80 border border-pulse-pink/20
          ${sizeStyles[size]} ${className}
        `}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <Check className="w-4 h-4 text-green-500" />
        <span className="font-mono text-white">
          {truncateAddress(walletAddress, 4)}
        </span>
      </motion.div>
    );
  }

  // If connecting, show loading state
  if (isConnecting) {
    return (
      <motion.button
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${className}
          opacity-80 cursor-not-allowed
        `}
        disabled
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting...</span>
      </motion.button>
    );
  }

  // Default state - show connect button
  return (
    <>
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg
          transition-all duration-200
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </motion.button>

      {/* Auth Modal */}
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

// Compact version for header
export function WalletConnectCompact({ className = "" }: { className?: string }) {
  return <WalletConnect size="sm" variant="primary" className={className} />;
}
