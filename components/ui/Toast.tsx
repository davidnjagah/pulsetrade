"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Trophy, TrendingDown } from "lucide-react";

// Toast types
export type ToastType = "win" | "loss" | "info" | "error" | "success";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  amount?: number;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  showWin: (amount: number, message?: string) => void;
  showLoss: (amount: number, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider Component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showWin = useCallback(
    (amount: number, message?: string) => {
      addToast({
        type: "win",
        title: `You won $${amount.toFixed(2)}!`,
        message: message || "Nice trade!",
        amount,
      });
    },
    [addToast]
  );

  const showLoss = useCallback(
    (amount: number, message?: string) => {
      addToast({
        type: "loss",
        title: `You lost $${amount.toFixed(2)}`,
        message: message || "Better luck next time!",
        amount,
      });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearAll, showWin, showLoss }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toasts
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast Container (positioned in top-right)
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Individual Toast Item
function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const getIcon = () => {
    switch (toast.type) {
      case "win":
        return <Trophy className="w-5 h-5" />;
      case "loss":
        return <TrendingDown className="w-5 h-5" />;
      case "success":
        return <Check className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case "win":
        return {
          bg: "rgba(0, 0, 0, 0.9)",
          iconBg: "bg-green-500/20",
          iconColor: "text-green-400",
          border: "border-green-500/30",
          glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
        };
      case "loss":
        return {
          bg: "rgba(0, 0, 0, 0.9)",
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400",
          border: "border-red-500/30",
          glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        };
      case "success":
        return {
          bg: "rgba(0, 0, 0, 0.9)",
          iconBg: "bg-green-500/20",
          iconColor: "text-green-400",
          border: "border-green-500/30",
          glow: "",
        };
      case "error":
        return {
          bg: "rgba(0, 0, 0, 0.9)",
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400",
          border: "border-red-500/30",
          glow: "",
        };
      default:
        return {
          bg: "rgba(50, 50, 50, 0.95)",
          iconBg: "bg-blue-500/20",
          iconColor: "text-blue-400",
          border: "border-pulse-pink/20",
          glow: "",
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        x: 100,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        x: 100,
        scale: 0.9,
        transition: {
          duration: 0.15,
        },
      }}
      className={`
        pointer-events-auto flex items-center gap-3
        px-4 py-3 rounded-xl backdrop-blur-md
        border ${styles.border} ${styles.glow}
        min-w-[280px] max-w-[360px]
      `}
      style={{
        background: styles.bg,
      }}
    >
      {/* Icon */}
      <div
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg
          ${styles.iconBg} ${styles.iconColor}
        `}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 rounded-full"
          style={{
            background:
              toast.type === "win"
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : toast.type === "loss"
                ? "linear-gradient(90deg, #ef4444, #f87171)"
                : "linear-gradient(90deg, #ff69b4, #ff1493)",
          }}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{
            duration: toast.duration / 1000,
            ease: "linear",
          }}
        />
      )}
    </motion.div>
  );
}

// Standalone Toast Component (for use without provider)
interface StandaloneToastProps {
  toast: Toast;
  onClose: () => void;
}

export function StandaloneToast({ toast, onClose }: StandaloneToastProps) {
  return <ToastItem toast={toast} onClose={onClose} />;
}

export default ToastContainer;
