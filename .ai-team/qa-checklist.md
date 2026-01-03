# PulseTrade QA Checklist

## Sprint 1: Core Trading View

### Price Chart Tests
- [ ] Chart renders on page load
- [ ] Price line displays correctly
- [ ] Line has pink/magenta color with glow
- [ ] Chart updates in real-time (<500ms latency)
- [ ] Chart maintains 60fps during updates
- [ ] Auto-scroll works as time progresses
- [ ] Y-axis scale adjusts to price range
- [ ] Current price badge shows correct value
- [ ] Chart handles WebSocket disconnection gracefully
- [ ] Chart reconnects automatically after disconnect

### Betting Grid Tests
- [ ] Grid overlay renders on chart
- [ ] Grid lines visible at correct opacity
- [ ] Multiplier values display in cells
- [ ] Multipliers update as price moves
- [ ] Higher multipliers for distant prices
- [ ] Lower multipliers for near prices
- [ ] Grid is responsive on different screen sizes
- [ ] Grid cells are tappable/clickable

### Navigation Tests
- [ ] Sidebar renders correctly
- [ ] Trade icon is active on trading view
- [ ] Leaderboard link works
- [ ] Profile link works
- [ ] Navigation is accessible

### Performance Benchmarks
| Test | Target | Actual | Status |
|------|--------|--------|--------|
| Chart FPS | 60fps | | |
| Price latency | <500ms | | |
| Initial load | <3s | | |
| Memory usage | <100MB | | |

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
- [ ] House edge = 20% verified
- [ ] Platform fee = 5% verified
- [ ] Max payout cap enforced
- [ ] Exposure limits working
- [ ] No arbitrage possible
- [ ] Bot detection triggers on suspicious activity

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
