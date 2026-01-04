/**
 * PulseTrade Settings API Tests
 * Run with: node tests/settings-test.mjs
 *
 * Tests the settings system including get settings, update settings, reset settings,
 * validation, and authentication requirements.
 * Requires the dev server to be running on localhost:3000
 *
 * NOTE: Due to Next.js development mode hot reloading, in-memory session
 * storage may not persist between API routes. Some tests use x-user-id header
 * fallback for reliability in dev mode.
 */

const BASE_URL = 'http://localhost:3000';

// Test runner
let passed = 0;
let failed = 0;
let skipped = 0;

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

// Helper to wait
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// API Tests
// ============================================

async function runTests() {
  console.log('========================================');
  console.log('PulseTrade Settings API Tests');
  console.log('========================================\n');

  // Check if server is running
  try {
    await fetch(`${BASE_URL}`);
  } catch (error) {
    console.log('[ERROR] Server not running at ' + BASE_URL);
    console.log('        Start the dev server with: npm run dev');
    process.exit(1);
  }

  // Generate test user ID
  const testUserId = `user_settings_test_${Date.now()}`;
  console.log(`Using test user ID: ${testUserId}\n`);

  // ============================================
  // Authentication Tests
  // ============================================
  console.log('\n--- Authentication Tests ---\n');

  await test('GET /api/settings without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/settings`);

    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const data = await res.json();

    assert(data.error, 'Should return error object');
    assert(data.error.code === 'UNAUTHORIZED', `Expected UNAUTHORIZED, got ${data.error.code}`);
  });

  await test('POST /api/settings/update without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soundEffects: false })
    });

    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const data = await res.json();

    assert(data.error, 'Should return error object');
    assert(data.error.code === 'UNAUTHORIZED', `Expected UNAUTHORIZED, got ${data.error.code}`);
  });

  await test('POST /api/settings/reset without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/reset`, {
      method: 'POST'
    });

    assert(res.status === 401, `Expected 401, got ${res.status}`);
    const data = await res.json();

    assert(data.error, 'Should return error object');
    assert(data.error.code === 'UNAUTHORIZED', `Expected UNAUTHORIZED, got ${data.error.code}`);
  });

  // ============================================
  // Get Settings Tests
  // ============================================
  console.log('\n--- Get Settings Tests ---\n');

  await test('GET /api/settings with auth returns default settings', async () => {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      headers: { 'x-user-id': testUserId }
    });

    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();

    assert(data.success === true, 'Should return success: true');
    assert(data.settings, 'Should return settings object');
    assert(data.updatedAt, 'Should return updatedAt timestamp');
  });

  await test('Default settings have correct values', async () => {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      headers: { 'x-user-id': testUserId }
    });

    const data = await res.json();
    const settings = data.settings;

    assert(settings.backgroundMusic === false, 'backgroundMusic should be false');
    assert(settings.soundEffects === true, 'soundEffects should be true');
    assert(settings.slippageTolerance === 30, 'slippageTolerance should be 30');
    assert(settings.showHighLowArea === false, 'showHighLowArea should be false');
    assert(settings.doubleTapForTrading === false, 'doubleTapForTrading should be false');
    assert(settings.confirmBeforeBet === true, 'confirmBeforeBet should be true');
    assert(settings.showMultipliers === true, 'showMultipliers should be true');
    assert(settings.compactMode === false, 'compactMode should be false');
    assert(settings.animationSpeed === 'normal', 'animationSpeed should be normal');
  });

  // ============================================
  // Update Settings Tests
  // ============================================
  console.log('\n--- Update Settings Tests ---\n');

  await test('POST /api/settings/update can update single setting', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ soundEffects: false })
    });

    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();

    assert(data.success === true, 'Should return success: true');
    assert(data.settings.soundEffects === false, 'soundEffects should be updated to false');
  });

  await test('POST /api/settings/update can update multiple settings', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({
        slippageTolerance: 20,
        backgroundMusic: true,
        animationSpeed: 'fast'
      })
    });

    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();

    assert(data.settings.slippageTolerance === 20, 'slippageTolerance should be 20');
    assert(data.settings.backgroundMusic === true, 'backgroundMusic should be true');
    assert(data.settings.animationSpeed === 'fast', 'animationSpeed should be fast');
  });

  await test('Updated settings persist across requests', async () => {
    // First update a setting
    await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ compactMode: true })
    });

    // Then fetch settings again
    const res = await fetch(`${BASE_URL}/api/settings`, {
      headers: { 'x-user-id': testUserId }
    });

    const data = await res.json();
    assert(data.settings.compactMode === true, 'compactMode should persist as true');
  });

  // ============================================
  // Validation Tests
  // ============================================
  console.log('\n--- Validation Tests ---\n');

  await test('Invalid slippageTolerance (too low) returns VALIDATION_ERROR', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ slippageTolerance: 0 })
    });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();

    assert(data.error.code === 'VALIDATION_ERROR', 'Should return VALIDATION_ERROR');
    assert(data.error.details.errors[0].field === 'slippageTolerance', 'Should indicate slippageTolerance field');
  });

  await test('Invalid slippageTolerance (too high) returns VALIDATION_ERROR', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ slippageTolerance: 100 })
    });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();

    assert(data.error.code === 'VALIDATION_ERROR', 'Should return VALIDATION_ERROR');
    assert(data.error.details.errors[0].field === 'slippageTolerance', 'Should indicate slippageTolerance field');
  });

  await test('Invalid animationSpeed returns VALIDATION_ERROR', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ animationSpeed: 'invalid' })
    });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();

    assert(data.error.code === 'VALIDATION_ERROR', 'Should return VALIDATION_ERROR');
    assert(data.error.details.errors[0].field === 'animationSpeed', 'Should indicate animationSpeed field');
  });

  await test('Validation errors include valid ranges in details', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ slippageTolerance: 0 })
    });

    const data = await res.json();

    assert(data.error.details.validRanges, 'Should include validRanges in details');
    assert(data.error.details.validRanges.slippageTolerance, 'Should include slippageTolerance range');
    assert(data.error.details.validRanges.slippageTolerance.min === 1, 'Min should be 1');
    assert(data.error.details.validRanges.slippageTolerance.max === 50, 'Max should be 50');
    assert(Array.isArray(data.error.details.validRanges.animationSpeed), 'animationSpeed should be array');
  });

  await test('Valid slippageTolerance boundary (1) succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ slippageTolerance: 1 })
    });

    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.settings.slippageTolerance === 1, 'slippageTolerance should be 1');
  });

  await test('Valid slippageTolerance boundary (50) succeeds', async () => {
    const res = await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({ slippageTolerance: 50 })
    });

    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.settings.slippageTolerance === 50, 'slippageTolerance should be 50');
  });

  await test('All valid animationSpeed values succeed', async () => {
    for (const speed of ['slow', 'normal', 'fast']) {
      const res = await fetch(`${BASE_URL}/api/settings/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId
        },
        body: JSON.stringify({ animationSpeed: speed })
      });

      assert(res.ok, `Expected 200 for ${speed}, got ${res.status}`);
      const data = await res.json();
      assert(data.settings.animationSpeed === speed, `animationSpeed should be ${speed}`);
    }
  });

  // ============================================
  // Reset Settings Tests
  // ============================================
  console.log('\n--- Reset Settings Tests ---\n');

  await test('POST /api/settings/reset resets to default values', async () => {
    // First modify settings
    await fetch(`${BASE_URL}/api/settings/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId
      },
      body: JSON.stringify({
        soundEffects: false,
        slippageTolerance: 15,
        animationSpeed: 'slow'
      })
    });

    // Then reset
    const res = await fetch(`${BASE_URL}/api/settings/reset`, {
      method: 'POST',
      headers: { 'x-user-id': testUserId }
    });

    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();

    assert(data.success === true, 'Should return success: true');
    assert(data.message, 'Should return a message');
    assert(data.settings.soundEffects === true, 'soundEffects should be reset to true');
    assert(data.settings.slippageTolerance === 30, 'slippageTolerance should be reset to 30');
    assert(data.settings.animationSpeed === 'normal', 'animationSpeed should be reset to normal');
  });

  await test('Reset settings persist', async () => {
    // After reset, fetch settings again
    const res = await fetch(`${BASE_URL}/api/settings`, {
      headers: { 'x-user-id': testUserId }
    });

    const data = await res.json();

    // Should have default values
    assert(data.settings.backgroundMusic === false, 'backgroundMusic should be default');
    assert(data.settings.soundEffects === true, 'soundEffects should be default');
    assert(data.settings.slippageTolerance === 30, 'slippageTolerance should be default');
  });

  // ============================================
  // Boolean Toggle Tests
  // ============================================
  console.log('\n--- Boolean Toggle Tests ---\n');

  await test('All boolean settings can be toggled', async () => {
    const booleanSettings = [
      'backgroundMusic',
      'soundEffects',
      'showHighLowArea',
      'doubleTapForTrading',
      'confirmBeforeBet',
      'showMultipliers',
      'compactMode'
    ];

    for (const setting of booleanSettings) {
      // Set to true
      const resTrue = await fetch(`${BASE_URL}/api/settings/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId
        },
        body: JSON.stringify({ [setting]: true })
      });

      assert(resTrue.ok, `Expected 200 for ${setting}=true, got ${resTrue.status}`);
      const dataTrue = await resTrue.json();
      assert(dataTrue.settings[setting] === true, `${setting} should be true`);

      // Set to false
      const resFalse = await fetch(`${BASE_URL}/api/settings/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId
        },
        body: JSON.stringify({ [setting]: false })
      });

      assert(resFalse.ok, `Expected 200 for ${setting}=false, got ${resFalse.status}`);
      const dataFalse = await resFalse.json();
      assert(dataFalse.settings[setting] === false, `${setting} should be false`);
    }
  });

  // ============================================
  // Summary
  // ============================================
  console.log('\n========================================');
  console.log('Test Results');
  console.log('========================================');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total:  ${passed + failed + skipped}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
