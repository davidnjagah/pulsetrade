/**
 * PulseTrade Risk Management Service
 * Handles exposure tracking, dynamic multiplier adjustment,
 * volatility circuit breakers, and max payout enforcement
 *
 * Key Functions:
 * - Track exposure per outcome (price direction)
 * - Dynamically adjust multipliers based on platform exposure
 * - Implement circuit breakers during high volatility
 * - Enforce maximum payout limits
 * - Anti-arbitrage checks
 */

import { BETTING_LIMITS, Bet } from './types';

// ============================================
// Types
// ============================================

export type PriceDirection = 'up' | 'down';

export interface ExposureData {
  direction: PriceDirection;
  totalBetAmount: number;
  potentialPayout: number;
  betCount: number;
  activeBets: string[]; // bet IDs
}

export interface ExposureSnapshot {
  timestamp: number;
  upExposure: ExposureData;
  downExposure: ExposureData;
  totalExposure: number;
  exposureRatio: number; // up / down ratio
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CircuitBreakerState {
  active: boolean;
  reason: string | null;
  activatedAt: number | null;
  cooldownUntil: number | null;
  volatilityLevel: number;
  allowBetting: boolean;
  multiplierAdjustment: number; // 0-1 scale, 1 = full multipliers
}

export interface RiskCheck {
  allowed: boolean;
  reason?: string;
  adjustedMultiplier?: number;
  warnings?: string[];
}

export interface ArbitrageCheck {
  isArbitrage: boolean;
  combinedProbability: number;
  potentialGuaranteedProfit: number;
  conflictingBets: string[];
}

// ============================================
// Constants
// ============================================

const MAX_PLATFORM_EXPOSURE = BETTING_LIMITS.MAX_PLATFORM_EXPOSURE;
const MAX_SINGLE_PAYOUT = BETTING_LIMITS.MAX_SINGLE_PAYOUT;
const MAX_DAILY_PAYOUT = BETTING_LIMITS.MAX_DAILY_PAYOUT_PER_USER;

// Exposure thresholds for multiplier adjustment
const EXPOSURE_THRESHOLDS = {
  SAFE: 0.3, // 30% of max - no adjustment
  MODERATE: 0.5, // 50% of max - minor reduction
  HIGH: 0.7, // 70% of max - significant reduction
  CRITICAL: 0.9, // 90% of max - major reduction
};

// Multiplier reduction factors based on exposure
const MULTIPLIER_REDUCTIONS = {
  SAFE: 1.0, // No reduction
  MODERATE: 0.9, // 10% reduction
  HIGH: 0.75, // 25% reduction
  CRITICAL: 0.5, // 50% reduction
};

// Volatility thresholds for circuit breakers
const VOLATILITY_THRESHOLDS = {
  NORMAL: 0.02, // 2% - normal market
  ELEVATED: 0.05, // 5% - elevated volatility
  HIGH: 0.08, // 8% - high volatility
  EXTREME: 0.10, // 10% - circuit breaker triggers
};

// Circuit breaker cooldown period
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// ============================================
// In-Memory State
// ============================================

// Exposure tracking by direction
const exposureByDirection: Map<PriceDirection, ExposureData> = new Map([
  ['up', { direction: 'up', totalBetAmount: 0, potentialPayout: 0, betCount: 0, activeBets: [] }],
  ['down', { direction: 'down', totalBetAmount: 0, potentialPayout: 0, betCount: 0, activeBets: [] }],
]);

// Circuit breaker state
let circuitBreakerState: CircuitBreakerState = {
  active: false,
  reason: null,
  activatedAt: null,
  cooldownUntil: null,
  volatilityLevel: 0,
  allowBetting: true,
  multiplierAdjustment: 1.0,
};

// Recent price changes for volatility calculation
const recentPriceChanges: Array<{ price: number; timestamp: number }> = [];
const PRICE_HISTORY_WINDOW = 5 * 60 * 1000; // 5 minutes

// User daily payout tracking
const userDailyPayouts: Map<string, { amount: number; date: string }> = new Map();

// ============================================
// Exposure Tracking
// ============================================

/**
 * Determine price direction of a bet
 */
export function getBetDirection(currentPrice: number, targetPrice: number): PriceDirection {
  return targetPrice > currentPrice ? 'up' : 'down';
}

/**
 * Add exposure for a new bet
 */
export function addExposure(
  betId: string,
  direction: PriceDirection,
  betAmount: number,
  potentialPayout: number
): void {
  const exposure = exposureByDirection.get(direction);
  if (!exposure) return;

  exposure.totalBetAmount += betAmount;
  exposure.potentialPayout += potentialPayout;
  exposure.betCount++;
  exposure.activeBets.push(betId);

  exposureByDirection.set(direction, exposure);
}

/**
 * Remove exposure when a bet is resolved
 */
export function removeExposure(
  betId: string,
  direction: PriceDirection,
  betAmount: number,
  potentialPayout: number
): void {
  const exposure = exposureByDirection.get(direction);
  if (!exposure) return;

  exposure.totalBetAmount = Math.max(0, exposure.totalBetAmount - betAmount);
  exposure.potentialPayout = Math.max(0, exposure.potentialPayout - potentialPayout);
  exposure.betCount = Math.max(0, exposure.betCount - 1);
  exposure.activeBets = exposure.activeBets.filter((id) => id !== betId);

  exposureByDirection.set(direction, exposure);
}

/**
 * Get current exposure snapshot
 */
export function getExposureSnapshot(): ExposureSnapshot {
  const upExposure = exposureByDirection.get('up')!;
  const downExposure = exposureByDirection.get('down')!;
  const totalExposure = upExposure.potentialPayout + downExposure.potentialPayout;
  const exposureRatio =
    downExposure.potentialPayout > 0
      ? upExposure.potentialPayout / downExposure.potentialPayout
      : upExposure.potentialPayout > 0
      ? Infinity
      : 1;

  // Determine risk level
  const exposurePercent = totalExposure / MAX_PLATFORM_EXPOSURE;
  let riskLevel: ExposureSnapshot['riskLevel'];
  if (exposurePercent < EXPOSURE_THRESHOLDS.SAFE) {
    riskLevel = 'low';
  } else if (exposurePercent < EXPOSURE_THRESHOLDS.MODERATE) {
    riskLevel = 'medium';
  } else if (exposurePercent < EXPOSURE_THRESHOLDS.HIGH) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  return {
    timestamp: Date.now(),
    upExposure: { ...upExposure },
    downExposure: { ...downExposure },
    totalExposure,
    exposureRatio: Math.round(exposureRatio * 100) / 100,
    riskLevel,
  };
}

// ============================================
// Dynamic Multiplier Adjustment
// ============================================

/**
 * Calculate multiplier adjustment based on current exposure
 */
export function getMultiplierAdjustment(direction: PriceDirection): number {
  const exposure = exposureByDirection.get(direction)!;
  const exposurePercent = exposure.potentialPayout / MAX_PLATFORM_EXPOSURE;

  // Check circuit breaker first
  if (!circuitBreakerState.allowBetting) {
    return 0;
  }

  // Apply exposure-based adjustment
  if (exposurePercent >= EXPOSURE_THRESHOLDS.CRITICAL) {
    return MULTIPLIER_REDUCTIONS.CRITICAL * circuitBreakerState.multiplierAdjustment;
  } else if (exposurePercent >= EXPOSURE_THRESHOLDS.HIGH) {
    return MULTIPLIER_REDUCTIONS.HIGH * circuitBreakerState.multiplierAdjustment;
  } else if (exposurePercent >= EXPOSURE_THRESHOLDS.MODERATE) {
    return MULTIPLIER_REDUCTIONS.MODERATE * circuitBreakerState.multiplierAdjustment;
  }

  return MULTIPLIER_REDUCTIONS.SAFE * circuitBreakerState.multiplierAdjustment;
}

/**
 * Apply dynamic adjustment to a multiplier
 */
export function adjustMultiplier(
  baseMultiplier: number,
  direction: PriceDirection
): number {
  const adjustment = getMultiplierAdjustment(direction);
  const adjustedMultiplier = baseMultiplier * adjustment;

  // Ensure minimum multiplier of 1.1
  return Math.max(1.1, Math.round(adjustedMultiplier * 100) / 100);
}

// ============================================
// Volatility Circuit Breakers
// ============================================

/**
 * Record a price update for volatility tracking
 */
export function recordPriceUpdate(price: number): void {
  const now = Date.now();
  recentPriceChanges.push({ price, timestamp: now });

  // Clean up old entries
  const cutoff = now - PRICE_HISTORY_WINDOW;
  while (recentPriceChanges.length > 0 && recentPriceChanges[0].timestamp < cutoff) {
    recentPriceChanges.shift();
  }

  // Check volatility
  updateCircuitBreaker();
}

/**
 * Calculate current market volatility
 */
export function calculateVolatility(): number {
  if (recentPriceChanges.length < 2) {
    return 0;
  }

  // Calculate percentage changes
  const changes: number[] = [];
  for (let i = 1; i < recentPriceChanges.length; i++) {
    const prevPrice = recentPriceChanges[i - 1].price;
    const currPrice = recentPriceChanges[i].price;
    const change = Math.abs((currPrice - prevPrice) / prevPrice);
    changes.push(change);
  }

  // Calculate average absolute change
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

  // Also check for large single moves
  const maxChange = Math.max(...changes);
  const effectiveVolatility = Math.max(avgChange, maxChange * 0.5);

  return effectiveVolatility;
}

/**
 * Update circuit breaker state based on volatility
 */
function updateCircuitBreaker(): void {
  const volatility = calculateVolatility();
  circuitBreakerState.volatilityLevel = volatility;

  const now = Date.now();

  // Check if in cooldown
  if (circuitBreakerState.cooldownUntil && now < circuitBreakerState.cooldownUntil) {
    return;
  }

  // Reset cooldown if passed
  if (circuitBreakerState.cooldownUntil && now >= circuitBreakerState.cooldownUntil) {
    circuitBreakerState.cooldownUntil = null;
  }

  if (volatility >= VOLATILITY_THRESHOLDS.EXTREME) {
    // Activate full circuit breaker
    circuitBreakerState = {
      active: true,
      reason: `Extreme volatility detected: ${(volatility * 100).toFixed(2)}%`,
      activatedAt: now,
      cooldownUntil: now + CIRCUIT_BREAKER_COOLDOWN_MS,
      volatilityLevel: volatility,
      allowBetting: false,
      multiplierAdjustment: 0,
    };
  } else if (volatility >= VOLATILITY_THRESHOLDS.HIGH) {
    circuitBreakerState = {
      active: true,
      reason: `High volatility: ${(volatility * 100).toFixed(2)}%`,
      activatedAt: now,
      cooldownUntil: null,
      volatilityLevel: volatility,
      allowBetting: true,
      multiplierAdjustment: 0.5,
    };
  } else if (volatility >= VOLATILITY_THRESHOLDS.ELEVATED) {
    circuitBreakerState = {
      active: false,
      reason: null,
      activatedAt: null,
      cooldownUntil: null,
      volatilityLevel: volatility,
      allowBetting: true,
      multiplierAdjustment: 0.75,
    };
  } else {
    // Normal volatility
    circuitBreakerState = {
      active: false,
      reason: null,
      activatedAt: null,
      cooldownUntil: null,
      volatilityLevel: volatility,
      allowBetting: true,
      multiplierAdjustment: 1.0,
    };
  }
}

/**
 * Get current circuit breaker state
 */
export function getCircuitBreakerState(): CircuitBreakerState {
  return { ...circuitBreakerState };
}

/**
 * Manually activate circuit breaker (admin function)
 */
export function activateCircuitBreaker(reason: string, durationMs: number = CIRCUIT_BREAKER_COOLDOWN_MS): void {
  const now = Date.now();
  circuitBreakerState = {
    active: true,
    reason: `Manual activation: ${reason}`,
    activatedAt: now,
    cooldownUntil: now + durationMs,
    volatilityLevel: circuitBreakerState.volatilityLevel,
    allowBetting: false,
    multiplierAdjustment: 0,
  };
}

/**
 * Manually deactivate circuit breaker (admin function)
 */
export function deactivateCircuitBreaker(): void {
  circuitBreakerState = {
    active: false,
    reason: null,
    activatedAt: null,
    cooldownUntil: null,
    volatilityLevel: circuitBreakerState.volatilityLevel,
    allowBetting: true,
    multiplierAdjustment: 1.0,
  };
}

// ============================================
// Max Payout Enforcement
// ============================================

/**
 * Check if a bet's potential payout is within limits
 */
export function checkPayoutLimits(
  betAmount: number,
  multiplier: number,
  userId: string
): RiskCheck {
  const potentialPayout = betAmount * multiplier;
  const warnings: string[] = [];

  // Check single bet payout limit
  if (potentialPayout > MAX_SINGLE_PAYOUT) {
    return {
      allowed: false,
      reason: `Potential payout $${potentialPayout.toFixed(2)} exceeds maximum $${MAX_SINGLE_PAYOUT}`,
      warnings,
    };
  }

  // Check daily payout limit for user
  const today = new Date().toDateString();
  const userPayout = userDailyPayouts.get(userId);

  if (userPayout) {
    if (userPayout.date !== today) {
      // Reset for new day
      userDailyPayouts.set(userId, { amount: 0, date: today });
    } else if (userPayout.amount + potentialPayout > MAX_DAILY_PAYOUT) {
      return {
        allowed: false,
        reason: `Daily payout limit exceeded. Current: $${userPayout.amount.toFixed(2)}, Limit: $${MAX_DAILY_PAYOUT}`,
        warnings,
      };
    } else if (userPayout.amount + potentialPayout > MAX_DAILY_PAYOUT * 0.8) {
      warnings.push('Approaching daily payout limit');
    }
  }

  // Check platform exposure
  const snapshot = getExposureSnapshot();
  if (snapshot.totalExposure + potentialPayout > MAX_PLATFORM_EXPOSURE) {
    return {
      allowed: false,
      reason: 'Platform exposure limit reached',
      warnings,
    };
  }

  return { allowed: true, warnings };
}

/**
 * Record a payout for daily limit tracking
 */
export function recordPayout(userId: string, amount: number): void {
  const today = new Date().toDateString();
  const current = userDailyPayouts.get(userId);

  if (!current || current.date !== today) {
    userDailyPayouts.set(userId, { amount, date: today });
  } else {
    userDailyPayouts.set(userId, { amount: current.amount + amount, date: today });
  }
}

// ============================================
// Anti-Arbitrage Checks
// ============================================

/**
 * Check for potential arbitrage across user's bets
 */
export function checkArbitrage(
  userId: string,
  activeBets: Bet[],
  newBetDirection: PriceDirection,
  newBetAmount: number,
  newBetMultiplier: number
): ArbitrageCheck {
  // Find bets in opposite direction
  const oppositeDirection = newBetDirection === 'up' ? 'down' : 'up';
  const oppositeBets = activeBets.filter((bet) => {
    const betDirection = getBetDirection(bet.priceAtPlacement, bet.targetPrice);
    return betDirection === oppositeDirection;
  });

  if (oppositeBets.length === 0) {
    return {
      isArbitrage: false,
      combinedProbability: 0,
      potentialGuaranteedProfit: 0,
      conflictingBets: [],
    };
  }

  // Calculate if betting on both directions could guarantee profit
  const newBetPotential = newBetAmount * newBetMultiplier;
  let maxOppositePayoff = 0;
  let totalOppositeStake = 0;
  const conflictingBetIds: string[] = [];

  oppositeBets.forEach((bet) => {
    const payout = bet.amount * bet.multiplier;
    if (payout > maxOppositePayoff) {
      maxOppositePayoff = payout;
    }
    totalOppositeStake += bet.amount;
    conflictingBetIds.push(bet.id);
  });

  const totalStake = newBetAmount + totalOppositeStake;

  // Check if any combination guarantees profit
  // If min payout from either direction > total stake, it's arbitrage
  const minPayout = Math.min(newBetPotential, maxOppositePayoff);
  const potentialGuaranteedProfit = minPayout - totalStake;
  const isArbitrage = potentialGuaranteedProfit > 0;

  // Calculate combined probability (simplified)
  // If betting on both sides, probabilities sum > 1 indicates arbitrage opportunity
  const newBetProb = 1 / newBetMultiplier;
  const avgOppositeProb = oppositeBets.reduce((sum, bet) => sum + 1 / bet.multiplier, 0) / oppositeBets.length;
  const combinedProbability = newBetProb + avgOppositeProb;

  return {
    isArbitrage: isArbitrage || combinedProbability > 0.95,
    combinedProbability: Math.round(combinedProbability * 10000) / 10000,
    potentialGuaranteedProfit: Math.max(0, Math.round(potentialGuaranteedProfit * 100) / 100),
    conflictingBets: conflictingBetIds,
  };
}

// ============================================
// Comprehensive Risk Check
// ============================================

/**
 * Perform comprehensive risk assessment for a new bet
 */
export function performRiskCheck(
  userId: string,
  betAmount: number,
  multiplier: number,
  currentPrice: number,
  targetPrice: number,
  activeBets: Bet[] = []
): RiskCheck {
  const warnings: string[] = [];
  const direction = getBetDirection(currentPrice, targetPrice);

  // Check circuit breaker
  if (!circuitBreakerState.allowBetting) {
    return {
      allowed: false,
      reason: circuitBreakerState.reason || 'Trading temporarily suspended',
      warnings,
    };
  }

  // Check payout limits
  const payoutCheck = checkPayoutLimits(betAmount, multiplier, userId);
  if (!payoutCheck.allowed) {
    return payoutCheck;
  }
  if (payoutCheck.warnings) {
    warnings.push(...payoutCheck.warnings);
  }

  // Check arbitrage
  const arbCheck = checkArbitrage(userId, activeBets, direction, betAmount, multiplier);
  if (arbCheck.isArbitrage) {
    return {
      allowed: false,
      reason: 'Potential arbitrage detected - cannot bet on both price directions',
      warnings,
    };
  }

  // Get adjusted multiplier
  const adjustedMultiplier = adjustMultiplier(multiplier, direction);

  // Add warnings for exposure-based reductions
  if (adjustedMultiplier < multiplier) {
    warnings.push(`Multiplier adjusted due to market conditions: ${multiplier}x -> ${adjustedMultiplier}x`);
  }

  // Add volatility warning
  if (circuitBreakerState.volatilityLevel > VOLATILITY_THRESHOLDS.ELEVATED) {
    warnings.push(`Elevated market volatility: ${(circuitBreakerState.volatilityLevel * 100).toFixed(1)}%`);
  }

  return {
    allowed: true,
    adjustedMultiplier,
    warnings,
  };
}

// ============================================
// Admin / Utility Functions
// ============================================

/**
 * Get complete risk management status
 */
export function getRiskStatus(): {
  exposure: ExposureSnapshot;
  circuitBreaker: CircuitBreakerState;
  volatility: number;
} {
  return {
    exposure: getExposureSnapshot(),
    circuitBreaker: getCircuitBreakerState(),
    volatility: calculateVolatility(),
  };
}

/**
 * Reset all risk management state (for testing)
 */
export function resetRiskState(): void {
  exposureByDirection.set('up', {
    direction: 'up',
    totalBetAmount: 0,
    potentialPayout: 0,
    betCount: 0,
    activeBets: [],
  });
  exposureByDirection.set('down', {
    direction: 'down',
    totalBetAmount: 0,
    potentialPayout: 0,
    betCount: 0,
    activeBets: [],
  });

  circuitBreakerState = {
    active: false,
    reason: null,
    activatedAt: null,
    cooldownUntil: null,
    volatilityLevel: 0,
    allowBetting: true,
    multiplierAdjustment: 1.0,
  };

  recentPriceChanges.length = 0;
  userDailyPayouts.clear();
}

// ============================================
// Export Constants
// ============================================

export {
  EXPOSURE_THRESHOLDS,
  MULTIPLIER_REDUCTIONS,
  VOLATILITY_THRESHOLDS,
  CIRCUIT_BREAKER_COOLDOWN_MS,
  MAX_PLATFORM_EXPOSURE,
  MAX_SINGLE_PAYOUT,
  MAX_DAILY_PAYOUT,
};
