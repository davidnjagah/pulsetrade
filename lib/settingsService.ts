/**
 * PulseTrade Settings Service
 * In-memory settings storage and management for user preferences
 *
 * Features:
 * - Per-user settings storage
 * - Default settings values
 * - Validation for each setting
 * - Get, update, and reset operations
 */

import {
  UserSettings,
  SettingsData,
  SettingsUpdateRequest,
  SettingsValidationError,
  AnimationSpeed,
} from './types';

// ============================================
// Default Settings
// ============================================

export const DEFAULT_SETTINGS: SettingsData = {
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
  animationSpeed: 'normal',
};

// ============================================
// Validation Constants
// ============================================

export const SETTINGS_VALIDATION = {
  slippageTolerance: {
    min: 1,
    max: 50,
  },
  animationSpeed: ['slow', 'normal', 'fast'] as AnimationSpeed[],
} as const;

// ============================================
// In-Memory Storage
// ============================================

interface StoredSettings {
  settings: SettingsData;
  updatedAt: Date;
  createdAt: Date;
}

// Map of userId -> StoredSettings
const settingsStore = new Map<string, StoredSettings>();

// ============================================
// Validation Functions
// ============================================

/**
 * Validate a single setting value
 */
function validateSettingValue(
  key: keyof SettingsData,
  value: unknown
): SettingsValidationError | null {
  switch (key) {
    case 'slippageTolerance': {
      if (typeof value !== 'number') {
        return {
          field: key,
          message: 'Slippage tolerance must be a number',
          value,
        };
      }
      if (value < SETTINGS_VALIDATION.slippageTolerance.min) {
        return {
          field: key,
          message: `Slippage tolerance must be at least ${SETTINGS_VALIDATION.slippageTolerance.min}%`,
          value,
        };
      }
      if (value > SETTINGS_VALIDATION.slippageTolerance.max) {
        return {
          field: key,
          message: `Slippage tolerance cannot exceed ${SETTINGS_VALIDATION.slippageTolerance.max}%`,
          value,
        };
      }
      if (!Number.isInteger(value)) {
        return {
          field: key,
          message: 'Slippage tolerance must be a whole number',
          value,
        };
      }
      return null;
    }

    case 'animationSpeed': {
      if (!SETTINGS_VALIDATION.animationSpeed.includes(value as AnimationSpeed)) {
        return {
          field: key,
          message: `Animation speed must be one of: ${SETTINGS_VALIDATION.animationSpeed.join(', ')}`,
          value,
        };
      }
      return null;
    }

    case 'backgroundMusic':
    case 'soundEffects':
    case 'showHighLowArea':
    case 'doubleTapForTrading':
    case 'confirmBeforeBet':
    case 'showMultipliers':
    case 'compactMode': {
      if (typeof value !== 'boolean') {
        return {
          field: key,
          message: `${key} must be a boolean`,
          value,
        };
      }
      return null;
    }

    default:
      return {
        field: key,
        message: `Unknown setting: ${key}`,
        value,
      };
  }
}

/**
 * Validate a settings update request
 * Returns array of validation errors (empty if valid)
 */
export function validateSettings(
  updates: SettingsUpdateRequest
): SettingsValidationError[] {
  const errors: SettingsValidationError[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const error = validateSettingValue(key as keyof SettingsData, value);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

// ============================================
// Service Functions
// ============================================

/**
 * Get settings for a user
 * Returns defaults if user has no stored settings
 */
export function getSettings(userId: string): {
  settings: SettingsData;
  updatedAt: string;
  isDefault: boolean;
} {
  const stored = settingsStore.get(userId);

  if (!stored) {
    return {
      settings: { ...DEFAULT_SETTINGS },
      updatedAt: new Date().toISOString(),
      isDefault: true,
    };
  }

  return {
    settings: { ...stored.settings },
    updatedAt: stored.updatedAt.toISOString(),
    isDefault: false,
  };
}

/**
 * Update settings for a user (partial update supported)
 * Returns updated settings or validation errors
 */
export function updateSettings(
  userId: string,
  updates: SettingsUpdateRequest
): {
  success: boolean;
  settings?: SettingsData;
  updatedAt?: string;
  errors?: SettingsValidationError[];
} {
  // Validate the updates
  const errors = validateSettings(updates);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Get current settings or defaults
  const current = settingsStore.get(userId);
  const currentSettings = current?.settings ?? { ...DEFAULT_SETTINGS };

  // Merge updates
  const newSettings: SettingsData = {
    ...currentSettings,
    ...updates,
  };

  const now = new Date();

  // Store updated settings
  settingsStore.set(userId, {
    settings: newSettings,
    updatedAt: now,
    createdAt: current?.createdAt ?? now,
  });

  console.log(`[Settings] Updated settings for user ${userId}:`, updates);

  return {
    success: true,
    settings: newSettings,
    updatedAt: now.toISOString(),
  };
}

/**
 * Reset settings to defaults for a user
 */
export function resetSettings(userId: string): {
  success: boolean;
  settings: SettingsData;
  updatedAt: string;
} {
  const now = new Date();
  const defaultSettings = { ...DEFAULT_SETTINGS };

  // Get existing createdAt or use now
  const existing = settingsStore.get(userId);
  const createdAt = existing?.createdAt ?? now;

  // Store default settings
  settingsStore.set(userId, {
    settings: defaultSettings,
    updatedAt: now,
    createdAt,
  });

  console.log(`[Settings] Reset settings to defaults for user ${userId}`);

  return {
    success: true,
    settings: defaultSettings,
    updatedAt: now.toISOString(),
  };
}

/**
 * Get full UserSettings object (includes userId)
 */
export function getUserSettings(userId: string): UserSettings {
  const { settings } = getSettings(userId);
  return {
    userId,
    ...settings,
  };
}

/**
 * Delete settings for a user (used for cleanup)
 */
export function deleteSettings(userId: string): boolean {
  const deleted = settingsStore.delete(userId);
  if (deleted) {
    console.log(`[Settings] Deleted settings for user ${userId}`);
  }
  return deleted;
}

/**
 * Check if user has customized settings
 */
export function hasCustomSettings(userId: string): boolean {
  return settingsStore.has(userId);
}

/**
 * Get settings store statistics (for debugging/monitoring)
 */
export function getSettingsStats(): {
  totalUsers: number;
  customizedUsers: number;
} {
  return {
    totalUsers: settingsStore.size,
    customizedUsers: settingsStore.size,
  };
}

// ============================================
// Exports
// ============================================

export {
  DEFAULT_SETTINGS as defaultSettings,
  SETTINGS_VALIDATION as settingsValidation,
};
