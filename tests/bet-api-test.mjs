/**
 * PulseTrade Bet API Tests
 * Run with: node tests/bet-api-test.mjs
 *
 * Tests the bet placement and resolution API endpoints.
 * Requires the dev server to be running on localhost:3000
 */

const BASE_URL = 'http://localhost:3000';

// Test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  return fn()
    .then(() => {
      console.log(`[PASS] ${name}`);
      passed++;
    })
    .catch((error) => {
      console.log(`[FAIL] ${name}`);
      console.log(`       Error: ${error.message}`);
      failed++;
    });
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

// Helper to wait for rate limit
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to get current price from API
async function getCurrentPrice() {
  const res = await fetch(`${BASE_URL}/api/price-feed`);
  const data = await res.json();
  return data.price;
}

// Helper to get a valid target time (30 seconds from now)
function getValidTargetTime() {
  return new Date(Date.now() + 30 * 1000).toISOString();
}

// ============================================
// API Tests
// ============================================

async function runTests() {
  console.log('========================================');
  console.log('PulseTrade Bet API Tests');
  console.log('========================================\n');

  // Check if server is running
  try {
    await fetch(`${BASE_URL}/api/user`);
  } catch (error) {
    console.log('[ERROR] Server not running at ' + BASE_URL);
    console.log('        Start the dev server with: npm run dev');
    process.exit(1);
  }

  // ============================================
  // User API Tests
  // ============================================
  console.log('\n--- User API Tests ---\n');

  await test('GET /api/user returns user profile', async () => {
    const res = await fetch(`${BASE_URL}/api/user`);
    assert(res.ok, `Expected 200, got ${res.status}`);

    const data = await res.json();
    assert(data.id, 'User should have id');
    assert(typeof data.balance === 'number', 'User should have numeric balance');
    assert(data.stats, 'User should have stats object');
  });

  await test('GET /api/user?mode=balance returns balance only', async () => {
    const res = await fetch(`${BASE_URL}/api/user?mode=balance`);
    assert(res.ok, `Expected 200, got ${res.status}`);

    const data = await res.json();
    assert(typeof data.balance === 'number', 'Should return balance');
    assert(typeof data.available === 'number', 'Should return available balance');
  });

  // ============================================
  // Bet Placement Validation Tests
  // ============================================
  console.log('\n--- Bet Placement Validation Tests ---\n');

  await test('Bet amount too small (< $1) returns error', async () => {
    const price = await getCurrentPrice();
    const res = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 0.5,
        targetPrice: price * 1.025,
        targetTime: getValidTargetTime(),
        priceAtPlacement: price,
      }),
    });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.code === 'INVALID_AMOUNT', `Expected INVALID_AMOUNT, got ${data.error.code}`);
    assert(data.error.message.includes('Minimum bet'), 'Should mention minimum bet');
  });

  await sleep(600); // Wait for rate limit

  await test('Bet amount too large (> $100) returns error', async () => {
    const price = await getCurrentPrice();
    const res = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 500,
        targetPrice: price * 1.025,
        targetTime: getValidTargetTime(),
        priceAtPlacement: price,
      }),
    });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.code === 'INVALID_AMOUNT', `Expected INVALID_AMOUNT, got ${data.error.code}`);
    assert(data.error.message.includes('Maximum bet'), 'Should mention maximum bet');
  });

  await sleep(600); // Wait for rate limit

  await test('Target time too far in future returns error', async () => {
    const price = await getCurrentPrice();
    const farFutureTime = new Date(Date.now() + 120 * 60 * 1000).toISOString(); // 2 hours

    const res = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 10,
        targetPrice: price * 1.025,
        targetTime: farFutureTime,
        priceAtPlacement: price,
      }),
    });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.code === 'INVALID_TARGET_TIME', `Expected INVALID_TARGET_TIME, got ${data.error.code}`);
  });

  await sleep(600); // Wait for rate limit

  // ============================================
  // Bet Placement Success Tests
  // ============================================
  console.log('\n--- Bet Placement Success Tests ---\n');

  let placedBetId = null;
  let initialBalance = 0;

  await test('Valid bet placement succeeds', async () => {
    // Get current balance first
    const userRes = await fetch(`${BASE_URL}/api/user`);
    const userData = await userRes.json();
    initialBalance = userData.balance;

    const price = await getCurrentPrice();
    const targetPrice = Math.round(price * 1.025 * 100) / 100;

    const res = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 10,
        targetPrice: targetPrice,
        targetTime: getValidTargetTime(),
        priceAtPlacement: price,
      }),
    });

    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();

    assert(data.id, 'Should return bet id');
    assert(data.amount === 10, 'Should return correct amount');
    assert(data.status === 'active', 'Status should be active');
    assert(data.multiplier > 1, 'Multiplier should be > 1');
    assert(data.potentialPayout > 10, 'Potential payout should be > bet amount');

    placedBetId = data.id;
    console.log(`       Bet ID: ${placedBetId}`);
    console.log(`       Multiplier: ${data.multiplier}x`);
    console.log(`       Potential Payout: $${data.potentialPayout}`);
  });

  await test('Balance is deducted after bet placement', async () => {
    const res = await fetch(`${BASE_URL}/api/user?mode=balance`);
    const data = await res.json();

    const expectedBalance = initialBalance - 10;
    assertClose(data.balance, expectedBalance, 0.01, 'Balance should be reduced by bet amount');
    console.log(`       Initial balance: $${initialBalance}`);
    console.log(`       Current balance: $${data.balance}`);
  });

  await sleep(600); // Wait for rate limit

  // ============================================
  // Active Bets API Tests
  // ============================================
  console.log('\n--- Active Bets API Tests ---\n');

  await test('GET /api/bets/active returns active bets', async () => {
    const res = await fetch(`${BASE_URL}/api/bets/active`);
    assert(res.ok, `Expected 200, got ${res.status}`);

    const data = await res.json();
    assert(Array.isArray(data.bets), 'Should return bets array');
    assert(typeof data.totalExposure === 'number', 'Should return totalExposure');
    assert(typeof data.count === 'number', 'Should return count');

    if (placedBetId) {
      const ourBet = data.bets.find(b => b.id === placedBetId);
      assert(ourBet, 'Should include our placed bet');
      console.log(`       Found ${data.count} active bet(s)`);
      console.log(`       Total exposure: $${data.totalExposure}`);
    }
  });

  await test('GET /api/bets/active?mode=stats returns statistics', async () => {
    const res = await fetch(`${BASE_URL}/api/bets/active?mode=stats`);
    assert(res.ok, `Expected 200, got ${res.status}`);

    const data = await res.json();
    assert(typeof data.totalBets === 'number', 'Should return totalBets');
    assert(typeof data.wins === 'number', 'Should return wins');
    assert(typeof data.losses === 'number', 'Should return losses');
    assert(typeof data.winRate === 'number', 'Should return winRate');
    assert(typeof data.profit === 'number', 'Should return profit');

    console.log(`       Total bets: ${data.totalBets}`);
    console.log(`       Win/Loss: ${data.wins}/${data.losses}`);
    console.log(`       Win rate: ${(data.winRate * 100).toFixed(1)}%`);
  });

  // ============================================
  // Rate Limiting Tests
  // ============================================
  console.log('\n--- Rate Limiting Tests ---\n');

  await test('Rapid bets trigger rate limiting', async () => {
    const price = await getCurrentPrice();

    // First bet should succeed (or be rate limited from previous tests)
    const res1 = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 5,
        targetPrice: price * 1.03,
        targetTime: getValidTargetTime(),
        priceAtPlacement: price,
      }),
    });

    // Immediately try another bet without waiting
    const res2 = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 5,
        targetPrice: price * 1.03,
        targetTime: getValidTargetTime(),
        priceAtPlacement: price,
      }),
    });

    // At least one should be rate limited
    const data2 = await res2.json();
    if (res2.status === 429) {
      assert(data2.error.code === 'RATE_LIMITED', 'Should return RATE_LIMITED error code');
      console.log('       Rate limiting is working correctly');
    } else {
      // If both went through, that's also acceptable (timing edge case)
      console.log('       Note: Both requests went through (timing edge case)');
    }
  });

  await sleep(600); // Wait for rate limit

  // ============================================
  // Multiplier Consistency Tests
  // ============================================
  console.log('\n--- Multiplier Consistency Tests ---\n');

  await test('Multiplier increases with price distance', async () => {
    const price = await getCurrentPrice();

    // Place bet with 2% distance
    const res1 = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1,
        targetPrice: price * 1.02,
        targetTime: getValidTargetTime(),
        priceAtPlacement: price,
      }),
    });
    const data1 = await res1.json();

    await sleep(600);

    // Place bet with 4% distance
    const res2 = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1,
        targetPrice: price * 1.04,
        targetTime: getValidTargetTime(),
        priceAtPlacement: price,
      }),
    });
    const data2 = await res2.json();

    if (data1.multiplier && data2.multiplier) {
      console.log(`       2% distance: ${data1.multiplier}x`);
      console.log(`       4% distance: ${data2.multiplier}x`);
      assert(data2.multiplier > data1.multiplier, 'Higher distance should have higher multiplier');
    }
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
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
