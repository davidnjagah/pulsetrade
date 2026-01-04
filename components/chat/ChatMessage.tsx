"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { SimpleAvatar } from "@/components/auth/UserAvatar";

export interface ChatMessageData {
  id: string;
  userId: string;
  username: string;
  walletAddress: string;
  text: string;
  timestamp: number;
  isOwn?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
  isOwn?: boolean;
}

// Format relative time (e.g., "2m ago", "1h ago")
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

function ChatMessageComponent({ message, isOwn = false }: ChatMessageProps) {
  const relativeTime = formatRelativeTime(message.timestamp);

  return (
    <motion.div
      className={`flex items-start gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <SimpleAvatar
        address={message.walletAddress}
        displayName={message.username}
        size="sm"
        className="flex-shrink-0 w-6 h-6 text-[10px]"
      />

      {/* Message content */}
      <div className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}>
        {/* Username and timestamp */}
        <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span
            className="text-xs font-medium truncate"
            style={{ color: isOwn ? "#ff69b4" : "#ff1493" }}
          >
            {isOwn ? "You" : message.username}
          </span>
          <span className="text-[10px] text-pulse-text-secondary flex-shrink-0">
            {relativeTime}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`
            inline-block px-3 py-1.5 rounded-xl max-w-[90%]
            ${isOwn
              ? "bg-pulse-pink/20 text-white ml-auto rounded-br-md"
              : "bg-pulse-bg-secondary/80 text-white rounded-bl-md"
            }
          `}
        >
          <p className="text-sm break-words">{message.text}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
const ChatMessage = memo(ChatMessageComponent);
export default ChatMessage;
