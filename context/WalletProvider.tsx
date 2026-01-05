"use client";

import React, { useMemo, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Get network from environment variable, default to devnet
  const networkString = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";

  // Map string to WalletAdapterNetwork enum
  const network = useMemo(() => {
    switch (networkString.toLowerCase()) {
      case "mainnet-beta":
      case "mainnet":
        return WalletAdapterNetwork.Mainnet;
      case "testnet":
        return WalletAdapterNetwork.Testnet;
      case "devnet":
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, [networkString]);

  // Get RPC URL from environment variable or use default cluster URL
  const endpoint = useMemo(() => {
    const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (customRpcUrl) {
      return customRpcUrl;
    }
    return clusterApiUrl(network);
  }, [network]);

  // Configure wallets - Phantom, Solflare, and Backpack
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export default WalletProvider;
