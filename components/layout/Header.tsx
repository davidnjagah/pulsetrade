"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import WalletConnect from "@/components/auth/WalletConnect";
import UserAvatar from "@/components/auth/UserAvatar";
import { DemoModeInlineBadge } from "@/components/auth/DemoModeBanner";
import { CompactBalance } from "@/components/ui/Balance";
import Logo from "@/components/ui/Logo";

interface HeaderProps {
  onSettingsClick?: () => void;
  balance?: number;
}

export default function Header({ onSettingsClick, balance }: HeaderProps) {
  const { isConnected, isLoading, user } = useAuthContext();

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-pulse-bg/90 backdrop-blur-md border-b border-pulse-pink/10"
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo - using new animated Logo component */}
        <Logo size="md" showText={true} animated={true} href="/" />

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-24 h-8 bg-pulse-bg-secondary/50 rounded-lg animate-pulse" />
              <div className="w-10 h-10 bg-pulse-bg-secondary/50 rounded-full animate-pulse" />
            </div>
          )}

          {/* Not loading - show auth state */}
          {!isLoading && (
            <>
              {/* Connected state */}
              {isConnected && user ? (
                <>
                  {/* Demo mode badge */}
                  {user.isDemo && (
                    <DemoModeInlineBadge className="hidden md:flex" />
                  )}

                  {/* Balance display - only show when authenticated and balance provided */}
                  {typeof balance === "number" && (
                    <div className="hidden sm:block">
                      <CompactBalance amount={balance} />
                    </div>
                  )}

                  {/* Settings button */}
                  <motion.button
                    onClick={onSettingsClick}
                    className="p-2 rounded-lg hover:bg-pulse-bg-secondary/80 transition-colors tap-target"
                    aria-label="Settings"
                    whileHover={{ scale: 1.05, rotate: 15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Settings className="w-5 h-5 text-pulse-text-secondary hover:text-white transition-colors" />
                  </motion.button>

                  {/* User avatar with dropdown */}
                  <UserAvatar size="md" showDropdown />
                </>
              ) : (
                <>
                  {/* Not connected - show connect button */}
                  <WalletConnect size="sm" variant="primary" />

                  {/* Settings button (available even when not connected) */}
                  <motion.button
                    onClick={onSettingsClick}
                    className="p-2 rounded-lg hover:bg-pulse-bg-secondary/80 transition-colors tap-target"
                    aria-label="Settings"
                    whileHover={{ scale: 1.05, rotate: 15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Settings className="w-5 h-5 text-pulse-text-secondary hover:text-white transition-colors" />
                  </motion.button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
