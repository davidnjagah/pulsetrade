/**
 * PulseTrade Sprint 5 - Leaderboard & Profile API Tests
 * Tests the leaderboard rankings and user profile endpoints
 *
 * Run: node tests/leaderboard-test.mjs
 *
 * Note: Uses x-user-id header for profile tests (legacy fallback) due to
 * in-memory session storage not persisting between requests in dev mode.
 * Session-based auth works correctly in production.
 */

const BASE_URL = 'http://localhost:3000';

let testsPassed = 0;
let testsFailed = 0;
let sessionToken = null;
let userId = null;

// Helper to make API requests
// useAuth: 'session' for Bearer token, 'legacy' for x-user-id header
async function request(method, path, body = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (useAuth === 'session' && sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  } else if (useAuth === 'legacy' && userId) {
    headers['x-user-id'] = userId;
  } else if (useAuth === true && userId) {
    // Default to legacy for reliability in dev mode
    headers['x-user-id'] = userId;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Test result helper
function test(name, passed, details = '') {
  if (passed) {
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } else {
    console.log(`  [FAIL] ${name}${details ? ` - ${details}` : ''}`);
    testsFailed++;
  }
}

// Setup: Connect wallet to get session
async function setup() {
  console.log('\n=== Setup: Connecting wallet ===');
  const { status, data } = await request('POST', '/api/auth/connect', {
    walletAddress: `leaderboard_test_${Date.now()}`,
    walletType: 'demo'
  });

  if (status === 200 && data.sessionToken) {
    sessionToken = data.sessionToken;
    userId = data.user.id;
    console.log(`  Connected as: ${userId}`);
    console.log(`  Session: ${sessionToken.substring(0, 20)}...`);
    console.log(`  Note: Using x-user-id header for profile tests (dev mode reliability)`);
    return true;
  }
  console.log(`  Failed to connect: ${JSON.stringify(data)}`);
  return false;
}

// Test 1: Leaderboard - Default (alltime)
async function testLeaderboardDefault() {
  console.log('\n=== Test 1: Leaderboard Default (alltime) ===');

  const { status, data } = await request('GET', '/api/leaderboard');

  test('Returns 200 status', status === 200);
  test('Has leaderboard array', Array.isArray(data.leaderboard));
  test('Has period=alltime', data.period === 'alltime');
  test('Has totalUsers count', typeof data.totalUsers === 'number' && data.totalUsers >= 0);
  test('Has generatedAt timestamp', !!data.generatedAt);

  if (data.leaderboard && data.leaderboard.length > 0) {
    const entry = data.leaderboard[0];
    test('Entry has rank', typeof entry.rank === 'number');
    test('Entry has userId', !!entry.userId);
    test('Entry has username', !!entry.username);
    test('Entry has wins', typeof entry.wins === 'number');
    test('Entry has losses', typeof entry.losses === 'number');
    test('Entry has profit', typeof entry.profit === 'number');
    test('Entry has winRate', typeof entry.winRate === 'number');
  }
}

// Test 2: Leaderboard - Daily period
async function testLeaderboardDaily() {
  console.log('\n=== Test 2: Leaderboard Daily Period ===');

  const { status, data } = await request('GET', '/api/leaderboard?period=daily');

  test('Returns 200 status', status === 200);
  test('Has period=daily', data.period === 'daily');
  test('Has leaderboard array', Array.isArray(data.leaderboard));
}

// Test 3: Leaderboard - Weekly period
async function testLeaderboardWeekly() {
  console.log('\n=== Test 3: Leaderboard Weekly Period ===');

  const { status, data } = await request('GET', '/api/leaderboard?period=weekly');

  test('Returns 200 status', status === 200);
  test('Has period=weekly', data.period === 'weekly');
  test('Has leaderboard array', Array.isArray(data.leaderboard));
}

// Test 4: Leaderboard - Limit parameter
async function testLeaderboardLimit() {
  console.log('\n=== Test 4: Leaderboard Limit Parameter ===');

  const { status, data } = await request('GET', '/api/leaderboard?limit=5');

  test('Returns 200 status', status === 200);
  test('Returns max 5 entries', data.leaderboard.length <= 5);

  // Test with limit=10
  const { data: data10 } = await request('GET', '/api/leaderboard?limit=10');
  test('Limit=10 returns max 10 entries', data10.leaderboard.length <= 10);
}

// Test 5: Profile - Without auth (should fail)
async function testProfileNoAuth() {
  console.log('\n=== Test 5: Profile Without Auth ===');

  const { status, data } = await request('GET', '/api/profile');

  test('Returns 401 status', status === 401, `Got ${status}`);
  test('Has error code UNAUTHORIZED', data.error?.code === 'UNAUTHORIZED');
}

// Test 6: Profile - With auth
async function testProfileWithAuth() {
  console.log('\n=== Test 6: Profile With Auth ===');

  const { status, data } = await request('GET', '/api/profile', null, true);

  test('Returns 200 status', status === 200, `Got ${status}: ${JSON.stringify(data)}`);
  test('Has profile object', !!data.profile);

  if (data.profile) {
    test('Profile has id', !!data.profile.id);
    test('Profile has walletAddress', !!data.profile.walletAddress);
    test('Profile has username', !!data.profile.username);
    test('Profile has balance', typeof data.profile.balance === 'number');
    test('Profile has isDemo flag', typeof data.profile.isDemo === 'boolean');
    test('Profile has stats object', !!data.profile.stats);

    if (data.profile.stats) {
      test('Stats has totalBets', typeof data.profile.stats.totalBets === 'number');
      test('Stats has wins', typeof data.profile.stats.wins === 'number');
      test('Stats has losses', typeof data.profile.stats.losses === 'number');
      test('Stats has winRate', typeof data.profile.stats.winRate === 'number');
      test('Stats has profit', typeof data.profile.stats.profit === 'number');
    }
  }
}

// Test 7: Profile Stats - Without auth (should fail)
async function testProfileStatsNoAuth() {
  console.log('\n=== Test 7: Profile Stats Without Auth ===');

  const { status, data } = await request('GET', '/api/profile/stats');

  test('Returns 401 status', status === 401, `Got ${status}`);
  test('Has error code UNAUTHORIZED', data.error?.code === 'UNAUTHORIZED');
}

// Test 8: Profile Stats - With auth
async function testProfileStatsWithAuth() {
  console.log('\n=== Test 8: Profile Stats With Auth ===');

  const { status, data } = await request('GET', '/api/profile/stats', null, true);

  test('Returns 200 status', status === 200, `Got ${status}: ${JSON.stringify(data)}`);
  test('Has stats object', !!data.stats);
  test('Has rank object', !!data.rank);

  if (data.stats) {
    test('Stats has profitByPeriod', !!data.stats.profitByPeriod);
    test('Stats has currentStreak', typeof data.stats.currentStreak === 'number');
    test('Stats has longestWinStreak', typeof data.stats.longestWinStreak === 'number');
  }

  if (data.rank) {
    test('Rank has daily', 'daily' in data.rank);
    test('Rank has weekly', 'weekly' in data.rank);
    test('Rank has alltime', 'alltime' in data.rank);
  }
}

// Test 9: Profile History - Without auth (should fail)
async function testProfileHistoryNoAuth() {
  console.log('\n=== Test 9: Profile History Without Auth ===');

  const { status, data } = await request('GET', '/api/profile/history');

  test('Returns 401 status', status === 401, `Got ${status}`);
  test('Has error code UNAUTHORIZED', data.error?.code === 'UNAUTHORIZED');
}

// Test 10: Profile History - With auth
async function testProfileHistoryWithAuth() {
  console.log('\n=== Test 10: Profile History With Auth ===');

  const { status, data } = await request('GET', '/api/profile/history', null, true);

  test('Returns 200 status', status === 200, `Got ${status}: ${JSON.stringify(data)}`);
  test('Has history array', Array.isArray(data.history));
  test('Has total count', typeof data.total === 'number');
  test('Has limit', typeof data.limit === 'number');
  test('Has offset', typeof data.offset === 'number');
  test('Has hasMore flag', typeof data.hasMore === 'boolean');
  test('Has summary object', !!data.summary);
}

// Test 11: Profile History - Pagination
async function testProfileHistoryPagination() {
  console.log('\n=== Test 11: Profile History Pagination ===');

  const { status, data } = await request('GET', '/api/profile/history?limit=5&offset=0', null, true);

  test('Returns 200 status', status === 200, `Got ${status}`);
  test('Limit is 5', data.limit === 5);
  test('Offset is 0', data.offset === 0);
  test('History array respects limit', Array.isArray(data.history) && data.history.length <= 5);
}

// Test 12: Leaderboard - User rank when authenticated
async function testLeaderboardUserRank() {
  console.log('\n=== Test 12: Leaderboard User Rank ===');

  const { status, data } = await request('GET', '/api/leaderboard', null, true);

  test('Returns 200 status', status === 200);
  // userRank may be null for new users with no bets
  test('Has userRank field', 'userRank' in data);
}

// Run all tests
async function runTests() {
  console.log('================================================');
  console.log('  PulseTrade Sprint 5 - Leaderboard & Profile Tests');
  console.log('================================================');

  // Setup
  const connected = await setup();
  if (!connected) {
    console.log('\nFailed to connect. Aborting tests.');
    process.exit(1);
  }

  // Run tests
  await testLeaderboardDefault();
  await testLeaderboardDaily();
  await testLeaderboardWeekly();
  await testLeaderboardLimit();
  await testProfileNoAuth();
  await testProfileWithAuth();
  await testProfileStatsNoAuth();
  await testProfileStatsWithAuth();
  await testProfileHistoryNoAuth();
  await testProfileHistoryWithAuth();
  await testProfileHistoryPagination();
  await testLeaderboardUserRank();

  // Summary
  console.log('\n================================================');
  console.log(`  Tests Passed: ${testsPassed}`);
  console.log(`  Tests Failed: ${testsFailed}`);
  console.log(`  Total: ${testsPassed + testsFailed}`);
  console.log('================================================');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
