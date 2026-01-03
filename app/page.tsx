"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import PriceChart from "@/components/trading/PriceChart";
import BettingGrid from "@/components/trading/BettingGrid";
import { MessageCircle, X } from "lucide-react";

export default function TradingPage() {
  const [activeNavItem, setActiveNavItem] = useState("trade");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleCellClick = (cell: { id: string; multiplier: number; priceLevel: number }) => {
    console.log("Cell clicked:", cell);
    // This will be expanded in Sprint 2 for bet placement
  };

  return (
    <div className="min-h-screen bg-pulse-gradient">
      {/* Header */}
      <Header onSettingsClick={() => setShowSettings(true)} />

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
            {/* Chart and grid container */}
            <div className="flex-1 relative rounded-xl overflow-hidden border border-pulse-pink/10 bg-pulse-bg-secondary/30 backdrop-blur-sm">
              {/* Price Chart */}
              <div className="absolute inset-0">
                <PriceChart symbol="SOL/USD" />
              </div>

              {/* Betting Grid Overlay */}
              <div className="absolute inset-0 pointer-events-auto">
                <BettingGrid
                  currentPrice={97500}
                  rows={8}
                  cols={6}
                  onCellClick={handleCellClick}
                />
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="mt-4 flex items-center justify-between px-2">
              {/* Quick bet amounts */}
              <div className="flex items-center gap-2">
                {[1, 3, 5, 10].map((amount) => (
                  <button
                    key={amount}
                    className="bet-chip text-sm"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Active bets indicator */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-pulse-text-secondary">
                  Active Bets: <span className="text-white font-semibold">0</span>
                </div>
                <div className="text-sm text-pulse-text-secondary">
                  Potential Win: <span className="text-pulse-yellow font-semibold">$0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat panel toggle button (mobile) */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-4 right-4 z-50 lg:hidden p-3 rounded-full bg-pulse-pink shadow-pulse-glow tap-target"
            aria-label="Toggle chat"
          >
            {isChatOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Chat panel placeholder */}
          <aside
            className={`
              fixed lg:relative right-0 top-14 bottom-0 w-72 lg:w-64
              bg-pulse-bg/95 backdrop-blur-md border-l border-pulse-pink/10
              transform transition-transform duration-300 ease-in-out z-40
              ${isChatOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            `}
          >
            <div className="h-full flex flex-col">
              {/* Chat header */}
              <div className="p-4 border-b border-pulse-pink/10">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-pulse-pink" />
                  Live Chat
                </h2>
              </div>

              {/* Chat messages placeholder */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {/* Placeholder messages */}
                  {[
                    { user: "Trader1", message: "SOL looking bullish!", color: "#ff69b4" },
                    { user: "CryptoKing", message: "Just won 2x on that dip!", color: "#e6ff00" },
                    { user: "WhaleAlert", message: "Big buy incoming...", color: "#ff1493" },
                  ].map((msg, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-pulse-bg"
                        style={{ background: msg.color }}
                      >
                        {msg.user[0]}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-pulse-text-secondary">{msg.user}</span>
                        <p className="text-sm text-white">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat input placeholder */}
              <div className="p-4 border-t border-pulse-pink/10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm bg-pulse-bg-secondary/80 border border-pulse-pink/20 rounded-lg text-white placeholder:text-pulse-text-secondary focus:outline-none focus:border-pulse-pink/40"
                  />
                  <button className="p-2 rounded-lg bg-pulse-pink hover:bg-pulse-pink-deep transition-colors">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
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
