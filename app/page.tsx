"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import PriceChart from "@/components/trading/PriceChart";
import BettingGrid, { GridCell } from "@/components/trading/BettingGrid";
import { QuickBetChips } from "@/components/trading/BetChip";
import WinAnimation, { useWinAnimation } from "@/components/trading/WinAnimation";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import Balance from "@/components/ui/Balance";
import { useBets } from "@/hooks/useBets";
import { useAuthContext } from "@/context/AuthContext";
import { useChatContext } from "@/context/ChatContext";
import DemoModeBanner from "@/components/auth/DemoModeBanner";
import WalletConnect from "@/components/auth/WalletConnect";
import { ChatPanel, ChatToggleButton } from "@/components/chat";
import { X, Wallet, Lock, Sparkles } from "lucide-react";

// Connect prompt component for unauthenticated users
function ConnectPrompt() {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-pulse-bg/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center max-w-md mx-4 p-8 bg-pulse-bg-secondary border border-pulse-pink/20 rounded-2xl shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pulse-pink to-pulse-pink-deep flex items-center justify-center shadow-pulse-glow">
          <Wallet className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Connect to Trade
        </h2>

        <p className="text-pulse-text-secondary mb-6">
          Connect your wallet or try demo mode to start placing bets on the price chart.
        </p>

        <div className="space-y-3">
          <WalletConnect size="lg" variant="primary" className="w-full" />

          <p className="text-xs text-pulse-text-secondary">
            No wallet? Use demo mode with $10,000 play money.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 pt-6 border-t border-pulse-pink/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-pulse-pink font-bold text-lg">$1-$100</div>
              <div className="text-xs text-pulse-text-secondary">Bet Range</div>
            </div>
            <div>
              <div className="text-pulse-pink font-bold text-lg">Up to 10x</div>
              <div className="text-xs text-pulse-text-secondary">Multipliers</div>
            </div>
            <div>
              <div className="text-pulse-pink font-bold text-lg">Instant</div>
              <div className="text-xs text-pulse-text-secondary">Payouts</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Locked grid overlay for non-authenticated users viewing the chart
function LockedGridOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-pulse-bg/40 backdrop-blur-[1px]" />
      <motion.div
        className="relative flex flex-col items-center gap-3 p-6 rounded-xl bg-pulse-bg-secondary/80 border border-pulse-pink/20 shadow-xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-12 h-12 rounded-full bg-pulse-pink/20 flex items-center justify-center">
          <Lock className="w-6 h-6 text-pulse-pink" />
        </div>
        <p className="text-sm text-pulse-text-secondary text-center">
          Connect wallet to place bets
        </p>
      </motion.div>
    </div>
  );
}

// Main content component that uses toast context
function TradingContent() {
  const [activeNavItem, setActiveNavItem] = useState("trade");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBetAmount, setSelectedBetAmount] = useState(5);
  const [currentPrice] = useState(97500);

  // Auth context
  const {
    isConnected,
    isLoading: authLoading,
    user,
    getDemoBalance,
    updateDemoBalance,
  } = useAuthContext();

  // Chat context - for bet notifications
  const { addBetNotification } = useChatContext();

  // Toast notifications
  const { showWin, showLoss } = useToast();

  // Win animation
  const winAnimation = useWinAnimation();

  // Get initial balance based on auth state
  const getInitialBalance = useCallback(() => {
    if (user?.isDemo) {
      return getDemoBalance();
    }
    return 2566.52; // Default balance for real wallets (would come from API)
  }, [user?.isDemo, getDemoBalance]);

  // Bet management
  const {
    bets,
    activeBets,
    balance,
    totalPotentialWin,
    placeBet,
    setBalance,
  } = useBets({
    initialBalance: getInitialBalance(),
    onWin: (bet, payout) => {
      // Trigger win animation at center of screen
      winAnimation.triggerWin({ x: 50, y: 50 }, payout);
      // Show toast notification
      showWin(payout, `Your ${bet.multiplier.toFixed(1)}x bet paid off!`);
      // Add bet notification to chat
      addBetNotification(bet.amount, bet.multiplier, "won", payout);
    },
    onLoss: (bet) => {
      showLoss(bet.amount, "Price didn't reach your target.");
      // Add bet notification to chat
      addBetNotification(bet.amount, bet.multiplier, "lost");
    },
    mockResolution: true,
  });

  // Sync balance when user connects
  useEffect(() => {
    if (isConnected) {
      const newBalance = getInitialBalance();
      setBalance(newBalance);
    }
  }, [isConnected, getInitialBalance, setBalance]);

  // Update demo balance in localStorage when it changes
  useEffect(() => {
    if (user?.isDemo && balance !== getDemoBalance()) {
      updateDemoBalance(balance);
    }
  }, [balance, user?.isDemo, getDemoBalance, updateDemoBalance]);

  // Handle grid cell click to place bet
  const handleCellClick = useCallback(
    (cell: GridCell) => {
      // Don't allow betting if not connected
      if (!isConnected) {
        return;
      }

      const targetTime = Date.now() + cell.timeOffset * 1000;

      const bet = placeBet(
        selectedBetAmount,
        cell.priceLevel,
        targetTime,
        cell.multiplier,
        cell.id
      );

      if (bet) {
        // Add bet notification to chat when bet is placed
        addBetNotification(bet.amount, bet.multiplier, "placed");
      } else {
        // Could show an error toast here
        console.log("Failed to place bet - insufficient balance");
      }
    },
    [selectedBetAmount, placeBet, isConnected, addBetNotification]
  );

  return (
    <div className="min-h-screen bg-pulse-gradient">
      {/* Win Animation Overlay */}
      <WinAnimation
        isActive={winAnimation.isActive}
        position={winAnimation.position}
        winAmount={winAnimation.winAmount}
        onComplete={winAnimation.resetAnimation}
      />

      {/* Demo Mode Banner */}
      <DemoModeBanner position="top" />

      {/* Header - pass balance when authenticated */}
      <Header
        onSettingsClick={() => setShowSettings(true)}
        balance={isConnected ? balance : undefined}
      />

      {/* Sidebar */}
      <Sidebar
        activeItem={activeNavItem}
        onItemClick={setActiveNavItem}
      />

      {/* Main content area */}
      <main className="pt-14 pl-16 min-h-screen">
        <div className="h-[calc(100vh-3.5rem)] flex">
          {/* Trading view area */}
          <div className="flex-1 p-4 flex flex-col">
            {/* Top bar with balance - only show when connected */}
            {isConnected && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Balance amount={balance} size="md" />
                  <div className="text-sm text-pulse-text-secondary">
                    Active: <span className="text-white font-semibold">{activeBets.length}</span>
                  </div>
                </div>
                <div className="text-sm text-pulse-text-secondary">
                  Potential: <span className="text-pulse-yellow font-semibold">
                    ${totalPotentialWin.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Connect prompt for unauthenticated - only in main area */}
            {!authLoading && !isConnected && (
              <div className="flex items-center justify-center mb-4 py-3 px-4 bg-pulse-bg-secondary/50 border border-pulse-pink/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-pulse-yellow" />
                  <span className="text-sm text-pulse-text-secondary">
                    Connect your wallet to start trading with multipliers up to 10x
                  </span>
                  <WalletConnect size="sm" variant="primary" />
                </div>
              </div>
            )}

            {/* Chart and grid container */}
            <div className="flex-1 relative rounded-xl overflow-hidden border border-pulse-pink/10 bg-pulse-bg-secondary/30 backdrop-blur-sm">
              {/* Price Chart */}
              <div className="absolute inset-0">
                <PriceChart symbol="SOL/USD" />
              </div>

              {/* Betting Grid Overlay - always visible but interactive only when connected */}
              <div className="absolute inset-0">
                <BettingGrid
                  currentPrice={currentPrice}
                  rows={8}
                  cols={5}
                  onCellClick={isConnected ? handleCellClick : () => {}}
                  bets={isConnected ? bets : []}
                  selectedAmount={selectedBetAmount}
                  disabled={!isConnected}
                />
              </div>

              {/* Locked overlay when not connected */}
              <AnimatePresence>
                {!authLoading && !isConnected && <LockedGridOverlay />}
              </AnimatePresence>
            </div>

            {/* Bottom action bar */}
            <div className="mt-4 flex items-center justify-between px-2">
              {/* Quick bet amounts - show but disable when not connected */}
              <div className={!isConnected ? "opacity-50 pointer-events-none" : ""}>
                <QuickBetChips
                  amounts={[1, 3, 5, 10]}
                  selectedAmount={selectedBetAmount}
                  onSelect={setSelectedBetAmount}
                />
              </div>

              {/* Bet info */}
              <div className="flex items-center gap-4 text-sm">
                {isConnected ? (
                  <div className="text-pulse-text-secondary">
                    Click grid to place{" "}
                    <span className="text-pulse-yellow font-bold">
                      ${selectedBetAmount}
                    </span>{" "}
                    bet
                  </div>
                ) : (
                  <div className="text-pulse-text-secondary flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Connect wallet to bet</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat panel toggle button (mobile) */}
          <ChatToggleButton />

          {/* Chat panel - real-time chat with bet notifications */}
          <ChatPanel />
        </div>
      </main>

      {/* Settings modal placeholder */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-pulse-bg-secondary border border-pulse-pink/20 rounded-xl p-6 w-full max-w-md mx-4 animate-bounce-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-pulse-bg/50 transition-colors"
              >
                <X className="w-5 h-5 text-pulse-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Settings options placeholder */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white">Sound Effects</span>
                <div className="w-10 h-5 rounded-full bg-pulse-pink/30 relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-pulse-pink transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white">Double-tap to confirm</span>
                <div className="w-10 h-5 rounded-full bg-pulse-bg relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-pulse-text-secondary transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white">Show price alerts</span>
                <div className="w-10 h-5 rounded-full bg-pulse-pink/30 relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-pulse-pink transition-all" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-pulse-pink/10">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-2 rounded-lg bg-pulse-pink hover:bg-pulse-pink-deep transition-colors text-white font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main page component wrapped with ToastProvider
export default function TradingPage() {
  return (
    <ToastProvider>
      <TradingContent />
    </ToastProvider>
  );
}
