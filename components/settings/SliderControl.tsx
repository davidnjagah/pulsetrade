"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

export interface SliderControlProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step?: number;
  /** Main label text */
  label: string;
  /** Optional description text */
  description?: string;
  /** Format the display value (e.g., add % suffix) */
  formatValue?: (value: number) => string;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Custom step options (for discrete values like slow/normal/fast) */
  discreteOptions?: { value: number; label: string }[];
}

export default function SliderControl({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  description,
  formatValue = (v) => `${v}%`,
  disabled = false,
  discreteOptions,
}: SliderControlProps) {
  const handleIncrement = useCallback(() => {
    if (!disabled) {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    }
  }, [disabled, max, value, step, onChange]);

  const handleDecrement = useCallback(() => {
    if (!disabled) {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    }
  }, [disabled, min, value, step, onChange]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        onChange(Number(e.target.value));
      }
    },
    [disabled, onChange]
  );

  // Calculate percentage for the filled track
  const percentage = ((value - min) / (max - min)) * 100;

  // Get display value
  const displayValue = discreteOptions
    ? discreteOptions.find((opt) => opt.value === value)?.label || formatValue(value)
    : formatValue(value);

  return (
    <div className={`py-3 ${disabled ? "opacity-50" : ""}`}>
      {/* Label and value display */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-medium text-white">{label}</span>
          {description && (
            <p className="mt-0.5 text-xs text-pulse-text-secondary">
              {description}
            </p>
          )}
        </div>
        <motion.span
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-bold text-pulse-pink min-w-[48px] text-right"
        >
          {displayValue}
        </motion.span>
      </div>

      {/* Slider with +/- buttons */}
      <div className="flex items-center gap-3">
        {/* Minus button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={`
            flex items-center justify-center w-8 h-8 rounded-lg
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-pink
            ${
              disabled || value <= min
                ? "bg-pulse-bg/50 text-pulse-text-secondary/50 cursor-not-allowed"
                : "bg-pulse-bg-secondary border border-pulse-pink/20 text-pulse-text-secondary hover:text-white hover:border-pulse-pink/40 active:scale-95"
            }
          `}
          aria-label="Decrease value"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Slider track */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            disabled={disabled}
            className={`
              w-full h-2 rounded-full appearance-none cursor-pointer
              bg-pulse-bg-secondary
              focus:outline-none
              disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,105,180,0.5)]
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:duration-150
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:shadow-[0_0_8px_rgba(255,105,180,0.5)]
              [&::-moz-range-thumb]:cursor-pointer
            `}
            style={{
              background: `linear-gradient(to right, #ff69b4 0%, #ff69b4 ${percentage}%, rgba(255,105,180,0.2) ${percentage}%, rgba(255,105,180,0.2) 100%)`,
            }}
          />

          {/* Discrete option labels */}
          {discreteOptions && (
            <div className="absolute w-full flex justify-between mt-1 px-1">
              {discreteOptions.map((opt) => (
                <span
                  key={opt.value}
                  className={`text-xs ${
                    opt.value === value
                      ? "text-pulse-pink font-medium"
                      : "text-pulse-text-secondary"
                  }`}
                >
                  {opt.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Plus button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={`
            flex items-center justify-center w-8 h-8 rounded-lg
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-pink
            ${
              disabled || value >= max
                ? "bg-pulse-bg/50 text-pulse-text-secondary/50 cursor-not-allowed"
                : "bg-pulse-bg-secondary border border-pulse-pink/20 text-pulse-text-secondary hover:text-white hover:border-pulse-pink/40 active:scale-95"
            }
          `}
          aria-label="Increase value"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Preset for Animation Speed slider
export function AnimationSpeedSlider({
  value,
  onChange,
  disabled = false,
}: {
  value: "slow" | "normal" | "fast";
  onChange: (value: "slow" | "normal" | "fast") => void;
  disabled?: boolean;
}) {
  const valueMap: Record<"slow" | "normal" | "fast", number> = {
    slow: 0,
    normal: 1,
    fast: 2,
  };

  const reverseMap: Record<number, "slow" | "normal" | "fast"> = {
    0: "slow",
    1: "normal",
    2: "fast",
  };

  const discreteOptions = [
    { value: 0, label: "Slow" },
    { value: 1, label: "Normal" },
    { value: 2, label: "Fast" },
  ];

  return (
    <SliderControl
      value={valueMap[value]}
      onChange={(v) => onChange(reverseMap[v])}
      min={0}
      max={2}
      step={1}
      label="Animation Speed"
      description="Controls the speed of UI animations"
      formatValue={() => ""}
      discreteOptions={discreteOptions}
      disabled={disabled}
    />
  );
}
