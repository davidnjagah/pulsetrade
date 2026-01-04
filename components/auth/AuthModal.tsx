"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Loader2, AlertCircle, Sparkles, Ghost } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { WalletType } from "@/hooks/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Wallet option configuration
interface WalletOption {
  type: WalletType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const walletOptions: WalletOption[] = [
  {
    type: "phantom",
    name: "Phantom",
    description: "Popular Solana wallet",
    icon: (
      <svg viewBox="0 0 128 128" className="w-8 h-8">
        <defs>
          <linearGradient id="phantom-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#AB9FF2" />
            <stop offset="100%" stopColor="#534BB1" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="26" fill="url(#phantom-grad)" />
        <path
          d="M110.5 64c0 25.4-20.6 46-46 46S18.5 89.4 18.5 64s20.6-46 46-46 46 20.6 46 46z"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
        />
        <circle cx="48" cy="58" r="8" fill="#fff" />
        <circle cx="80" cy="58" r="8" fill="#fff" />
      </svg>
    ),
    color: "#AB9FF2",
    bgColor: "rgba(171, 159, 242, 0.15)",
  },
  {
    type: "solflare",
    name: "Solflare",
    description: "Feature-rich Solana wallet",
    icon: (
      <svg viewBox="0 0 128 128" className="w-8 h-8">
        <defs>
          <linearGradient id="solflare-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FC7227" />
            <stop offset="100%" stopColor="#F9B21A" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="26" fill="#1a1a2e" />
        <path
          d="M64 24L24 64l40 40 40-40L64 24z"
          fill="url(#solflare-grad)"
        />
        <circle cx="64" cy="64" r="12" fill="#fff" />
      </svg>
    ),
    color: "#FC7227",
    bgColor: "rgba(252, 114, 39, 0.15)",
  },
  {
    type: "demo",
    name: "Demo Mode",
    description: "$10,000 play money",
    icon: (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pulse-yellow to-pulse-yellow-dark flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-pulse-bg" />
      </div>
    ),
    color: "#e6ff00",
    bgColor: "rgba(230, 255, 0, 0.15)",
  },
];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { connect, isConnecting, error, clearError } = useAuthContext();
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);

  // Clear selection and error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedWallet(null);
      clearError();
    }
  }, [isOpen, clearError]);

  // Handle wallet selection
  const handleSelectWallet = async (walletType: WalletType) => {
    setSelectedWallet(walletType);
    const success = await connect(walletType);
    if (success) {
      onClose();
    }
  };

  // Handle clicking outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isConnecting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md mx-4 bg-pulse-bg-secondary border border-pulse-pink/20 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pulse-pink to-pulse-pink-deep flex items-center justify-center shadow-pulse-glow">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                    <p className="text-sm text-pulse-text-secondary">
                      Choose a wallet to connect
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  disabled={isConnecting}
                  className="p-2 rounded-lg hover:bg-pulse-bg/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5 text-pulse-text-secondary hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mx-6 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wallet options */}
            <div className="px-6 pb-6 space-y-3">
              {walletOptions.map((wallet) => (
                <motion.button
                  key={wallet.type}
                  onClick={() => handleSelectWallet(wallet.type)}
                  disabled={isConnecting}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl
                    border transition-all duration-200
                    ${
                      selectedWallet === wallet.type && isConnecting
                        ? `border-pulse-pink/50 bg-pulse-pink/10`
                        : `border-pulse-pink/20 hover:border-pulse-pink/40 bg-pulse-bg/30 hover:bg-pulse-bg/50`
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  whileHover={!isConnecting ? { scale: 1.01 } : {}}
                  whileTap={!isConnecting ? { scale: 0.99 } : {}}
                >
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: wallet.bgColor }}
                  >
                    {selectedWallet === wallet.type && isConnecting ? (
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: wallet.color }} />
                    ) : (
                      wallet.icon
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white">{wallet.name}</h3>
                    <p className="text-sm text-pulse-text-secondary">
                      {wallet.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {!(selectedWallet === wallet.type && isConnecting) && (
                    <div className="text-pulse-text-secondary">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Guest option */}
            <div className="px-6 pb-6 pt-2 border-t border-pulse-pink/10">
              <button
                onClick={onClose}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 py-3 text-pulse-text-secondary hover:text-white transition-colors disabled:opacity-50"
              >
                <Ghost className="w-4 h-4" />
                <span className="text-sm">Continue as Guest (view only)</span>
              </button>
            </div>

            {/* Footer note */}
            <div className="px-6 py-4 bg-pulse-bg/30 border-t border-pulse-pink/10">
              <p className="text-xs text-pulse-text-secondary text-center">
                By connecting, you agree to our Terms of Service and Privacy Policy.
                No personal data is stored.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
