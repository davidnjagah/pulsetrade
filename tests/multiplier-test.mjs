/**
 * Simple test for multiplier calculator logic
 * Run with: node tests/multiplier-test.mjs
 */

// Import test values based on the lib/types.ts constants
const FEE_CONFIG = {
  HOUSE_EDGE: 0.20, // 20% house edge
  PLATFORM_FEE_RATE: 0.05, // 5% fee on winnings
};

const MIN_MULTIPLIER = 1.1;
const MAX_MULTIPLIER = 1000;
const MIN_PROBABILITY = 0.001;
const MAX_PROBABILITY = 0.95;
const BASE_VOLATILITY = 0.02;

// Replicate the core functions from multiplierCalculator.ts
function calculateTrueProbability(priceDistance, timeMinutes, volatility = BASE_VOLATILITY) {
  if (priceDistance < 0) priceDistance = 0;
  if (timeMinutes <= 0) timeMinutes = 0.01;
  if (volatility <= 0) volatility = BASE_VOLATILITY;

  const distanceFactor = Math.exp(-priceDistance * 50);
  const timeFactor = Math.sqrt(timeMinutes / 5);
  const volFactor = 1 + ((volatility / BASE_VOLATILITY - 1) * 0.5);

  let probability = distanceFactor * timeFactor * volFactor;
  probability = Math.max(MIN_PROBABILITY, Math.min(MAX_PROBABILITY, probability));

  return probability;
}

function calculateDisplayMultiplier(input) {
  const { currentPrice, targetPrice, currentTime, targetTime, volatility } = input;

  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;
  const timeMs = targetTime - currentTime;
  const timeMinutes = timeMs / 1000 / 60;

  const trueProbability = calculateTrueProbability(priceDistance, timeMinutes, volatility);
  const fairMultiplier = 1 / trueProbability;

  const houseEdge = FEE_CONFIG.HOUSE_EDGE;
  let displayMultiplier = fairMultiplier * (1 - houseEdge);

  displayMultiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, displayMultiplier));
  displayMultiplier = Math.round(displayMultiplier * 100) / 100;

  return {
    multiplier: displayMultiplier,
    trueProbability,
    fairMultiplier,
    houseEdge,
  };
}

function calculatePayout(amount, multiplier) {
  const grossPayout = amount * multiplier;
  const winnings = grossPayout - amount;
  const platformFee = winnings * FEE_CONFIG.PLATFORM_FEE_RATE;
  const netPayout = grossPayout - platformFee;

  return {
    grossPayout: Math.round(grossPayout * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    netPayout: Math.round(netPayout * 100) / 100,
  };
}

// Test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (error) {
    console.log(`[FAIL] ${name}`);
    console.log(`       Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual} (diff: ${diff})`);
  }
}

// ============================================
// TEST 1: House edge is ~20%
// ============================================
test('House edge is 20%', () => {
  assert(FEE_CONFIG.HOUSE_EDGE === 0.20, `House edge should be 0.20, got ${FEE_CONFIG.HOUSE_EDGE}`);
});

test('Display multiplier reflects house edge (before clamping)', () => {
  const currentTime = Date.now();
  const result = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 206, // 3% distance - significant enough to avoid MIN_MULTIPLIER clamping
    currentTime,
    targetTime: currentTime + 2 * 60 * 1000, // 2 minutes
    volatility: BASE_VOLATILITY,
  });

  // Calculate expected display multiplier with house edge
  const expectedDisplayMultiplier = result.fairMultiplier * (1 - FEE_CONFIG.HOUSE_EDGE);

  console.log(`       Fair multiplier: ${result.fairMultiplier.toFixed(2)}x`);
  console.log(`       Display multiplier: ${result.multiplier.toFixed(2)}x`);
  console.log(`       Expected (fair * 0.8): ${expectedDisplayMultiplier.toFixed(2)}x`);
  console.log(`       House edge from result: ${(result.houseEdge * 100).toFixed(0)}%`);

  // Check that house edge is 20%
  assert(result.houseEdge === 0.20, `House edge in result should be 0.20, got ${result.houseEdge}`);

  // When not clamped, the ratio should be 0.80
  // But if clamped to MIN_MULTIPLIER, we verify it's at least MIN_MULTIPLIER
  if (result.multiplier > MIN_MULTIPLIER && result.multiplier < MAX_MULTIPLIER) {
    const actualRatio = result.multiplier / result.fairMultiplier;
    assertClose(actualRatio, 0.80, 0.02, 'Multiplier should be ~80% of fair multiplier (20% house edge)');
  } else {
    console.log('       Note: Multiplier was clamped to bounds');
    assert(result.multiplier >= MIN_MULTIPLIER && result.multiplier <= MAX_MULTIPLIER, 'Multiplier should be within bounds');
  }
});

// ============================================
// TEST 2: Multipliers increase with price distance
// ============================================
test('Multipliers increase with price distance', () => {
  const currentTime = Date.now();
  const targetTime = currentTime + 5 * 60 * 1000; // 5 minutes

  const close = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 200.5, // 0.25% distance
    currentTime,
    targetTime,
    volatility: BASE_VOLATILITY,
  });

  const medium = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 202, // 1% distance
    currentTime,
    targetTime,
    volatility: BASE_VOLATILITY,
  });

  const far = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 210, // 5% distance
    currentTime,
    targetTime,
    volatility: BASE_VOLATILITY,
  });

  console.log(`       Close (0.25%): ${close.multiplier}x`);
  console.log(`       Medium (1%): ${medium.multiplier}x`);
  console.log(`       Far (5%): ${far.multiplier}x`);

  assert(medium.multiplier > close.multiplier, 'Medium distance should have higher multiplier than close');
  assert(far.multiplier > medium.multiplier, 'Far distance should have higher multiplier than medium');
});

// ============================================
// TEST 3: Payout calculations are correct
// ============================================
test('Payout calculation - gross payout', () => {
  const payout = calculatePayout(10, 2.0);
  assertClose(payout.grossPayout, 20, 0.01, 'Gross payout should be bet * multiplier');
});

test('Payout calculation - platform fee on winnings only', () => {
  const payout = calculatePayout(10, 2.0);
  // Winnings = 20 - 10 = 10
  // Fee = 10 * 0.05 = 0.50
  assertClose(payout.platformFee, 0.50, 0.01, 'Platform fee should be 5% of winnings');
});

test('Payout calculation - net payout', () => {
  const payout = calculatePayout(10, 2.0);
  // Net = 20 - 0.50 = 19.50
  assertClose(payout.netPayout, 19.50, 0.01, 'Net payout should be gross - fee');
});

test('Payout calculation - higher multiplier', () => {
  const payout = calculatePayout(10, 5.0);
  // Gross = 50
  // Winnings = 50 - 10 = 40
  // Fee = 40 * 0.05 = 2.00
  // Net = 50 - 2 = 48
  assertClose(payout.grossPayout, 50, 0.01, 'Gross payout for 5x');
  assertClose(payout.platformFee, 2.00, 0.01, 'Platform fee for 5x');
  assertClose(payout.netPayout, 48, 0.01, 'Net payout for 5x');
});

// ============================================
// TEST 4: Multiplier bounds are respected
// ============================================
test('Minimum multiplier is enforced', () => {
  const currentTime = Date.now();
  const result = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 200.01, // Very close price
    currentTime,
    targetTime: currentTime + 60 * 60 * 1000, // Long time
    volatility: BASE_VOLATILITY,
  });

  assert(result.multiplier >= MIN_MULTIPLIER, `Multiplier should be >= ${MIN_MULTIPLIER}`);
});

test('Maximum multiplier is enforced', () => {
  const currentTime = Date.now();
  const result = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 500, // Very far price
    currentTime,
    targetTime: currentTime + 1000, // Very short time
    volatility: BASE_VOLATILITY,
  });

  assert(result.multiplier <= MAX_MULTIPLIER, `Multiplier should be <= ${MAX_MULTIPLIER}`);
});

// ============================================
// TEST 5: Time factor affects multipliers correctly
// ============================================
test('More time = lower multiplier (higher probability)', () => {
  const currentTime = Date.now();

  const shortTime = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 202,
    currentTime,
    targetTime: currentTime + 1 * 60 * 1000, // 1 minute
    volatility: BASE_VOLATILITY,
  });

  const longTime = calculateDisplayMultiplier({
    currentPrice: 200,
    targetPrice: 202,
    currentTime,
    targetTime: currentTime + 30 * 60 * 1000, // 30 minutes
    volatility: BASE_VOLATILITY,
  });

  console.log(`       Short time (1 min): ${shortTime.multiplier}x (prob: ${shortTime.trueProbability.toFixed(4)})`);
  console.log(`       Long time (30 min): ${longTime.multiplier}x (prob: ${longTime.trueProbability.toFixed(4)})`);

  assert(longTime.multiplier < shortTime.multiplier, 'Longer time should have lower multiplier');
  assert(longTime.trueProbability > shortTime.trueProbability, 'Longer time should have higher probability');
});

// ============================================
// Summary
// ============================================
console.log('\n========================================');
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
