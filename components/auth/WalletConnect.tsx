"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Loader2, Check, ChevronDown, LogOut } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuthContext } from "@/context/AuthContext";

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

// Truncate wallet address for display
function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export default function WalletConnect({
  className = "",
  size = "md",
  variant = "primary",
}: WalletConnectProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { publicKey, connecting, connected, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { isConnected: isAuthConnected, walletType, disconnect: authDisconnect } = useAuthContext();

  // Check if connected via wallet adapter or demo mode
  const isConnected = connected || (isAuthConnected && walletType === "demo");
  const isConnecting = connecting;
  const walletAddress = publicKey?.toBase58() || (walletType === "demo" ? "Demo7wA11etXXXXXXXXXXXXXXXXXXXXXXXXXXXX" : null);

  // Handle disconnect
  const handleDisconnect = async () => {
    setShowDropdown(false);
    if (connected) {
      await disconnect();
    }
    if (isAuthConnected) {
      await authDisconnect();
    }
  };

  // Handle connect button click
  const handleConnect = () => {
    setVisible(true);
  };

  // If connected, show abbreviated address with dropdown
  if (isConnected && walletAddress) {
    return (
      <div className="relative">
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`
            inline-flex items-center gap-2 rounded-lg
            bg-pulse-bg-secondary/80 border border-pulse-pink/20
            hover:border-pulse-pink/40 transition-colors
            ${sizeStyles[size]} ${className}
          `}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {wallet?.adapter?.icon && (
            <img
              src={wallet.adapter.icon}
              alt={wallet.adapter.name}
              className="w-4 h-4"
            />
          )}
          {!wallet?.adapter?.icon && walletType === "demo" && (
            <Check className="w-4 h-4 text-green-500" />
          )}
          <span className="font-mono text-white">
            {truncateAddress(walletAddress, 4)}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </motion.button>

        {/* Dropdown menu */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 rounded-lg bg-pulse-bg-secondary border border-pulse-pink/20 shadow-lg z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-pulse-pink/10">
                <p className="text-xs text-pulse-text-secondary">Connected with</p>
                <p className="text-sm font-medium text-white">
                  {wallet?.adapter?.name || (walletType === "demo" ? "Demo Mode" : "Unknown")}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-3 flex items-center gap-2 text-left text-sm text-red-400 hover:bg-pulse-bg-accent/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </motion.div>
          </>
        )}
      </div>
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
    <motion.button
      onClick={handleConnect}
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
  );
}

// Compact version for header
export function WalletConnectCompact({ className = "" }: { className?: string }) {
  return <WalletConnect size="sm" variant="primary" className={className} />;
}
