"use client";

import { useState, useCallback, KeyboardEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Send, Lock } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  isLoading?: boolean;
}

const MAX_MESSAGE_LENGTH = 200;

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = MAX_MESSAGE_LENGTH,
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isAtLimit = characterCount >= maxLength;
  const canSend = message.trim().length > 0 && !disabled && !isLoading;

  // Handle input change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        setMessage(newValue);
      }
    },
    [maxLength]
  );

  // Handle send action
  const handleSend = useCallback(() => {
    if (canSend) {
      const trimmedMessage = message.trim();
      onSend(trimmedMessage);
      setMessage("");
    }
  }, [canSend, message, onSend]);

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="p-3 border-t border-pulse-pink/10 bg-pulse-bg/50">
      {/* Character count indicator (shown when typing) */}
      {isFocused && characterCount > 0 && (
        <motion.div
          className="flex justify-end mb-1"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          <span
            className={`text-[10px] ${
              isAtLimit
                ? "text-red-400"
                : isNearLimit
                ? "text-pulse-yellow"
                : "text-pulse-text-secondary"
            }`}
          >
            {characterCount}/{maxLength}
          </span>
        </motion.div>
      )}

      {/* Input container */}
      <div className="flex items-center gap-2">
        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={disabled ? "Connect to chat..." : placeholder}
            className={`
              w-full px-3 py-2 text-sm
              bg-pulse-bg-secondary/80 border rounded-lg
              text-white placeholder:text-pulse-text-secondary
              focus:outline-none transition-colors duration-200
              ${disabled
                ? "opacity-50 cursor-not-allowed border-pulse-pink/10"
                : isFocused
                ? "border-pulse-pink/40 shadow-[0_0_10px_rgba(255,105,180,0.1)]"
                : "border-pulse-pink/20 hover:border-pulse-pink/30"
              }
            `}
            autoComplete="off"
          />

          {/* Lock icon overlay when disabled */}
          {disabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Lock className="w-4 h-4 text-pulse-text-secondary" />
            </div>
          )}
        </div>

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            p-2 rounded-lg transition-colors duration-200
            ${canSend
              ? "bg-pulse-pink hover:bg-pulse-pink-deep text-white shadow-pulse-glow"
              : "bg-pulse-bg-secondary/50 text-pulse-text-secondary cursor-not-allowed"
            }
          `}
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
          aria-label="Send message"
        >
          {isLoading ? (
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Helper text for disabled state */}
      {disabled && (
        <p className="mt-2 text-[10px] text-pulse-text-secondary text-center">
          Connect your wallet to join the chat
        </p>
      )}
    </div>
  );
}
