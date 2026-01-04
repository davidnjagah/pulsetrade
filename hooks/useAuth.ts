"use client";

import { useState, useEffect, useCallback } from "react";

// Wallet types supported
export type WalletType = "phantom" | "solflare" | "demo";

// User interface
export interface User {
  id: string;
  walletAddress: string;
  walletType: WalletType;
  displayName: string;
  avatarColor: string;
  createdAt: number;
  isDemo: boolean;
}

// Auth state interface
export interface AuthState {
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  user: User | null;
  walletAddress: string | null;
  walletType: WalletType | null;
  error: string | null;
}

// Demo wallet configuration
const DEMO_WALLET_ADDRESS = "Demo7wA11etXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const DEMO_INITIAL_BALANCE = 10000;
const LOCAL_STORAGE_KEY = "pulsetrade_auth";
const LOCAL_STORAGE_BALANCE_KEY = "pulsetrade_demo_balance";

// Generate avatar color from wallet address
function generateAvatarColor(address: string): string {
  const colors = [
    "#ff69b4", // Hot pink
    "#ff1493", // Deep pink
    "#e6ff00", // Neon yellow
    "#00ff88", // Neon green
    "#00d4ff", // Cyan
    "#9b59b6", // Purple
    "#ff6b6b", // Coral
    "#4ecdc4", // Teal
    "#f39c12", // Orange
    "#1abc9c", // Turquoise
  ];

  // Use wallet address characters to determine color
  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Generate display name from wallet address
function generateDisplayName(address: string, walletType: WalletType): string {
  if (walletType === "demo") {
    return "Demo User";
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Truncate wallet address for display
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Main useAuth hook
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isConnected: false,
    isLoading: true,
    isConnecting: false,
    user: null,
    walletAddress: null,
    walletType: null,
    error: null,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setState({
            isConnected: true,
            isLoading: false,
            isConnecting: false,
            user: parsed.user,
            walletAddress: parsed.walletAddress,
            walletType: parsed.walletType,
            error: null,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  // Save auth state to localStorage
  const saveAuthState = useCallback((user: User, walletType: WalletType) => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          user,
          walletAddress: user.walletAddress,
          walletType,
        })
      );
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  }, []);

  // Connect to a wallet
  const connect = useCallback(
    async (walletType: WalletType): Promise<boolean> => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      try {
        let walletAddress: string;

        if (walletType === "demo") {
          // Demo mode - use mock wallet
          walletAddress = DEMO_WALLET_ADDRESS;

          // Initialize demo balance if not exists
          if (!localStorage.getItem(LOCAL_STORAGE_BALANCE_KEY)) {
            localStorage.setItem(
              LOCAL_STORAGE_BALANCE_KEY,
              DEMO_INITIAL_BALANCE.toString()
            );
          }
        } else if (walletType === "phantom") {
          // Check if Phantom is installed
          const phantom = (window as any)?.solana;
          if (!phantom?.isPhantom) {
            throw new Error(
              "Phantom wallet not found. Please install it from phantom.app"
            );
          }

          // Request connection
          const response = await phantom.connect();
          walletAddress = response.publicKey.toString();
        } else if (walletType === "solflare") {
          // Check if Solflare is installed
          const solflare = (window as any)?.solflare;
          if (!solflare?.isSolflare) {
            throw new Error(
              "Solflare wallet not found. Please install it from solflare.com"
            );
          }

          // Request connection
          await solflare.connect();
          walletAddress = solflare.publicKey?.toString();

          if (!walletAddress) {
            throw new Error("Failed to get wallet address from Solflare");
          }
        } else {
          throw new Error("Unsupported wallet type");
        }

        // Create user object
        const user: User = {
          id: `user_${walletAddress.slice(0, 8)}`,
          walletAddress,
          walletType,
          displayName: generateDisplayName(walletAddress, walletType),
          avatarColor: generateAvatarColor(walletAddress),
          createdAt: Date.now(),
          isDemo: walletType === "demo",
        };

        // Save and update state
        saveAuthState(user, walletType);

        setState({
          isConnected: true,
          isLoading: false,
          isConnecting: false,
          user,
          walletAddress,
          walletType,
          error: null,
        });

        return true;
      } catch (error: any) {
        const errorMessage = error.message || "Failed to connect wallet";
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    [saveAuthState]
  );

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      // Disconnect from actual wallet if connected
      if (state.walletType === "phantom") {
        const phantom = (window as any)?.solana;
        if (phantom?.isPhantom) {
          await phantom.disconnect();
        }
      } else if (state.walletType === "solflare") {
        const solflare = (window as any)?.solflare;
        if (solflare?.isSolflare) {
          await solflare.disconnect();
        }
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }

    // Clear localStorage
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Note: We keep demo balance so user can reconnect

    // Reset state
    setState({
      isConnected: false,
      isLoading: false,
      isConnecting: false,
      user: null,
      walletAddress: null,
      walletType: null,
      error: null,
    });
  }, [state.walletType]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Get demo balance
  const getDemoBalance = useCallback((): number => {
    if (!state.user?.isDemo) return 0;
    const stored = localStorage.getItem(LOCAL_STORAGE_BALANCE_KEY);
    return stored ? parseFloat(stored) : DEMO_INITIAL_BALANCE;
  }, [state.user?.isDemo]);

  // Update demo balance
  const updateDemoBalance = useCallback(
    (newBalance: number) => {
      if (!state.user?.isDemo) return;
      localStorage.setItem(LOCAL_STORAGE_BALANCE_KEY, newBalance.toString());
    },
    [state.user?.isDemo]
  );

  return {
    ...state,
    connect,
    disconnect,
    clearError,
    getDemoBalance,
    updateDemoBalance,
    truncateAddress,
  };
}

export default useAuth;
