"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { ChatItem, useChat } from "@/hooks/useChat";
import { BetNotificationType } from "@/components/chat/BetNotification";
import { useAuthContext } from "@/context/AuthContext";

// Chat context interface
interface ChatContextType {
  items: ChatItem[];
  onlineCount: number;
  isLoading: boolean;
  isChatOpen: boolean;
  sendMessage: (text: string) => void;
  addBetNotification: (
    amount: number,
    multiplier: number,
    type: BetNotificationType,
    payout?: number
  ) => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider props
interface ChatProviderProps {
  children: ReactNode;
}

// Chat provider component
export function ChatProvider({ children }: ChatProviderProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, walletAddress, isConnected } = useAuthContext();

  // Initialize useChat with current user info
  const {
    items,
    onlineCount,
    isLoading,
    sendMessage: chatSendMessage,
    addBetNotification: chatAddBetNotification,
    scrollRef,
    scrollToBottom,
  } = useChat({
    currentUserId: user?.id,
    currentUsername: user?.displayName,
    currentWalletAddress: walletAddress || undefined,
    enableMockUpdates: true,
    mockUpdateInterval: 8000,
  });

  // Wrapped sendMessage that checks auth
  const sendMessage = useCallback(
    (text: string) => {
      if (!isConnected) {
        console.warn("Cannot send message: not authenticated");
        return;
      }
      chatSendMessage(text);
    },
    [isConnected, chatSendMessage]
  );

  // Wrapped addBetNotification that checks auth
  const addBetNotification = useCallback(
    (
      amount: number,
      multiplier: number,
      type: BetNotificationType,
      payout?: number
    ) => {
      if (!isConnected) {
        console.warn("Cannot add bet notification: not authenticated");
        return;
      }
      chatAddBetNotification(amount, multiplier, type, payout);
    },
    [isConnected, chatAddBetNotification]
  );

  // Toggle chat panel
  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  // Open chat panel
  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  // Close chat panel
  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (isChatOpen) {
      // Small delay to ensure panel animation completes
      const timer = setTimeout(scrollToBottom, 300);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen, scrollToBottom]);

  // Context value
  const value: ChatContextType = {
    items,
    onlineCount,
    isLoading,
    isChatOpen,
    sendMessage,
    addBetNotification,
    toggleChat,
    openChat,
    closeChat,
    scrollRef,
    scrollToBottom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Custom hook to use chat context
export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);

  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }

  return context;
}

export default ChatContext;
