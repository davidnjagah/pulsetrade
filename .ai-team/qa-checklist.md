# PulseTrade QA Checklist

## QA Session: January 3, 2026 - Sprint 1 Initial Testing

### Build & Compilation Tests
- [x] npm run build compiles successfully
- [x] No TypeScript errors (npx tsc --noEmit passes)
- [x] Development server starts correctly
- [x] Homepage serves valid HTML

### API Endpoint Tests
- [x] GET /api/price-feed returns valid JSON with price data
- [x] GET /api/price-feed?mode=history returns price history array
- [x] Price feed includes: price, timestamp, high24h, low24h, volatility, source

---

## Sprint 1: Core Trading View

### Price Chart Tests
- [x] Chart renders on page load
- [x] Price line displays correctly
- [x] Line has pink/magenta color with glow
- [ ] Chart updates in real-time (<500ms latency) - *Requires manual browser testing*
- [ ] Chart maintains 60fps during updates - *Requires manual browser testing*
- [ ] Auto-scroll works as time progresses - *Requires manual browser testing*
- [x] Y-axis scale adjusts to price range
- [x] Current price badge shows correct value
- [ ] Chart handles WebSocket disconnection gracefully - *Requires manual testing*
- [ ] Chart reconnects automatically after disconnect - *Requires manual testing*

### Betting Grid Tests
- [x] Grid overlay renders on chart
- [x] Grid lines visible at correct opacity
- [x] Multiplier values display in cells
- [ ] Multipliers update as price moves - *Requires manual browser testing*
- [x] Higher multipliers for distant prices (verified via unit tests)
- [x] Lower multipliers for near prices (verified via unit tests)
- [ ] Grid is responsive on different screen sizes - *Requires manual testing*
- [x] Grid cells are tappable/clickable

### Navigation Tests
- [x] Sidebar renders correctly
- [x] Trade icon is active on trading view
- [ ] Leaderboard link works - *Route not implemented yet*
- [ ] Profile link works - *Route not implemented yet*
- [x] Navigation is accessible (aria-labels present)

### Performance Benchmarks
| Test | Target | Actual | Status |
|------|--------|--------|--------|
| Chart FPS | 60fps | TBD | Pending manual test |
| Price latency | <500ms | TBD | Pending manual test |
| Initial load | <3s | ~2s (build) | PASS |
| Memory usage | <100MB | TBD | Pending manual test |

---

## Sprint 2: Bet Placement & Resolution

### Bet Placement Tests
- [ ] Tapping grid cell places bet
- [ ] Bet chip appears at correct position
- [ ] Bet amount displayed correctly
- [ ] Multiplier displayed on chip
- [ ] Balance decreases after placement
- [ ] Placement animation plays
- [ ] Multiple bets can be placed
- [ ] Bet limit (20) enforced
- [ ] Cooldown (500ms) enforced
- [ ] Cannot bet more than balance

### Bet Resolution Tests
- [ ] Win detected when price crosses target
- [ ] Loss detected when time expires
- [ ] Correct multiplier applied to payout
- [ ] Platform fee (5%) deducted from winnings
- [ ] Balance updates on win
- [ ] Balance reflects loss correctly
- [ ] Win toast notification appears
- [ ] Win animation plays
- [ ] Bet chip removed after resolution
- [ ] Slippage tolerance works correctly

### Edge Cases
- [ ] Rapid consecutive bets handled
- [ ] Network failure during bet placement
- [ ] Price gap over bet target
- [ ] Exactly hitting target price
- [ ] Resolution at exact target time

---

## Sprint 3: Authentication

### Wallet Connection Tests
- [ ] Connect button visible when logged out
- [ ] Phantom wallet connection works
- [ ] Solflare wallet connection works
- [ ] User created in database on first connect
- [ ] Session persists across page refresh
- [ ] Logout works correctly
- [ ] Demo mode available without wallet

### Balance Tests
- [ ] Initial balance correct (10000 demo)
- [ ] Balance syncs with server
- [ ] Balance persists across sessions
- [ ] Balance cannot go negative

---

## Sprint 4: Chat & Social

### Chat Tests
- [ ] Chat panel renders
- [ ] Messages load on open
- [ ] New messages appear in real-time
- [ ] Can send messages
- [ ] Message appears after send
- [ ] User avatar displays
- [ ] Username displays
- [ ] Bet notifications show in feed
- [ ] Rate limiting prevents spam
- [ ] Chat scrolls correctly

---

## Sprint 5: Leaderboard

### Leaderboard Tests
- [ ] Leaderboard page loads
- [ ] Rankings display correctly
- [ ] Top users shown first
- [ ] Wins/losses accurate
- [ ] Profit calculated correctly
- [ ] User avatars display
- [ ] Updates after bet resolution
- [ ] Period filter works (daily/weekly/all)

### Profile Tests
- [ ] Profile page loads
- [ ] User stats display
- [ ] Win/loss history available

---

## Sprint 6: Settings

### Settings Tests
- [ ] Settings modal opens
- [ ] Background music toggle works
- [ ] Sound effects toggle works
- [ ] Slippage tolerance adjustable
- [ ] High/low area toggle works
- [ ] Double-tap trading toggle works
- [ ] Settings persist after close
- [ ] Settings sync across devices

---

## Sprint 7: Polish & Monetization

### Animation Tests
- [ ] Price line animation smooth
- [ ] Win celebration looks good
- [ ] Confetti/particles render
- [ ] Toast animations smooth
- [ ] Loading states display
- [ ] No animation jank

### Monetization Verification
- [x] House edge = 20% verified (via unit tests - see tests/multiplier-test.mjs)
- [x] Platform fee = 5% verified (via unit tests)
- [x] Max payout cap enforced (BETTING_LIMITS.MAX_SINGLE_PAYOUT = 10000)
- [x] Exposure limits defined (MAX_PLATFORM_EXPOSURE = 500000)
- [x] No arbitrage possible (multiplier < fair multiplier due to house edge)
- [ ] Bot detection triggers on suspicious activity - *Not implemented yet*

### Multiplier Calculator Unit Tests (January 3, 2026)
- [x] House edge is correctly set to 20%
- [x] Display multiplier reflects house edge (~80% of fair multiplier)
- [x] Multipliers increase with price distance
- [x] Payout calculation - gross payout correct (bet * multiplier)
- [x] Payout calculation - platform fee applies only to winnings (5%)
- [x] Payout calculation - net payout = gross - fee
- [x] Minimum multiplier (1.1x) is enforced
- [x] Maximum multiplier (1000x) is enforced
- [x] More time = lower multiplier (higher probability)
- [x] All 10 unit tests pass

### Cross-Browser Tests
| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | | | |
| Firefox | | | |
| Safari | | | |
| Edge | | | |

### Device Tests
| Device | Status | Notes |
|--------|--------|-------|
| iPhone 14 | | |
| iPhone SE | | |
| Pixel 7 | | |
| iPad | | |
| Desktop 1080p | | |
| Desktop 4K | | |

---

## Bug Tracker

### Open Bugs
| ID | Severity | Description | Sprint | Status |
|----|----------|-------------|--------|--------|
| | | | | |

### Resolved Bugs
| ID | Description | Resolution | Date |
|----|-------------|------------|------|
| | | | |

---

## Security Checklist
- [ ] All inputs validated server-side
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (sanitized output)
- [ ] CSRF protection enabled
- [ ] Rate limiting on all endpoints
- [ ] Auth required for protected routes
- [ ] Bet resolution server-side only
- [ ] Price feed from multiple sources
- [ ] No sensitive data in client logs

---

## Load Testing Results

### Concurrent Users Test
| Users | Response Time | Error Rate |
|-------|---------------|------------|
| 100 | | |
| 500 | | |
| 1000 | | |

### WebSocket Stress Test
| Connections | Message Latency | Drop Rate |
|-------------|-----------------|-----------|
| 100 | | |
| 500 | | |
| 1000 | | |

---
