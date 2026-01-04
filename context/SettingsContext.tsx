"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  useSettings,
  UseSettingsReturn,
  Settings,
  DEFAULT_SETTINGS,
  ANIMATION_DURATIONS,
} from "@/hooks/useSettings";

// Context type - matches the hook return type
type SettingsContextType = UseSettingsReturn;

// Create the context with undefined default
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// Provider props
interface SettingsProviderProps {
  children: ReactNode;
}

// Settings Provider component
export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsHook = useSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider"
    );
  }

  return context;
}

// Re-export types and constants for convenience
export type { Settings };
export { DEFAULT_SETTINGS, ANIMATION_DURATIONS };

export default SettingsContext;
