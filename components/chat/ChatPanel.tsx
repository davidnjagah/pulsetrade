"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Users, X, Loader2 } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { useAuthContext } from "@/context/AuthContext";
import ChatMessage from "./ChatMessage";
import BetNotification, { BetNotificationInline } from "./BetNotification";
import ChatInput from "./ChatInput";

interface ChatPanelProps {
  className?: string;
}

export default function ChatPanel({ className = "" }: ChatPanelProps) {
  const {
    items,
    onlineCount,
    isLoading,
    isChatOpen,
    sendMessage,
    closeChat,
    scrollRef,
  } = useChatContext();

  const { isConnected, user } = useAuthContext();

  // Current user ID for determining own messages
  const currentUserId = user?.id;

  // Filter recent bet notifications for sidebar header
  const recentBets = useMemo(() => {
    return items
      .filter((item) => item.type === "bet")
      .slice(-3)
      .reverse();
  }, [items]);

  return (
    <>
      {/* Desktop panel - always visible on lg+ screens */}
      <aside
        className={`
          hidden lg:flex flex-col
          w-[280px] min-w-[280px]
          bg-pulse-bg/95 backdrop-blur-md
          border-l border-pulse-pink/10
          ${className}
        `}
      >
        <ChatPanelContent
          items={items}
          recentBets={recentBets}
          onlineCount={onlineCount}
          isLoading={isLoading}
          isConnected={isConnected}
          currentUserId={currentUserId}
          sendMessage={sendMessage}
          scrollRef={scrollRef}
        />
      </aside>

      {/* Mobile slide-in panel */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChat}
            />

            {/* Slide-in panel */}
            <motion.aside
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-pulse-bg/98 backdrop-blur-md border-l border-pulse-pink/10 z-50 lg:hidden flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Close button for mobile */}
              <button
                onClick={closeChat}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-pulse-pink/10 transition-colors z-10"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-pulse-text-secondary" />
              </button>

              <ChatPanelContent
                items={items}
                recentBets={recentBets}
                onlineCount={onlineCount}
                isLoading={isLoading}
                isConnected={isConnected}
                currentUserId={currentUserId}
                sendMessage={sendMessage}
                scrollRef={scrollRef}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Internal panel content component
interface ChatPanelContentProps {
  items: ReturnType<typeof useChatContext>["items"];
  recentBets: ReturnType<typeof useChatContext>["items"];
  onlineCount: number;
  isLoading: boolean;
  isConnected: boolean;
  currentUserId?: string;
  sendMessage: (text: string) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  isMobile?: boolean;
}

function ChatPanelContent({
  items,
  recentBets,
  onlineCount,
  isLoading,
  isConnected,
  currentUserId,
  sendMessage,
  scrollRef,
  isMobile = false,
}: ChatPanelContentProps) {
  return (
    <>
      {/* Header */}
      <div className={`p-4 border-b border-pulse-pink/10 ${isMobile ? "pr-12" : ""}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-pulse-pink" />
            Live Chat
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-pulse-text-secondary">
            <Users className="w-3.5 h-3.5" />
            <span>{onlineCount}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Recent bets feed */}
      {recentBets.length > 0 && (
        <div className="p-3 border-b border-pulse-pink/10 bg-pulse-bg-secondary/30">
          <h3 className="text-xs font-semibold text-pulse-text-secondary mb-2 flex items-center gap-1.5">
            Recent Activity
          </h3>
          <div className="space-y-1">
            {recentBets.map((item) => {
              if (item.type === "bet") {
                return (
                  <BetNotificationInline
                    key={item.data.id}
                    notification={item.data}
                    isOwn={item.data.userId === currentUserId}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Chat messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-pulse-pink animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageCircle className="w-8 h-8 text-pulse-text-secondary/50 mb-2" />
            <p className="text-sm text-pulse-text-secondary">No messages yet</p>
            <p className="text-xs text-pulse-text-secondary/70">
              Be the first to chat!
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isOwn = item.data.userId === currentUserId;

            if (item.type === "message") {
              return (
                <ChatMessage
                  key={item.data.id}
                  message={item.data}
                  isOwn={isOwn}
                />
              );
            } else {
              return (
                <BetNotification
                  key={item.data.id}
                  notification={item.data}
                  isOwn={isOwn}
                />
              );
            }
          })
        )}
      </div>

      {/* Chat input */}
      <ChatInput
        onSend={sendMessage}
        disabled={!isConnected}
        placeholder="Type a message..."
        maxLength={200}
      />
    </>
  );
}

// Mobile toggle button component
export function ChatToggleButton() {
  const { isChatOpen, toggleChat, items } = useChatContext();

  // Count unread messages (simple implementation - could be enhanced)
  const hasUnread = items.length > 0;

  return (
    <motion.button
      onClick={toggleChat}
      className="fixed bottom-4 right-4 z-40 lg:hidden p-3 rounded-full bg-pulse-pink shadow-pulse-glow"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isChatOpen ? "Close chat" : "Open chat"}
    >
      {isChatOpen ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <>
          <MessageCircle className="w-6 h-6 text-white" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-pulse-yellow border-2 border-pulse-bg" />
          )}
        </>
      )}
    </motion.button>
  );
}
