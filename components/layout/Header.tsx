"use client";

import { Settings, Zap } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import WalletConnect from "@/components/auth/WalletConnect";
import UserAvatar from "@/components/auth/UserAvatar";
import { DemoModeInlineBadge } from "@/components/auth/DemoModeBanner";
import { CompactBalance } from "@/components/ui/Balance";

interface HeaderProps {
  onSettingsClick?: () => void;
  balance?: number;
}

export default function Header({ onSettingsClick, balance }: HeaderProps) {
  const { isConnected, isLoading, user } = useAuthContext();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-pulse-bg/90 backdrop-blur-md border-b border-pulse-pink/10">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pulse-pink to-pulse-pink-deep flex items-center justify-center shadow-pulse-glow">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Pulse<span className="text-pulse-pink">Trade</span>
          </span>
        </div>

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
                  <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-lg hover:bg-pulse-bg-secondary/80 transition-colors tap-target"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5 text-pulse-text-secondary hover:text-white transition-colors" />
                  </button>

                  {/* User avatar with dropdown */}
                  <UserAvatar size="md" showDropdown />
                </>
              ) : (
                <>
                  {/* Not connected - show connect button */}
                  <WalletConnect size="sm" variant="primary" />

                  {/* Settings button (available even when not connected) */}
                  <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-lg hover:bg-pulse-bg-secondary/80 transition-colors tap-target"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5 text-pulse-text-secondary hover:text-white transition-colors" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
