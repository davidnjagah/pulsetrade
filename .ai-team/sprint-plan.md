# PulseTrade Sprint Plan

## Project Timeline Overview

| Sprint | Focus | Duration | Status |
|--------|-------|----------|--------|
| Sprint 1 | Core Trading View (Price Chart + Grid) | ~3-5 days | **ACTIVE** |
| Sprint 2 | Bet Placement & Resolution System | ~3-5 days | Pending |
| Sprint 3 | User Auth & Balance Management | ~2-3 days | Pending |
| Sprint 4 | Chat & Social Features | ~2-3 days | Pending |
| Sprint 5 | Leaderboard & Profile | ~2-3 days | Pending |
| Sprint 6 | Settings & Customization | ~1-2 days | Pending |
| Sprint 7 | Animations, Polish & Monetization | ~3-4 days | Pending |

---

## Sprint 1: Core Trading View (ACTIVE)

### Goals
Build the foundational trading interface with real-time price chart and betting grid overlay.

### UI Designer Tasks
- [ ] Set up Next.js 14 project with App Router
- [ ] Create dark purple/magenta theme with Tailwind CSS
- [ ] Build `PriceChart.tsx` component with canvas/lightweight-charts
- [ ] Implement smooth pink price line with glow effect
- [ ] Create `BettingGrid.tsx` overlay component
- [ ] Display multiplier values in grid cells
- [ ] Build responsive layout (mobile-first for tap trading)
- [ ] Create `Sidebar.tsx` navigation component
- [ ] Build `Header.tsx` with logo placeholder

### Backend Engineer Tasks
- [ ] Set up Supabase project and configure environment
- [ ] Create database schema (users, bets, chat_messages, user_settings)
- [ ] Implement price feed WebSocket service
- [ ] Create `/api/price-feed` WebSocket endpoint
- [ ] Build `multiplierCalculator.ts` with house edge logic
- [ ] Set up Helius/Pyth price oracle integration
- [ ] Create price history buffer (5-10 min window)

### QA Tester Tasks
- [ ] Set up Jest/Vitest testing framework
- [ ] Create test utilities and mocks
- [ ] Write unit tests for multiplier calculation
- [ ] Test WebSocket connection stability
- [ ] Verify chart rendering performance

### Definition of Done
- Price chart displays and updates in real-time
- Grid overlay shows dynamic multipliers
- Responsive on mobile and desktop
- Price feed stable with <500ms latency

---

## Sprint 2: Bet Placement & Resolution System

### Goals
Enable users to place bets by tapping grid cells and resolve bets based on price movement.

### UI Designer Tasks
- [ ] Create `BetChip.tsx` component (yellow chips with amount + multiplier)
- [ ] Implement tap/click bet placement interaction
- [ ] Build bet placement animation (scale up, bounce)
- [ ] Create `WinAnimation.tsx` (particle burst, expanding ring)
- [ ] Build `Toast.tsx` for win notifications
- [ ] Create `Balance.tsx` display component
- [ ] Implement bet stacking in grid columns

### Backend Engineer Tasks
- [ ] Create `/api/bets/place` endpoint
- [ ] Create `/api/bets/active` endpoint
- [ ] Build bet resolution service (monitors price crosses)
- [ ] Implement payout calculation with platform fee
- [ ] Create `/api/bets/resolve` internal endpoint
- [ ] Add slippage tolerance logic
- [ ] Implement betting limits and validation

### QA Tester Tasks
- [ ] Test bet placement flow end-to-end
- [ ] Verify multiplier accuracy
- [ ] Test resolution timing and accuracy
- [ ] Validate payout calculations
- [ ] Test edge cases (rapid bets, concurrent bets)

### Definition of Done
- Users can tap to place bets
- Bets resolve correctly when price crosses target
- Win/loss feedback displays properly
- Balance updates in real-time

---

## Sprint 3: User Authentication & Balance Management

### Goals
Implement user accounts with wallet connection and balance tracking.

### UI Designer Tasks
- [ ] Create wallet connect button/modal
- [ ] Build onboarding flow UI
- [ ] Create profile avatar display
- [ ] Build balance top-up UI (if applicable)
- [ ] Add authentication state to navigation

### Backend Engineer Tasks
- [ ] Configure Supabase Auth
- [ ] Implement wallet authentication (Phantom, Solflare)
- [ ] Create `/api/user/balance` endpoint
- [ ] Implement balance updates on bet resolution
- [ ] Add user session management
- [ ] Create demo mode with fake balance

### QA Tester Tasks
- [ ] Test wallet connection flows
- [ ] Verify authentication persistence
- [ ] Test balance accuracy across sessions
- [ ] Security testing for auth endpoints

### Definition of Done
- Users can connect wallet and authenticate
- Balance persists across sessions
- Demo mode available for new users

---

## Sprint 4: Chat & Social Features

### Goals
Add real-time chat and social bet visibility.

### UI Designer Tasks
- [ ] Build `ChatPanel.tsx` right sidebar
- [ ] Create message bubble components
- [ ] Display user avatars in chat
- [ ] Show bet notifications in chat feed
- [ ] Add chat input with send button

### Backend Engineer Tasks
- [ ] Create `chat_messages` table operations
- [ ] Implement Supabase Realtime for chat
- [ ] Create `/api/chat/messages` endpoint
- [ ] Create `/api/chat/send` endpoint
- [ ] Add real-time bet broadcast for social visibility
- [ ] Implement chat rate limiting

### QA Tester Tasks
- [ ] Test real-time message delivery
- [ ] Verify chat history loading
- [ ] Test message rate limiting
- [ ] Cross-browser chat testing

### Definition of Done
- Real-time chat functional
- Other users' bets visible in feed
- Chat scrolls and loads history properly

---

## Sprint 5: Leaderboard & Profile

### Goals
Implement leaderboard rankings and user profiles.

### UI Designer Tasks
- [ ] Create `/leaderboard/page.tsx` view
- [ ] Build leaderboard table/grid component
- [ ] Create `/profile/page.tsx` view
- [ ] Display user stats (wins, losses, profit)
- [ ] Add rank badges/indicators

### Backend Engineer Tasks
- [ ] Create leaderboard view in database
- [ ] Create `/api/leaderboard` endpoint
- [ ] Implement user stats calculation
- [ ] Add caching for leaderboard data
- [ ] Create profile data endpoints

### QA Tester Tasks
- [ ] Verify leaderboard accuracy
- [ ] Test ranking calculations
- [ ] Performance test with many users
- [ ] Test profile data display

### Definition of Done
- Leaderboard displays top traders
- User profiles show stats
- Rankings update after bet resolution

---

## Sprint 6: Settings & Customization

### Goals
Add user preferences and settings management.

### UI Designer Tasks
- [ ] Build `SettingsModal.tsx` component
- [ ] Create toggle switches for settings
- [ ] Add slippage tolerance slider
- [ ] Build sound controls UI
- [ ] Add high/low area toggle

### Backend Engineer Tasks
- [ ] Create `/api/user/settings` endpoint
- [ ] Implement settings persistence
- [ ] Add sound effect triggers
- [ ] Implement double-tap trading option

### QA Tester Tasks
- [ ] Test all settings toggles
- [ ] Verify settings persistence
- [ ] Test slippage tolerance effect
- [ ] Cross-device settings sync

### Definition of Done
- All settings functional and persist
- Sound effects work correctly
- Slippage tolerance applies to bets

---

## Sprint 7: Animations, Polish & Monetization

### Goals
Add final polish, animations, and ensure monetization logic is solid.

### UI Designer Tasks
- [ ] Polish price line animation (smooth, glow trail)
- [ ] Enhance win celebration animation
- [ ] Add confetti/particle effects
- [ ] Improve toast animations
- [ ] Add loading states and skeletons
- [ ] Final responsive polish
- [ ] Create PulseTrade logo/branding

### Backend Engineer Tasks
- [ ] Implement full house edge logic
- [ ] Add platform fee on winnings
- [ ] Implement exposure management
- [ ] Add volatility circuit breakers
- [ ] Bot detection basics
- [ ] Multiple price oracle fallback
- [ ] Performance optimization

### QA Tester Tasks
- [ ] Full end-to-end testing
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Mobile device testing
- [ ] Load testing
- [ ] Monetization math verification

### Definition of Done
- All animations smooth and polished
- Monetization logic verified mathematically
- Performance meets targets (<100ms response)
- Ready for beta launch

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Price feed latency | Multiple RPC fallbacks, local buffering |
| High concurrent bets | Batch processing, queue system |
| Exploitation/arbitrage | House edge math, bet limits, bot detection |
| Legal/regulatory | Consult gaming lawyer, geo-blocking |

---

## Success Metrics

- Chart updates at 60fps with no jank
- Bet placement to resolution < 500ms
- 99.9% uptime for price feed
- House edge mathematically verified at 20%+
- Mobile tap interaction < 100ms response

---
