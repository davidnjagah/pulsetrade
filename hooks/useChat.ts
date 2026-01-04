"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessageData } from "@/components/chat/ChatMessage";
import { BetNotificationData, BetNotificationType } from "@/components/chat/BetNotification";

// Union type for all chat items
export type ChatItem =
  | { type: "message"; data: ChatMessageData }
  | { type: "bet"; data: BetNotificationData };

// Mock usernames for demo messages
const MOCK_USERS = [
  { id: "user1", username: "CryptoKing", walletAddress: "7KfX...8jNm" },
  { id: "user2", username: "SOLtrader", walletAddress: "3Pqr...2KxY" },
  { id: "user3", username: "DiamondHands", walletAddress: "9AbC...4DeF" },
  { id: "user4", username: "MoonBoi", walletAddress: "5GhI...1JkL" },
  { id: "user5", username: "WhaleWatcher", walletAddress: "2MnO...6PqR" },
  { id: "user6", username: "BullRunner", walletAddress: "8StU...3VwX" },
  { id: "user7", username: "DipBuyer", walletAddress: "4YzA...9BcD" },
];

// Mock chat messages
const MOCK_MESSAGES: string[] = [
  "SOL looking bullish!",
  "Just hit a 3x!",
  "This volatility is crazy",
  "Going long here",
  "Dip incoming?",
  "Who else riding this wave?",
  "2x secured, feeling good",
  "Anyone else see that spike?",
  "Diamond hands only",
  "LFG!!!",
  "Taking profits here",
  "Been up all night trading",
  "Best session yet!",
  "gl everyone",
  "What's your strategy?",
];

// Initial mock messages to show on load
function generateInitialMessages(count: number): ChatItem[] {
  const items: ChatItem[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    const isBetNotification = Math.random() < 0.3; // 30% chance of bet notification

    if (isBetNotification) {
      const betTypes: BetNotificationType[] = ["placed", "won", "lost"];
      const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
      const amount = [1, 3, 5, 10][Math.floor(Math.random() * 4)];
      const multiplier = (Math.random() * 3 + 1.2).toFixed(1);

      items.push({
        type: "bet",
        data: {
          id: `bet-${now - i * 30000}-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
          amount,
          multiplier: parseFloat(multiplier),
          type: betType,
          timestamp: now - i * 30000 - Math.random() * 20000,
          payout: betType === "won" ? amount * parseFloat(multiplier) : undefined,
        },
      });
    } else {
      items.push({
        type: "message",
        data: {
          id: `msg-${now - i * 30000}-${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
          text: MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)],
          timestamp: now - i * 30000 - Math.random() * 20000,
        },
      });
    }
  }

  // Sort by timestamp (oldest first)
  return items.sort((a, b) => {
    const timestampA = a.type === "message" ? a.data.timestamp : a.data.timestamp;
    const timestampB = b.type === "message" ? b.data.timestamp : b.data.timestamp;
    return timestampA - timestampB;
  });
}

interface UseChatOptions {
  currentUserId?: string;
  currentUsername?: string;
  currentWalletAddress?: string;
  enableMockUpdates?: boolean;
  mockUpdateInterval?: number;
}

interface UseChatReturn {
  items: ChatItem[];
  onlineCount: number;
  isLoading: boolean;
  sendMessage: (text: string) => void;
  addBetNotification: (
    amount: number,
    multiplier: number,
    type: BetNotificationType,
    payout?: number
  ) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
}

export function useChat({
  currentUserId,
  currentUsername,
  currentWalletAddress,
  enableMockUpdates = true,
  mockUpdateInterval = 8000,
}: UseChatOptions = {}): UseChatReturn {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [onlineCount, setOnlineCount] = useState(42); // Mock online count
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with mock messages
  useEffect(() => {
    const initialItems = generateInitialMessages(8);
    setItems(initialItems);
    setIsLoading(false);
  }, []);

  // Auto-scroll to bottom when new items are added
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Scroll to bottom when items change
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [items, scrollToBottom]);

  // Mock real-time updates
  useEffect(() => {
    if (!enableMockUpdates) return;

    const interval = setInterval(() => {
      const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      const isBetNotification = Math.random() < 0.4; // 40% chance of bet notification

      if (isBetNotification) {
        const betTypes: BetNotificationType[] = ["placed", "won", "lost"];
        const betType = betTypes[Math.floor(Math.random() * 3)];
        const amount = [1, 3, 5, 10][Math.floor(Math.random() * 4)];
        const multiplier = (Math.random() * 3 + 1.2).toFixed(1);

        const newBet: ChatItem = {
          type: "bet",
          data: {
            id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            username: user.username,
            walletAddress: user.walletAddress,
            amount,
            multiplier: parseFloat(multiplier),
            type: betType,
            timestamp: Date.now(),
            payout: betType === "won" ? amount * parseFloat(multiplier) : undefined,
          },
        };

        setItems((prev) => [...prev.slice(-49), newBet]); // Keep last 50 items
      } else {
        const newMessage: ChatItem = {
          type: "message",
          data: {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            username: user.username,
            walletAddress: user.walletAddress,
            text: MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)],
            timestamp: Date.now(),
          },
        };

        setItems((prev) => [...prev.slice(-49), newMessage]); // Keep last 50 items
      }

      // Randomly fluctuate online count
      setOnlineCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(20, Math.min(100, prev + change));
      });
    }, mockUpdateInterval);

    return () => clearInterval(interval);
  }, [enableMockUpdates, mockUpdateInterval]);

  // Send a new message
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !currentUserId) return;

      const newMessage: ChatItem = {
        type: "message",
        data: {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: currentUserId,
          username: currentUsername || "Anonymous",
          walletAddress: currentWalletAddress || "0x...",
          text: text.trim(),
          timestamp: Date.now(),
          isOwn: true,
        },
      };

      setItems((prev) => [...prev.slice(-49), newMessage]);
    },
    [currentUserId, currentUsername, currentWalletAddress]
  );

  // Add a bet notification (called from external bet placement)
  const addBetNotification = useCallback(
    (
      amount: number,
      multiplier: number,
      type: BetNotificationType,
      payout?: number
    ) => {
      if (!currentUserId) return;

      const newBet: ChatItem = {
        type: "bet",
        data: {
          id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: currentUserId,
          username: currentUsername || "Anonymous",
          walletAddress: currentWalletAddress || "0x...",
          amount,
          multiplier,
          type,
          timestamp: Date.now(),
          payout,
          isOwn: true,
        },
      };

      setItems((prev) => [...prev.slice(-49), newBet]);
    },
    [currentUserId, currentUsername, currentWalletAddress]
  );

  return {
    items,
    onlineCount,
    isLoading,
    sendMessage,
    addBetNotification,
    scrollRef,
    scrollToBottom,
  };
}

export default useChat;
