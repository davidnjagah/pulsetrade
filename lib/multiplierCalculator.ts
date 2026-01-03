/**
 * PulseTrade Multiplier Calculator
 * Implements house edge logic for sustainable platform monetization
 *
 * Key concepts:
 * - True probability: Mathematical chance of price reaching target
 * - Fair multiplier: 1 / true probability (what player should get in fair game)
 * - Display multiplier: Fair multiplier * (1 - house edge) (actual payout)
 */

import {
  MultiplierInput,
  MultiplierResult,
  PayoutCalculation,
  ValidationResult,
  BETTING_LIMITS,
  FEE_CONFIG,
} from './types';

// ============================================
// Constants
// ============================================

const MIN_MULTIPLIER = 1.1;
const MAX_MULTIPLIER = 1000;
const MIN_PROBABILITY = 0.001;
const MAX_PROBABILITY = 0.95;

// Volatility adjustments
const BASE_VOLATILITY = 0.02; // 2% as baseline SOL volatility

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate the true probability of price reaching target
 *
 * Uses a simplified model based on:
 * - Price distance (how far target is from current)
 * - Time available (more time = higher probability)
 * - Volatility (higher volatility = easier to reach extremes)
 *
 * @param priceDistance - Percentage distance to target (0-1+)
 * @param timeMinutes - Time until target in minutes
 * @param volatility - Current market volatility (0-1)
 * @returns Probability between MIN_PROBABILITY and MAX_PROBABILITY
 */
export function calculateTrueProbability(
  priceDistance: number,
  timeMinutes: number,
  volatility: number = BASE_VOLATILITY
): number {
  // Validate inputs
  if (priceDistance < 0) priceDistance = 0;
  if (timeMinutes <= 0) timeMinutes = 0.01; // Minimum 0.01 minutes
  if (volatility <= 0) volatility = BASE_VOLATILITY;

  // Base probability from distance (exponential decay)
  // Higher distance = lower probability
  const distanceFactor = Math.exp(-priceDistance * 50);

  // Time adjustment (square root scaling - more time helps, but diminishing returns)
  // Normalized to 5-minute baseline
  const timeFactor = Math.sqrt(timeMinutes / 5);

  // Volatility adjustment (higher volatility = more likely to reach extreme prices)
  // Normalized to base volatility
  const volFactor = 1 + ((volatility / BASE_VOLATILITY - 1) * 0.5);

  // Combined probability
  let probability = distanceFactor * timeFactor * volFactor;

  // Clamp to valid range
  probability = Math.max(MIN_PROBABILITY, Math.min(MAX_PROBABILITY, probability));

  return probability;
}

/**
 * Calculate the display multiplier with house edge applied
 *
 * @param input - All required inputs for calculation
 * @returns MultiplierResult with all calculation details
 */
export function calculateDisplayMultiplier(input: MultiplierInput): MultiplierResult {
  const { currentPrice, targetPrice, currentTime, targetTime, volatility } = input;

  // Calculate price distance as percentage
  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;

  // Calculate time in minutes
  const timeMs = targetTime - currentTime;
  const timeMinutes = timeMs / 1000 / 60;

  // Get true probability
  const trueProbability = calculateTrueProbability(priceDistance, timeMinutes, volatility);

  // Calculate fair multiplier (inverse of probability)
  const fairMultiplier = 1 / trueProbability;

  // Apply house edge to get display multiplier
  const houseEdge = FEE_CONFIG.HOUSE_EDGE;
  let displayMultiplier = fairMultiplier * (1 - houseEdge);

  // Clamp to valid range
  displayMultiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, displayMultiplier));

  // Round to 2 decimal places for display
  displayMultiplier = Math.round(displayMultiplier * 100) / 100;

  return {
    multiplier: displayMultiplier,
    trueProbability,
    fairMultiplier,
    houseEdge,
  };
}

/**
 * Calculate multiplier using a simpler interface
 * Wrapper for common use case
 */
export function calculateMultiplier(
  currentPrice: number,
  targetPrice: number,
  currentTime: number,
  targetTime: number,
  volatility: number = BASE_VOLATILITY
): number {
  const result = calculateDisplayMultiplier({
    currentPrice,
    targetPrice,
    currentTime,
    targetTime,
    volatility,
  });

  return result.multiplier;
}

// ============================================
// Payout Calculations
// ============================================

/**
 * Calculate payout for a winning bet
 *
 * @param amount - Bet amount
 * @param multiplier - Display multiplier
 * @returns PayoutCalculation with gross, fee, and net
 */
export function calculatePayout(amount: number, multiplier: number): PayoutCalculation {
  // Gross payout (what player "earns" before fees)
  const grossPayout = amount * multiplier;

  // Calculate winnings (profit portion only)
  const winnings = grossPayout - amount;

  // Platform fee is applied to winnings only
  const platformFee = winnings * FEE_CONFIG.PLATFORM_FEE_RATE;

  // Net payout (what player actually receives)
  const netPayout = grossPayout - platformFee;

  return {
    grossPayout: Math.round(grossPayout * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    netPayout: Math.round(netPayout * 100) / 100,
  };
}

/**
 * Calculate potential payout before bet is placed
 * (Uses gross payout - fee would be applied on win)
 */
export function calculatePotentialPayout(amount: number, multiplier: number): number {
  const payout = calculatePayout(amount, multiplier);
  return payout.netPayout;
}

// ============================================
// Bet Validation
// ============================================

/**
 * Validate bet parameters
 */
export function validateBet(
  amount: number,
  targetPrice: number,
  targetTime: number,
  currentPrice: number,
  currentTime: number,
  userBalance: number,
  activeBeetsCount: number
): ValidationResult {
  // Check minimum bet
  if (amount < BETTING_LIMITS.MIN_BET) {
    return {
      valid: false,
      error: `Minimum bet is ${BETTING_LIMITS.MIN_BET}`,
      details: { minBet: BETTING_LIMITS.MIN_BET, provided: amount },
    };
  }

  // Check maximum bet
  if (amount > BETTING_LIMITS.MAX_BET) {
    return {
      valid: false,
      error: `Maximum bet is ${BETTING_LIMITS.MAX_BET}`,
      details: { maxBet: BETTING_LIMITS.MAX_BET, provided: amount },
    };
  }

  // Check balance
  if (amount > userBalance) {
    return {
      valid: false,
      error: 'Insufficient balance',
      details: { required: amount, available: userBalance },
    };
  }

  // Check active bets limit
  if (activeBeetsCount >= BETTING_LIMITS.MAX_ACTIVE_BETS) {
    return {
      valid: false,
      error: `Maximum active bets limit (${BETTING_LIMITS.MAX_ACTIVE_BETS}) reached`,
      details: { limit: BETTING_LIMITS.MAX_ACTIVE_BETS, current: activeBeetsCount },
    };
  }

  // Check target time is in future
  if (targetTime <= currentTime) {
    return {
      valid: false,
      error: 'Target time must be in the future',
      details: { targetTime, currentTime },
    };
  }

  // Check reasonable time range (not too far in future - 1 hour max for now)
  const maxTimeMs = 60 * 60 * 1000; // 1 hour
  if (targetTime - currentTime > maxTimeMs) {
    return {
      valid: false,
      error: 'Target time too far in future (max 1 hour)',
      details: { maxMinutes: 60 },
    };
  }

  // Check target price is reasonable (not identical to current)
  const minPriceDistance = 0.0001; // 0.01%
  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;
  if (priceDistance < minPriceDistance) {
    return {
      valid: false,
      error: 'Target price too close to current price',
      details: { minDistance: minPriceDistance, provided: priceDistance },
    };
  }

  // Calculate and check potential payout
  const multiplier = calculateMultiplier(
    currentPrice,
    targetPrice,
    currentTime,
    targetTime
  );
  const potentialPayout = amount * multiplier;

  if (potentialPayout > BETTING_LIMITS.MAX_SINGLE_PAYOUT) {
    return {
      valid: false,
      error: `Potential payout exceeds maximum (${BETTING_LIMITS.MAX_SINGLE_PAYOUT})`,
      details: {
        potentialPayout,
        maxPayout: BETTING_LIMITS.MAX_SINGLE_PAYOUT,
      },
    };
  }

  return { valid: true };
}

// ============================================
// Grid Multiplier Generation
// ============================================

export interface GridCell {
  priceLevel: number;
  timeOffset: number; // minutes from now
  multiplier: number;
  probability: number;
}

/**
 * Generate multipliers for a grid of price/time combinations
 *
 * @param currentPrice - Current asset price
 * @param priceRange - Array of price levels to calculate
 * @param timeOffsets - Array of time offsets in minutes
 * @param volatility - Current volatility
 * @returns 2D array of grid cells
 */
export function generateGridMultipliers(
  currentPrice: number,
  priceRange: number[],
  timeOffsets: number[],
  volatility: number = BASE_VOLATILITY
): GridCell[][] {
  const currentTime = Date.now();

  return priceRange.map((priceLevel) => {
    return timeOffsets.map((timeOffset) => {
      const targetTime = currentTime + timeOffset * 60 * 1000;

      const result = calculateDisplayMultiplier({
        currentPrice,
        targetPrice: priceLevel,
        currentTime,
        targetTime,
        volatility,
      });

      return {
        priceLevel,
        timeOffset,
        multiplier: result.multiplier,
        probability: result.trueProbability,
      };
    });
  });
}

/**
 * Generate default price levels around current price
 *
 * @param currentPrice - Current price
 * @param steps - Number of steps above and below
 * @param stepPercent - Percentage per step
 * @returns Array of price levels
 */
export function generatePriceLevels(
  currentPrice: number,
  steps: number = 5,
  stepPercent: number = 0.005 // 0.5%
): number[] {
  const levels: number[] = [];

  for (let i = -steps; i <= steps; i++) {
    if (i === 0) continue; // Skip current price
    const level = currentPrice * (1 + i * stepPercent);
    levels.push(Math.round(level * 100) / 100);
  }

  return levels;
}

/**
 * Default time offsets for grid (in minutes)
 */
export const DEFAULT_TIME_OFFSETS = [1, 2, 3, 5, 10, 15, 30, 60];

// ============================================
// Bet Resolution
// ============================================

export interface ResolutionResult {
  won: boolean;
  payout: number;
  platformFee: number;
}

/**
 * Resolve a bet based on actual price at target time
 *
 * @param targetPrice - Price the user bet on
 * @param actualPrice - Actual price at resolution time
 * @param amount - Bet amount
 * @param multiplier - Original multiplier
 * @param slippageTolerance - Allowed slippage percentage (0-100)
 * @returns Resolution result
 */
export function resolveBet(
  targetPrice: number,
  actualPrice: number,
  amount: number,
  multiplier: number,
  slippageTolerance: number = 30 // Default 0.3%
): ResolutionResult {
  // Calculate percentage difference
  const priceDiff = Math.abs(actualPrice - targetPrice);
  const percentDiff = (priceDiff / targetPrice) * 100 * 100; // Convert to basis points then percentage

  // Check if within slippage tolerance
  const won = percentDiff <= slippageTolerance;

  if (!won) {
    return {
      won: false,
      payout: 0,
      platformFee: 0,
    };
  }

  // Calculate payout
  const payoutCalc = calculatePayout(amount, multiplier);

  return {
    won: true,
    payout: payoutCalc.netPayout,
    platformFee: payoutCalc.platformFee,
  };
}

// ============================================
// Export all functions
// ============================================

export {
  MIN_MULTIPLIER,
  MAX_MULTIPLIER,
  MIN_PROBABILITY,
  MAX_PROBABILITY,
  BASE_VOLATILITY,
};
