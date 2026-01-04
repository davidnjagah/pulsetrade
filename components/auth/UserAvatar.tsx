"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, ChevronDown, Copy, Check, ExternalLink } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  showDropdown?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    avatar: "w-8 h-8",
    text: "text-xs",
    status: "w-2 h-2 -bottom-0.5 -right-0.5",
    dropdown: "w-48",
  },
  md: {
    avatar: "w-10 h-10",
    text: "text-sm",
    status: "w-2.5 h-2.5 -bottom-0.5 -right-0.5",
    dropdown: "w-56",
  },
  lg: {
    avatar: "w-12 h-12",
    text: "text-base",
    status: "w-3 h-3 -bottom-1 -right-1",
    dropdown: "w-64",
  },
};

// Generate gradient from wallet address
function generateGradient(address: string): string {
  const colors = [
    ["#ff69b4", "#ff1493"],
    ["#ff1493", "#9b59b6"],
    ["#9b59b6", "#3498db"],
    ["#3498db", "#1abc9c"],
    ["#1abc9c", "#2ecc71"],
    ["#2ecc71", "#f1c40f"],
    ["#f1c40f", "#e67e22"],
    ["#e67e22", "#e74c3c"],
    ["#e74c3c", "#ff69b4"],
    ["#00d4ff", "#9b59b6"],
  ];

  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorPair = colors[hash % colors.length];
  return `linear-gradient(135deg, ${colorPair[0]}, ${colorPair[1]})`;
}

// Get initials from display name or wallet address
function getInitials(displayName: string, walletAddress: string): string {
  if (displayName && displayName !== "Demo User") {
    return displayName.substring(0, 2).toUpperCase();
  }
  return walletAddress.substring(0, 2).toUpperCase();
}

export default function UserAvatar({
  size = "md",
  showDropdown = true,
  className = "",
}: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, walletAddress, disconnect, truncateAddress } = useAuthContext();

  const styles = sizeStyles[size];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle copying address
  const handleCopyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    setIsOpen(false);
    await disconnect();
  };

  // If no user, show placeholder
  if (!user || !walletAddress) {
    return (
      <div
        className={`
          ${styles.avatar} rounded-full
          bg-pulse-bg-secondary border border-pulse-pink/20
          flex items-center justify-center
          ${className}
        `}
      >
        <User className="w-1/2 h-1/2 text-pulse-text-secondary" />
      </div>
    );
  }

  const gradient = generateGradient(walletAddress);
  const initials = getInitials(user.displayName, walletAddress);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Avatar button */}
      <motion.button
        onClick={() => showDropdown && setIsOpen(!isOpen)}
        className={`
          relative flex items-center gap-2
          ${showDropdown ? "cursor-pointer" : "cursor-default"}
        `}
        whileHover={showDropdown ? { scale: 1.02 } : {}}
        whileTap={showDropdown ? { scale: 0.98 } : {}}
      >
        {/* Avatar circle */}
        <div
          className={`
            ${styles.avatar} rounded-full
            flex items-center justify-center
            shadow-lg
            font-bold text-white ${styles.text}
          `}
          style={{ background: gradient }}
        >
          {initials}
        </div>

        {/* Online status indicator */}
        <div
          className={`
            absolute ${styles.status}
            rounded-full bg-green-500
            border-2 border-pulse-bg-secondary
            animate-pulse
          `}
        />

        {/* Dropdown arrow */}
        {showDropdown && (
          <ChevronDown
            className={`
              w-4 h-4 text-pulse-text-secondary
              transition-transform duration-200
              ${isOpen ? "rotate-180" : ""}
            `}
          />
        )}
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && showDropdown && (
          <motion.div
            className={`
              absolute right-0 top-full mt-2 ${styles.dropdown}
              bg-pulse-bg-secondary border border-pulse-pink/20
              rounded-xl shadow-2xl overflow-hidden z-50
            `}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {/* User info header */}
            <div className="p-4 border-b border-pulse-pink/10 bg-pulse-bg/30">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ background: gradient }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user.displayName}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-pulse-text-secondary font-mono">
                      {truncateAddress(walletAddress, 6)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-pulse-pink/10 rounded transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-pulse-text-secondary" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Demo mode badge */}
              {user.isDemo && (
                <div className="mt-3 px-2 py-1 rounded-lg bg-pulse-yellow/10 border border-pulse-yellow/30">
                  <p className="text-xs text-pulse-yellow font-medium text-center">
                    Demo Mode - $10,000 play money
                  </p>
                </div>
              )}
            </div>

            {/* Menu items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to profile (would use router in real app)
                  console.log("Navigate to profile");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-pulse-pink/10 transition-colors text-left"
              >
                <User className="w-4 h-4 text-pulse-text-secondary" />
                <span className="text-sm text-white">Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  // Open settings (would dispatch action in real app)
                  console.log("Open settings");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-pulse-pink/10 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-pulse-text-secondary" />
                <span className="text-sm text-white">Settings</span>
              </button>

              {!user.isDemo && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Open wallet in explorer
                    window.open(
                      `https://solscan.io/account/${walletAddress}`,
                      "_blank"
                    );
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-pulse-pink/10 transition-colors text-left"
                >
                  <ExternalLink className="w-4 h-4 text-pulse-text-secondary" />
                  <span className="text-sm text-white">View on Explorer</span>
                </button>
              )}
            </div>

            {/* Disconnect button */}
            <div className="p-2 border-t border-pulse-pink/10">
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-left group"
              >
                <LogOut className="w-4 h-4 text-pulse-text-secondary group-hover:text-red-400" />
                <span className="text-sm text-white group-hover:text-red-400">
                  Disconnect
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple avatar without dropdown (for lists, chat, etc.)
export function SimpleAvatar({
  address,
  displayName,
  size = "sm",
  className = "",
}: {
  address: string;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const styles = sizeStyles[size];
  const gradient = generateGradient(address);
  const initials = getInitials(displayName || "", address);

  return (
    <div
      className={`
        ${styles.avatar} rounded-full
        flex items-center justify-center
        font-bold text-white ${styles.text}
        ${className}
      `}
      style={{ background: gradient }}
    >
      {initials}
    </div>
  );
}
