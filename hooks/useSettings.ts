"use client";

import { useState, useCallback, useEffect } from "react";

// Settings interface with all configurable options
export interface Settings {
  // Sounds Section
  backgroundMusic: boolean;
  soundEffects: boolean;

  // Trading Section
  slippageTolerance: number; // 1-50%
  showHighLowArea: boolean;
  doubleTapForTrading: boolean;
  confirmBeforeBet: boolean;

  // Display Section
  showMultipliers: boolean;
  compactMode: boolean;
  animationSpeed: "slow" | "normal" | "fast";
}

// Default settings values
export const DEFAULT_SETTINGS: Settings = {
  // Sounds
  backgroundMusic: false,
  soundEffects: true,

  // Trading
  slippageTolerance: 30, // 30%
  showHighLowArea: false,
  doubleTapForTrading: false,
  confirmBeforeBet: true,

  // Display
  showMultipliers: true,
  compactMode: false,
  animationSpeed: "normal",
};

// localStorage key for settings persistence
const SETTINGS_STORAGE_KEY = "pulsetrade_settings";

// Animation duration mapping
export const ANIMATION_DURATIONS = {
  slow: 600,
  normal: 300,
  fast: 150,
} as const;

// Load settings from localStorage
function loadSettings(): Settings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle any missing keys from older versions
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }

  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
}

// Hook return type
export interface UseSettingsReturn {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  resetToDefaults: () => void;
  isDefault: boolean;
  getAnimationDuration: () => number;
}

// Main useSettings hook
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever settings change (after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveSettings(settings);
    }
  }, [settings, isInitialized]);

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Reset all settings to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Check if current settings match defaults
  const isDefault =
    JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS);

  // Get the current animation duration in ms
  const getAnimationDuration = useCallback(() => {
    return ANIMATION_DURATIONS[settings.animationSpeed];
  }, [settings.animationSpeed]);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    isDefault,
    getAnimationDuration,
  };
}

export default useSettings;
