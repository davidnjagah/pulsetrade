"use client";

import { motion } from "framer-motion";

export interface ToggleSwitchProps {
  /** Whether the toggle is on or off */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Main label text */
  label: string;
  /** Optional description text below the label */
  description?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Optional ID for accessibility */
  id?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleSwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      className={`flex items-center justify-between py-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {/* Label and description */}
      <div className="flex-1 pr-4">
        <label
          htmlFor={id}
          className={`block text-sm font-medium text-white ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-pulse-text-secondary">
            {description}
          </p>
        )}
      </div>

      {/* Toggle switch */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative w-12 h-6 rounded-full transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-pink focus-visible:ring-offset-2 focus-visible:ring-offset-pulse-bg
          ${
            disabled
              ? "cursor-not-allowed bg-pulse-bg/50"
              : "cursor-pointer"
          }
          ${
            checked
              ? "bg-pulse-pink shadow-[0_0_12px_rgba(255,105,180,0.4)]"
              : "bg-pulse-bg-secondary border border-pulse-pink/20"
          }
        `}
      >
        {/* Toggle knob */}
        <motion.div
          className={`
            absolute top-0.5 w-5 h-5 rounded-full shadow-md
            ${checked ? "bg-white" : "bg-pulse-text-secondary"}
          `}
          initial={false}
          animate={{
            left: checked ? "calc(100% - 22px)" : "2px",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>
    </div>
  );
}

// Export a version that can be used inline without label
export function InlineToggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const sizes = {
    sm: { track: "w-8 h-4", knob: "w-3 h-3", offset: "14px" },
    md: { track: "w-12 h-6", knob: "w-5 h-5", offset: "22px" },
  };

  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative ${s.track} rounded-full transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-pink
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${
          checked
            ? "bg-pulse-pink shadow-[0_0_12px_rgba(255,105,180,0.4)]"
            : "bg-pulse-bg-secondary border border-pulse-pink/20"
        }
      `}
    >
      <motion.div
        className={`
          absolute top-0.5 ${s.knob} rounded-full shadow-md
          ${checked ? "bg-white" : "bg-pulse-text-secondary"}
        `}
        initial={false}
        animate={{
          left: checked ? `calc(100% - ${s.offset})` : "2px",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />
    </button>
  );
}
