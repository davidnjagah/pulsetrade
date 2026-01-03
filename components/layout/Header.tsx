"use client";

import { Settings, Zap } from "lucide-react";

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
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
        <div className="flex items-center gap-4">
          {/* Balance display placeholder */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-pulse-bg-secondary/80 rounded-full border border-pulse-pink/20">
            <div className="w-2 h-2 rounded-full bg-pulse-red animate-pulse" />
            <span className="text-sm font-mono font-semibold text-white">$1,250.00</span>
          </div>

          {/* Settings button */}
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-pulse-bg-secondary/80 transition-colors tap-target"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-pulse-text-secondary hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}
