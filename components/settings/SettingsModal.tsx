"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Volume2,
  TrendingUp,
  Monitor,
  RotateCcw,
} from "lucide-react";
import { useSettingsContext } from "@/context/SettingsContext";
import ToggleSwitch from "./ToggleSwitch";
import SliderControl, { AnimationSpeedSlider } from "./SliderControl";
import SettingsSection, { SettingsDivider } from "./SettingsSection";

export interface SettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSetting, resetToDefaults, isDefault } =
    useSettingsContext();

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal container */}
          <motion.div
            className="relative w-full max-w-md max-h-[85vh] overflow-hidden bg-pulse-bg-secondary border border-pulse-pink/20 rounded-2xl shadow-2xl"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-pulse-bg-secondary border-b border-pulse-pink/10">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg text-pulse-text-secondary hover:text-white hover:bg-pulse-bg/50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-pink"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto max-h-[calc(85vh-8rem)] px-6 py-4 scrollbar-thin scrollbar-thumb-pulse-pink/30 scrollbar-track-transparent">
              {/* Sounds Section */}
              <SettingsSection
                title="Sounds"
                icon={<Volume2 className="w-4 h-4" />}
              >
                <ToggleSwitch
                  label="Background Music"
                  description="Play ambient music while trading"
                  checked={settings.backgroundMusic}
                  onChange={(checked) =>
                    updateSetting("backgroundMusic", checked)
                  }
                  id="setting-background-music"
                />
                <ToggleSwitch
                  label="Sound Effects"
                  description="Play sounds for bets, wins, and notifications"
                  checked={settings.soundEffects}
                  onChange={(checked) => updateSetting("soundEffects", checked)}
                  id="setting-sound-effects"
                />
              </SettingsSection>

              <SettingsDivider />

              {/* Trading Section */}
              <SettingsSection
                title="Trading"
                icon={<TrendingUp className="w-4 h-4" />}
              >
                <SliderControl
                  label="Slippage Tolerance"
                  description="Max price deviation allowed for bet execution"
                  value={settings.slippageTolerance}
                  onChange={(value) =>
                    updateSetting("slippageTolerance", value)
                  }
                  min={1}
                  max={50}
                  step={1}
                  formatValue={(v) => `${v}%`}
                />
                <ToggleSwitch
                  label="Show High/Low Area"
                  description="Display price range indicators on the chart"
                  checked={settings.showHighLowArea}
                  onChange={(checked) =>
                    updateSetting("showHighLowArea", checked)
                  }
                  id="setting-high-low-area"
                />
                <ToggleSwitch
                  label="Double Tap for Trading"
                  description="Require double tap to place bets"
                  checked={settings.doubleTapForTrading}
                  onChange={(checked) =>
                    updateSetting("doubleTapForTrading", checked)
                  }
                  id="setting-double-tap"
                />
                <ToggleSwitch
                  label="Confirm Before Bet"
                  description="Show confirmation dialog before placing bets"
                  checked={settings.confirmBeforeBet}
                  onChange={(checked) =>
                    updateSetting("confirmBeforeBet", checked)
                  }
                  id="setting-confirm-bet"
                />
              </SettingsSection>

              <SettingsDivider />

              {/* Display Section */}
              <SettingsSection
                title="Display"
                icon={<Monitor className="w-4 h-4" />}
              >
                <ToggleSwitch
                  label="Show Multipliers"
                  description="Display multiplier values in grid cells"
                  checked={settings.showMultipliers}
                  onChange={(checked) =>
                    updateSetting("showMultipliers", checked)
                  }
                  id="setting-show-multipliers"
                />
                <ToggleSwitch
                  label="Compact Mode"
                  description="Reduce spacing and element sizes"
                  checked={settings.compactMode}
                  onChange={(checked) => updateSetting("compactMode", checked)}
                  id="setting-compact-mode"
                />
                <AnimationSpeedSlider
                  value={settings.animationSpeed}
                  onChange={(value) => updateSetting("animationSpeed", value)}
                />
              </SettingsSection>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-between px-6 py-4 bg-pulse-bg-secondary border-t border-pulse-pink/10">
              {/* Reset button */}
              <button
                onClick={resetToDefaults}
                disabled={isDefault}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-pink
                  ${
                    isDefault
                      ? "text-pulse-text-secondary/50 cursor-not-allowed"
                      : "text-pulse-text-secondary hover:text-white hover:bg-pulse-bg/50"
                  }
                `}
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>

              {/* Done button */}
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-pulse-pink hover:bg-pulse-pink-deep text-white font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-pink focus-visible:ring-offset-2 focus-visible:ring-offset-pulse-bg shadow-[0_0_16px_rgba(255,105,180,0.3)] hover:shadow-[0_0_24px_rgba(255,105,180,0.4)]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
