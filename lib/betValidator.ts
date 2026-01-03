/**
 * PulseTrade Bet Validator
 * Comprehensive validation for bet placement requests
 *
 * Validates:
 * - Bet amount within limits
 * - User balance sufficient
 * - Target price is reasonable
 * - Target time is valid (future but not too far)
 * - Active bets count within limit
 * - Potential payout within limits
 */

import {
  BetPlaceRequest,
  ValidationResult,
  BETTING_LIMITS,
} from './types';
import { calculateMultiplier, calculatePotentialPayout } from './multiplierCalculator';

// ============================================
// Constants
// ============================================

const MIN_TIME_TO_TARGET_MS = 5 * 1000; // 5 seconds minimum
const MAX_TIME_TO_TARGET_MS = 60 * 60 * 1000; // 1 hour maximum
const MIN_PRICE_DISTANCE_PERCENT = 0.0001; // 0.01% minimum distance
const MAX_PRICE_DISTANCE_PERCENT = 0.50; // 50% maximum distance

// ============================================
// Types
// ============================================

export interface BetValidationContext {
  userBalance: number;
  activeBetsCount: number;
  currentPrice: number;
  currentTime: number;
  dailyPayoutTotal?: number;
}

export interface DetailedValidationResult extends ValidationResult {
  calculatedMultiplier?: number;
  potentialPayout?: number;
}

// ============================================
// Individual Validators
// ============================================

/**
 * Validate bet amount is within allowed limits
 */
export function validateAmount(amount: number): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return {
      valid: false,
      error: 'Amount must be a valid number',
      details: { provided: amount },
    };
  }

  if (amount < BETTING_LIMITS.MIN_BET) {
    return {
      valid: false,
      error: `Minimum bet is $${BETTING_LIMITS.MIN_BET}`,
      details: { minBet: BETTING_LIMITS.MIN_BET, provided: amount },
    };
  }

  if (amount > BETTING_LIMITS.MAX_BET) {
    return {
      valid: false,
      error: `Maximum bet is $${BETTING_LIMITS.MAX_BET}`,
      details: { maxBet: BETTING_LIMITS.MAX_BET, provided: amount },
    };
  }

  // Check for reasonable precision (max 2 decimal places)
  if (Math.round(amount * 100) !== amount * 100) {
    return {
      valid: false,
      error: 'Amount can have at most 2 decimal places',
      details: { provided: amount },
    };
  }

  return { valid: true };
}

/**
 * Validate user has sufficient balance
 */
export function validateBalance(amount: number, userBalance: number): ValidationResult {
  if (amount > userBalance) {
    return {
      valid: false,
      error: 'Insufficient balance',
      details: { required: amount, available: userBalance },
    };
  }

  return { valid: true };
}

/**
 * Validate target price is reasonable
 */
export function validateTargetPrice(
  targetPrice: number,
  currentPrice: number
): ValidationResult {
  if (typeof targetPrice !== 'number' || isNaN(targetPrice)) {
    return {
      valid: false,
      error: 'Target price must be a valid number',
      details: { provided: targetPrice },
    };
  }

  if (targetPrice <= 0) {
    return {
      valid: false,
      error: 'Target price must be positive',
      details: { provided: targetPrice },
    };
  }

  // Calculate price distance
  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;

  if (priceDistance < MIN_PRICE_DISTANCE_PERCENT) {
    return {
      valid: false,
      error: 'Target price is too close to current price',
      details: {
        minDistancePercent: MIN_PRICE_DISTANCE_PERCENT * 100,
        actualDistancePercent: priceDistance * 100,
        currentPrice,
        targetPrice,
      },
    };
  }

  if (priceDistance > MAX_PRICE_DISTANCE_PERCENT) {
    return {
      valid: false,
      error: 'Target price is too far from current price',
      details: {
        maxDistancePercent: MAX_PRICE_DISTANCE_PERCENT * 100,
        actualDistancePercent: priceDistance * 100,
        currentPrice,
        targetPrice,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate target time is in valid range
 */
export function validateTargetTime(
  targetTime: string | number,
  currentTime: number
): ValidationResult {
  let targetTimeMs: number;

  if (typeof targetTime === 'string') {
    targetTimeMs = new Date(targetTime).getTime();
    if (isNaN(targetTimeMs)) {
      return {
        valid: false,
        error: 'Invalid target time format. Use ISO 8601 format.',
        details: { provided: targetTime },
      };
    }
  } else {
    targetTimeMs = targetTime;
  }

  const timeToTarget = targetTimeMs - currentTime;

  if (timeToTarget <= 0) {
    return {
      valid: false,
      error: 'Target time must be in the future',
      details: { targetTime: new Date(targetTimeMs).toISOString(), currentTime: new Date(currentTime).toISOString() },
    };
  }

  if (timeToTarget < MIN_TIME_TO_TARGET_MS) {
    return {
      valid: false,
      error: `Target time must be at least ${MIN_TIME_TO_TARGET_MS / 1000} seconds in the future`,
      details: {
        minSeconds: MIN_TIME_TO_TARGET_MS / 1000,
        providedSeconds: timeToTarget / 1000,
      },
    };
  }

  if (timeToTarget > MAX_TIME_TO_TARGET_MS) {
    return {
      valid: false,
      error: `Target time cannot be more than ${MAX_TIME_TO_TARGET_MS / 1000 / 60} minutes in the future`,
      details: {
        maxMinutes: MAX_TIME_TO_TARGET_MS / 1000 / 60,
        providedMinutes: timeToTarget / 1000 / 60,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate active bets count is within limit
 */
export function validateActiveBetsCount(activeBetsCount: number): ValidationResult {
  if (activeBetsCount >= BETTING_LIMITS.MAX_ACTIVE_BETS) {
    return {
      valid: false,
      error: `Maximum active bets limit (${BETTING_LIMITS.MAX_ACTIVE_BETS}) reached`,
      details: { limit: BETTING_LIMITS.MAX_ACTIVE_BETS, current: activeBetsCount },
    };
  }

  return { valid: true };
}

/**
 * Validate potential payout is within limits
 */
export function validatePotentialPayout(
  amount: number,
  multiplier: number,
  dailyPayoutTotal: number = 0
): ValidationResult {
  const potentialPayout = calculatePotentialPayout(amount, multiplier);

  if (potentialPayout > BETTING_LIMITS.MAX_SINGLE_PAYOUT) {
    return {
      valid: false,
      error: `Potential payout ($${potentialPayout.toFixed(2)}) exceeds maximum single payout`,
      details: {
        potentialPayout,
        maxSinglePayout: BETTING_LIMITS.MAX_SINGLE_PAYOUT,
      },
    };
  }

  // Check daily payout limit
  if (dailyPayoutTotal + potentialPayout > BETTING_LIMITS.MAX_DAILY_PAYOUT_PER_USER) {
    return {
      valid: false,
      error: 'This bet would exceed your daily payout limit',
      details: {
        potentialPayout,
        dailyTotal: dailyPayoutTotal,
        dailyLimit: BETTING_LIMITS.MAX_DAILY_PAYOUT_PER_USER,
        remaining: BETTING_LIMITS.MAX_DAILY_PAYOUT_PER_USER - dailyPayoutTotal,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate price at placement matches current market price (slippage check)
 */
export function validatePriceAtPlacement(
  priceAtPlacement: number,
  currentPrice: number,
  slippageTolerancePercent: number = 1 // 1% default
): ValidationResult {
  if (typeof priceAtPlacement !== 'number' || isNaN(priceAtPlacement)) {
    return {
      valid: false,
      error: 'Price at placement must be a valid number',
      details: { provided: priceAtPlacement },
    };
  }

  const slippage = Math.abs(priceAtPlacement - currentPrice) / currentPrice * 100;

  if (slippage > slippageTolerancePercent) {
    return {
      valid: false,
      error: 'Price has moved too much since you initiated the bet',
      details: {
        priceAtPlacement,
        currentPrice,
        slippage: `${slippage.toFixed(2)}%`,
        tolerance: `${slippageTolerancePercent}%`,
      },
    };
  }

  return { valid: true };
}

// ============================================
// Main Validation Function
// ============================================

/**
 * Validate a complete bet request
 */
export function validateBetRequest(
  request: BetPlaceRequest,
  context: BetValidationContext
): DetailedValidationResult {
  const { amount, targetPrice, targetTime, priceAtPlacement } = request;
  const { userBalance, activeBetsCount, currentPrice, currentTime, dailyPayoutTotal = 0 } = context;

  // Run all validations in order
  const validations = [
    () => validateAmount(amount),
    () => validateBalance(amount, userBalance),
    () => validateTargetPrice(targetPrice, currentPrice),
    () => validateTargetTime(targetTime, currentTime),
    () => validateActiveBetsCount(activeBetsCount),
    () => validatePriceAtPlacement(priceAtPlacement, currentPrice),
  ];

  for (const validate of validations) {
    const result = validate();
    if (!result.valid) {
      return result;
    }
  }

  // Calculate multiplier for final validation
  const targetTimeMs = typeof targetTime === 'string' ? new Date(targetTime).getTime() : targetTime;
  const multiplier = calculateMultiplier(
    currentPrice,
    targetPrice,
    currentTime,
    targetTimeMs
  );

  // Validate potential payout
  const payoutValidation = validatePotentialPayout(amount, multiplier, dailyPayoutTotal);
  if (!payoutValidation.valid) {
    return payoutValidation;
  }

  // All validations passed
  const potentialPayout = calculatePotentialPayout(amount, multiplier);

  return {
    valid: true,
    calculatedMultiplier: multiplier,
    potentialPayout,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Quick check if a bet amount is valid (without full context)
 */
export function isValidBetAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    amount >= BETTING_LIMITS.MIN_BET &&
    amount <= BETTING_LIMITS.MAX_BET
  );
}

/**
 * Get the maximum bet amount allowed for a given balance
 */
export function getMaxBetAmount(userBalance: number): number {
  return Math.min(userBalance, BETTING_LIMITS.MAX_BET);
}

/**
 * Get time constraints in milliseconds
 */
export function getTimeConstraints() {
  return {
    minTimeMs: MIN_TIME_TO_TARGET_MS,
    maxTimeMs: MAX_TIME_TO_TARGET_MS,
    minTimeSeconds: MIN_TIME_TO_TARGET_MS / 1000,
    maxTimeMinutes: MAX_TIME_TO_TARGET_MS / 1000 / 60,
  };
}

/**
 * Get price distance constraints
 */
export function getPriceConstraints() {
  return {
    minDistancePercent: MIN_PRICE_DISTANCE_PERCENT * 100,
    maxDistancePercent: MAX_PRICE_DISTANCE_PERCENT * 100,
  };
}

// ============================================
// Export
// ============================================

export {
  MIN_TIME_TO_TARGET_MS,
  MAX_TIME_TO_TARGET_MS,
  MIN_PRICE_DISTANCE_PERCENT,
  MAX_PRICE_DISTANCE_PERCENT,
};
