"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, User, WalletType, truncateAddress } from "@/hooks/useAuth";

// Context type definition
interface AuthContextType {
  // State
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  user: User | null;
  walletAddress: string | null;
  walletType: WalletType | null;
  error: string | null;

  // Actions
  connect: (walletType: WalletType) => Promise<boolean>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  getDemoBalance: () => number;
  updateDemoBalance: (newBalance: number) => void;
  truncateAddress: (address: string, chars?: number) => string;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  const contextValue: AuthContextType = {
    // State
    isConnected: auth.isConnected,
    isLoading: auth.isLoading,
    isConnecting: auth.isConnecting,
    user: auth.user,
    walletAddress: auth.walletAddress,
    walletType: auth.walletType,
    error: auth.error,

    // Actions
    connect: auth.connect,
    disconnect: auth.disconnect,
    clearError: auth.clearError,
    getDemoBalance: auth.getDemoBalance,
    updateDemoBalance: auth.updateDemoBalance,
    truncateAddress: auth.truncateAddress,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
}

// Export the context for advanced use cases
export { AuthContext };
export type { AuthContextType };
