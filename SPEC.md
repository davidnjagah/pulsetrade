# PulseTrade - Tap Trading Platform Specification

## Overview

**PulseTrade** is a real-time cryptocurrency/asset tap trading platform where users place bets on price movements using a grid-based prediction system. Users tap on price-time grid cells to place bets predicting where the price will move, with multipliers based on distance from current price. The platform features live price charts, real-time bet visualization, instant win/loss feedback, and social features including chat and leaderboards.

---

## Platform Architecture

### Tech Stack
- **Frontend**: Next.js 14+ (App Router) with React
- **Backend**: Next.js API Routes + Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime subscriptions + WebSocket for price feeds
- **Storage**: Supabase Storage (for user avatars, assets)
- **Authentication**: Supabase Auth (wallet connection for crypto)
- **RPC/Price Feed**: High-frequency Solana RPC (Helius, Triton, or QuickNode) for real-time SOL price data

### Recommended High-Frequency RPCs for Solana:
- **Helius** - https://helius.xyz (recommended for lowest latency)
- **Triton** - https://triton.one
- **QuickNode** - https://quicknode.com
- **Shyft** - https://shyft.to

---

## Core Features & Functionality

### 1. Real-Time Price Chart

**Description**: A live-updating line chart showing cryptocurrency price movement (appears to track SOL or similar asset around $3,300 range).

**Visual Specifications**:
- Dark purple/magenta gradient background
- Price line: Pink/magenta (#FF69B4 or similar) with glow effect
- Line thickness: 2-3px with subtle drop shadow
- Smooth line rendering (use bezier curves)
- Real-time animated drawing as new price data arrives
- Current price displayed in top-left with green pill badge (shows value like "3334.40")

**Technical Requirements**:
- WebSocket connection to price feed
- Update frequency: 100-500ms for smooth animation
- Store last 5-10 minutes of price history
- Chart should auto-scroll horizontally as time progresses
- Price scale (Y-axis) should auto-adjust based on price range

### 2. Betting Grid System

**Description**: A transparent grid overlay on the chart where users can tap/click to place bets on future price-time intersections.

**Grid Specifications**:
- Grid cells represent price ranges (Y-axis) × time intervals (X-axis)
- Each cell shows a multiplier value (e.g., "111X", "72.6X", "47.5X")
- Multipliers DECREASE as you get closer to current price
- Multipliers INCREASE as you get further from current price (higher risk = higher reward)
- Grid lines: Subtle pink/magenta with low opacity (~10-20%)
- Time intervals visible at bottom of chart
- Price levels visible on right edge with current balance indicator

**Multiplier Logic**:
- Cells directly adjacent to price line: Low multipliers (1.5x - 5x)
- Medium distance: Medium multipliers (5x - 20x)
- Far from current price: High multipliers (20x - 100x+)
- Multipliers should update in real-time as price moves

### 3. Bet Placement (Tap-to-Trade)

**Description**: Users tap on grid cells to place bets. Bets appear as yellow rectangular chips on the grid.

**Bet Chip Visual Specifications**:
- Background: Bright yellow/lime (#FFFF00 or #E6FF00)
- Shape: Rounded rectangle
- Display: Dollar amount (e.g., "$10", "$5", "$3", "$1")
- Secondary text below amount: Multiplier value in smaller text (e.g., "1.88x", "1.62x", "2.04x")
- Size: Approximately 50-70px wide
- Border: Subtle darker yellow border
- Drop shadow for depth

**Bet Amounts Available**:
- $1, $3, $5, $10 (configurable preset amounts)
- Users can have multiple bets active simultaneously
- Bets stack vertically in columns when multiple bets are at similar price levels

**Placement Behavior**:
- Single tap/click places bet at that grid intersection
- Bet appears immediately with placement animation
- Bets remain visible until resolved (win/lose based on price movement)

### 4. Win/Loss Resolution

**Description**: When price moves through bet positions, bets are resolved with visual feedback.

**Win Feedback**:
- Toast notification appears top-right: "You won $X.XX" with checkmark icon
- Notification has dark semi-transparent background with white text
- Win amount reflects bet × multiplier
- Winning bet chip may have explosion/celebration animation (yellow burst effect visible in frames)
- Sound effect (optional, controlled in settings)

**Loss Feedback**:
- Bet chip fades out or has "X" animation
- Balance updates to reflect loss
- No toast for losses (less intrusive UX)

**Resolution Animation**:
- When price line crosses through a bet position, trigger resolution
- Winning bets: Yellow burst/sparkle animation emanating from chip
- Sound effects triggered on win

### 5. User Balance Display

**Description**: Shows current user balance in bottom-left area.

**Specifications**:
- Red/pink wallet icon
- Balance displayed as "$2,566.52" format
- Updates in real-time as bets resolve
- Animated number transitions when balance changes

### 6. Left Sidebar Navigation

**Description**: Vertical navigation sidebar on left side of the main trading area.

**Menu Items**:
1. **Trade** (active state with icon) - Chart/line icon, highlighted when on trading view
2. **Leaderboard** - Trophy icon
3. **Profile** - User/person icon

**Visual Style**:
- Dark semi-transparent background
- Icons in light gray/white
- Active item has subtle highlight or pill background
- Menu positioned vertically with spacing between items

### 7. Settings Modal

**Description**: Modal overlay for user settings, accessible via gear icon in top-right.

**Settings Sections**:

**Sounds**:
- Background Music: Toggle switch (on/off)
- Sound Effects: Toggle switch (on/off)

**Trading**:
- Slippage Tolerance: Adjustable with +/- buttons, displays percentage (e.g., "30%")
- Show high/low area: Toggle switch
- Double tap for trading: Toggle switch (partially visible)

**Modal Style**:
- Dark background with rounded corners
- "SETTINGS" header in white/pink text
- Section labels in gray
- Toggle switches with white/green active state
- X button in top-right to close

### 8. Live Chat Sidebar

**Description**: Right-side chat panel showing real-time messages from other users.

**Features**:
- User avatars (circular profile images)
- Username display (e.g., "DegenzLive", "0xuitport", "HolyBean")
- Message text
- Real-time message updates
- Scroll area for message history
- Bet notifications integrated (shows "$10" or "$1" badges when users place bets)

**Visual Style**:
- Semi-transparent dark background
- Messages in white text
- Usernames in accent color
- Compact message bubbles
- Small profile avatars (~24-32px)

### 9. Leaderboard View

**Description**: Alternative view showing rankings of top traders.

**Grid/Table Display** (glimpsed in frames 49-51):
- Tabular layout showing rankings
- Columns for rank, username, stats (wins, profit, etc.)
- Same dark theme as main interface
- Accessible via sidebar navigation

---

## Animations & Visual Effects

### 1. Price Line Animation
- Smooth continuous drawing as new data arrives
- Subtle glow effect on the line
- Trail effect showing recent movement

### 2. Bet Placement Animation
- Scale up from 0 to 100% when placed
- Subtle bounce effect
- Glow pulse on placement

### 3. Win Celebration Animation
- Yellow/gold particle burst from winning bet chip
- Expanding ring animation
- Chip scales up briefly then disappears
- Confetti-like particles (visible in frame 110)

### 4. Toast Notifications
- Slide in from top-right
- Auto-dismiss after 3-4 seconds
- Stack if multiple wins occur

### 5. Grid Multiplier Updates
- Numbers smoothly transition when values change
- Subtle fade effect on cell updates

### 6. Balance Updates
- Number counter animation (rolling numbers)
- Green flash on increase, red flash on decrease

---

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background (primary) | Dark purple | #1a0a2e / #2d1b4e |
| Background (gradient) | Magenta tint | #3d1f5c |
| Price line | Pink/Magenta | #ff69b4 / #ff1493 |
| Grid lines | Pink (low opacity) | rgba(255,105,180,0.15) |
| Bet chips | Yellow/Lime | #e6ff00 / #ffff00 |
| Win toast | Dark gray | rgba(50,50,50,0.9) |
| Text primary | White | #ffffff |
| Text secondary | Light gray | #a0a0a0 |
| Balance icon | Red/Pink | #ff4d6d |
| Active nav | Highlighted | #4a3f6b |
| Multiplier text | Light pink/white | #ffb6c1 |

---

## Database Schema (Supabase)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  balance DECIMAL(18,2) DEFAULT 10000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(18,2) NOT NULL,
  target_price DECIMAL(18,8) NOT NULL,
  target_time TIMESTAMPTZ NOT NULL,
  multiplier DECIMAL(10,4) NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'won', 'lost', 'expired'
  payout DECIMAL(18,2),
  price_at_placement DECIMAL(18,8)
);

-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.avatar_url,
  COUNT(CASE WHEN b.status = 'won' THEN 1 END) as wins,
  COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as losses,
  SUM(CASE WHEN b.status = 'won' THEN b.payout - b.amount ELSE -b.amount END) as profit
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
GROUP BY u.id, u.username, u.avatar_url
ORDER BY profit DESC;

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  background_music BOOLEAN DEFAULT false,
  sound_effects BOOLEAN DEFAULT true,
  slippage_tolerance INTEGER DEFAULT 30,
  show_high_low BOOLEAN DEFAULT false,
  double_tap_trading BOOLEAN DEFAULT false
);
```

---

## API Endpoints (Next.js API Routes)

```
POST   /api/bets/place          - Place a new bet
GET    /api/bets/active         - Get user's active bets
POST   /api/bets/resolve        - Resolve bet (internal, called by price monitor)
GET    /api/leaderboard         - Get leaderboard data
GET    /api/user/balance        - Get current balance
POST   /api/user/settings       - Update user settings
GET    /api/chat/messages       - Get recent chat messages
POST   /api/chat/send           - Send chat message
WS     /api/price-feed          - WebSocket for real-time price data
```

---

## Real-Time Price Feed Integration

```typescript
// Example Helius WebSocket connection for SOL price
const HELIUS_WS_URL = 'wss://atlas-mainnet.helius-rpc.com/?api-key=YOUR_KEY';

// Subscribe to price updates
// Use Jupiter or Pyth for accurate price feeds
// Alternative: Birdeye API for token prices

interface PriceUpdate {
  price: number;
  timestamp: number;
  volume24h?: number;
}

// Price feed service
class PriceFeedService {
  private ws: WebSocket;
  private subscribers: Set<(price: PriceUpdate) => void>;
  
  connect() {
    // Connect to price oracle (Pyth, Switchboard, or aggregated)
    // Emit price updates at 100-500ms intervals
  }
  
  subscribe(callback: (price: PriceUpdate) => void) {
    this.subscribers.add(callback);
  }
}
```

---

## Frontend Component Structure

```
/app
  /page.tsx                 - Main trading view
  /leaderboard/page.tsx     - Leaderboard view
  /profile/page.tsx         - User profile
  /api
    /bets/route.ts
    /chat/route.ts
    /user/route.ts

/components
  /trading
    /PriceChart.tsx         - Main chart component (use lightweight-charts or custom canvas)
    /BettingGrid.tsx        - Grid overlay with multipliers
    /BetChip.tsx            - Individual bet chip component
    /WinAnimation.tsx       - Celebration animation
  /layout
    /Sidebar.tsx            - Left navigation
    /ChatPanel.tsx          - Right chat sidebar
    /Header.tsx             - Top bar with logo and settings
  /modals
    /SettingsModal.tsx      - Settings configuration
  /ui
    /Toast.tsx              - Win notifications
    /Balance.tsx            - Balance display
    /Button.tsx             - Reusable buttons

/hooks
  /usePriceFeed.ts          - WebSocket price subscription
  /useBets.ts               - Bet management
  /useSupabase.ts           - Supabase client
  /useRealtimeChat.ts       - Chat subscription

/lib
  /supabase.ts              - Supabase client initialization
  /multiplierCalculator.ts  - Calculate bet multipliers based on distance
  /priceService.ts          - Price feed connection
```

---

## Key Technical Considerations

### 1. High-Frequency Price Updates
- Use WebSocket for minimal latency
- Buffer updates and render at 60fps
- Implement interpolation for smooth line drawing

### 2. Bet Resolution Logic
- Monitor price crosses bet target zones
- Account for slippage tolerance setting
- Use server-side resolution to prevent cheating
- Batch resolve bets for efficiency

### 3. Multiplier Calculation
```typescript
function calculateMultiplier(
  currentPrice: number,
  targetPrice: number,
  currentTime: number,
  targetTime: number
): number {
  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;
  const timeDistance = (targetTime - currentTime) / 1000 / 60; // minutes
  
  // Base multiplier increases with price distance
  // Adjusted by time factor (further future = higher multiplier)
  const baseMultiplier = 1 + (priceDistance * 100);
  const timeFactor = 1 + (timeDistance * 0.1);
  
  return Math.min(baseMultiplier * timeFactor, 1000); // Cap at 1000x
}
```

### 4. Canvas/WebGL for Performance
- Consider using HTML Canvas or WebGL for chart rendering
- Lightweight-charts library is a good option
- Avoid React re-renders for price updates

### 5. Supabase Real-time
- Use Supabase Realtime for:
  - Chat messages
  - Other users' bets (social visibility)
  - Leaderboard updates

---

## Branding Elements

- **Logo**: "PulseTrade" or "PULSE" - modern, bold sans-serif font with a heartbeat/pulse line integrated into the design
- **Tagline options**: "Trade the Pulse" / "Tap. Predict. Win." / "Feel the Market Pulse"
- **Color accent**: Pink/magenta theme throughout (represents energy, excitement)
- **Mood**: Dark, premium, high-energy crypto trading aesthetic
- **Target audience**: Crypto traders looking for gamified, fast-paced tap trading
- **Brand personality**: Energetic, precise, real-time, pulse of the market

---

## Platform Context

Consider social/streaming integrations for future features - the tap trading format works well for live content and community engagement.

---

## Build Priority Order

1. **Phase 1**: Core trading view with price chart and grid
2. **Phase 2**: Bet placement and resolution system
3. **Phase 3**: User authentication and balance management
4. **Phase 4**: Chat and social features
5. **Phase 5**: Leaderboard and profile
6. **Phase 6**: Settings and customization
7. **Phase 7**: Animations and polish

---

## Notes for Development

- The grid should be highly performant - consider virtualization for cells
- Win animations should feel rewarding but not disruptive
- Mobile responsiveness is important (tap trading concept)
- Consider implementing a demo/paper trading mode
- Add rate limiting for bet placement
- Implement proper error handling for RPC failures
- Consider caching price data for chart history

---

## Platform Monetization & House Edge Logic

### Core Principle: Expected Value (EV) Must Favor the House

In any betting system, the key formula is:

```
Expected Value (EV) = (Probability of Win × Payout) - (Probability of Loss × Stake)
```

For the PLATFORM to profit:
- User's EV must be NEGATIVE
- Platform's EV must be POSITIVE

This is achieved by ensuring displayed multipliers are LOWER than the true odds would justify.

---

### PRIMARY REVENUE: Built-In House Edge on Multipliers

**How It Works:**
The multipliers shown to users are mathematically reduced from "fair odds" to create a house edge.

**Example:**
- True probability of price hitting a certain target = 10% (1 in 10 chance)
- Fair multiplier would be = 10x (break-even)
- Platform displays = 8x multiplier (20% house edge)

**The Math:**
```
User bets $10 at displayed 8x multiplier
- If they win (10% chance): They get $80 (profit of $70)
- If they lose (90% chance): They lose $10

User's EV = (0.10 × $70) - (0.90 × $10) = $7 - $9 = -$2 per bet

Platform's EV = +$2 per $10 bet = 20% margin
```

**Implementation:**

```typescript
// Multiplier calculation with house edge
function calculateDisplayMultiplier(
  currentPrice: number,
  targetPrice: number,
  timeToTarget: number, // in seconds
  volatility: number    // historical price volatility
): number {
  
  // Step 1: Calculate true probability using statistical model
  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;
  const normalizedTime = timeToTarget / 60; // convert to minutes
  
  // Probability decreases with distance, increases with time and volatility
  const trueProbability = calculateTrueProbability(priceDistance, normalizedTime, volatility);
  
  // Step 2: Calculate fair multiplier (break-even for user)
  const fairMultiplier = 1 / trueProbability;
  
  // Step 3: Apply house edge (15-25% reduction)
  const HOUSE_EDGE = 0.20; // 20% house edge
  const displayMultiplier = fairMultiplier * (1 - HOUSE_EDGE);
  
  // Step 4: Apply caps and floors
  return Math.max(1.1, Math.min(displayMultiplier, 1000));
}

function calculateTrueProbability(
  priceDistance: number,
  timeMinutes: number,
  volatility: number
): number {
  // Simplified probability model
  // Real implementation should use proper financial math (Black-Scholes for crypto)
  
  const baseProb = Math.exp(-priceDistance * 50); // exponential decay with distance
  const timeAdjustment = Math.sqrt(timeMinutes / 5); // more time = higher chance
  const volAdjustment = 1 + (volatility * 2); // higher volatility = higher chance of big moves
  
  const probability = Math.min(0.95, baseProb * timeAdjustment * volAdjustment);
  return Math.max(0.001, probability); // floor at 0.1%
}
```

**House Edge Tiers:**
| Distance from Price | House Edge | Rationale |
|---------------------|------------|-----------|
| Very close (< 0.5%) | 25% | High win probability, need more edge |
| Close (0.5-2%) | 20% | Standard edge |
| Medium (2-5%) | 18% | Moderate risk bets |
| Far (5-10%) | 15% | Lower frequency, can reduce edge |
| Very far (> 10%) | 12% | Rare wins, lower edge acceptable |

---

### SECONDARY REVENUE: Platform Fee on Winnings

**How It Works:**
Take a percentage cut from every winning payout.

**Example:**
```
User wins $100 payout
Platform takes 5% fee = $5
User receives $95
```

**Implementation:**
```typescript
function calculatePayout(betAmount: number, multiplier: number): {
  grossPayout: number;
  platformFee: number;
  netPayout: number;
} {
  const PLATFORM_FEE_RATE = 0.05; // 5% fee on winnings
  
  const grossPayout = betAmount * multiplier;
  const winnings = grossPayout - betAmount;
  const platformFee = winnings * PLATFORM_FEE_RATE;
  const netPayout = grossPayout - platformFee;
  
  return {
    grossPayout,
    platformFee,
    netPayout
  };
}
```

---

### Combined Revenue Model

Use **House Edge + Win Fee** together:

1. **20% house edge baked into multipliers** (invisible to users)
2. **3-5% fee on winnings** (transparent, shown in UI)

**Combined Platform Edge:**
```
Base house edge: 20%
Plus fee on wins: ~3-5% of win frequency

Effective house edge: 22-25% on all action
```

---

### Risk Management & Loss Prevention

#### 1. Maximum Payout Caps

```typescript
const MAX_SINGLE_PAYOUT = 10000; // $10,000 max per bet
const MAX_DAILY_PAYOUT_PER_USER = 50000; // $50,000 per user per day
const MAX_PLATFORM_EXPOSURE = 500000; // Total outstanding bet liability

function canPlaceBet(
  betAmount: number, 
  multiplier: number, 
  currentExposure: number
): boolean {
  const potentialPayout = betAmount * multiplier;
  
  if (potentialPayout > MAX_SINGLE_PAYOUT) return false;
  if (currentExposure + potentialPayout > MAX_PLATFORM_EXPOSURE) return false;
  
  return true;
}
```

#### 2. Dynamic Multiplier Adjustment Based on Exposure

If too many users bet on the same outcome, reduce multipliers for that outcome:

```typescript
function adjustMultiplierForExposure(
  baseMultiplier: number,
  currentExposureOnOutcome: number,
  maxDesiredExposure: number
): number {
  const exposureRatio = currentExposureOnOutcome / maxDesiredExposure;
  
  if (exposureRatio > 0.8) {
    // Reduce multiplier as exposure increases
    const reduction = Math.min(0.5, (exposureRatio - 0.8) * 2);
    return baseMultiplier * (1 - reduction);
  }
  
  return baseMultiplier;
}
```

#### 3. Betting Limits

```typescript
const LIMITS = {
  MIN_BET: 1,          // $1 minimum
  MAX_BET: 100,        // $100 maximum per bet
  MAX_ACTIVE_BETS: 20, // Maximum concurrent bets per user
  COOLDOWN_MS: 500,    // Minimum time between bets (prevents bot spam)
};
```

#### 4. Volatility-Based Circuit Breakers

During extreme market conditions, reduce multipliers or pause betting:

```typescript
function checkVolatilityCircuitBreaker(recentPriceChanges: number[]): {
  allowBetting: boolean;
  multiplierAdjustment: number;
} {
  const volatility = calculateVolatility(recentPriceChanges);
  
  if (volatility > 0.10) { // >10% move in short period
    return { allowBetting: false, multiplierAdjustment: 0 };
  }
  
  if (volatility > 0.05) { // >5% move
    return { allowBetting: true, multiplierAdjustment: 0.5 }; // Half multipliers
  }
  
  return { allowBetting: true, multiplierAdjustment: 1.0 };
}
```

---

### Revenue Projections

**Assumptions:**
- Daily betting volume: $100,000
- House edge: 20%
- Win fee: 5%
- Average win rate: 35%

**Calculation:**
```
Daily Volume: $100,000

House Edge Revenue:
$100,000 × 20% = $20,000

Win Fee Revenue:
$100,000 × 35% win rate = $35,000 in payouts
$35,000 × 5% fee = $1,750

Total Daily Revenue: $21,750
Monthly Revenue: ~$650,000
Annual Revenue: ~$7.8M

Minus:
- Server costs: ~$5,000/month
- RPC costs: ~$2,000/month
- Support/Operations: ~$10,000/month

Net Monthly Profit: ~$633,000
```

---

### Anti-Exploitation Measures

#### 1. Prevent Arbitrage
```typescript
// Ensure no combination of bets can guarantee profit
function validateNonArbitrage(allActiveBets: Bet[]): boolean {
  // Check that user can't bet on both sides with overlapping multipliers
  // that guarantee profit regardless of outcome
}
```

#### 2. Detect Bot/Automated Trading
```typescript
function detectBotBehavior(userActivity: BetHistory[]): boolean {
  // Check for:
  // - Inhuman speed between bets
  // - Perfect timing patterns
  // - Unusually high win rates
  // - API abuse patterns
}
```

#### 3. Delayed Resolution
Add small random delay to bet resolution to prevent front-running:
```typescript
const RESOLUTION_DELAY_MS = Math.random() * 500 + 200; // 200-700ms random delay
```

#### 4. Price Feed Protection
Use multiple price oracles and take median to prevent manipulation:
```typescript
async function getVerifiedPrice(): Promise<number> {
  const prices = await Promise.all([
    getPriceFromPyth(),
    getPriceFromChainlink(),
    getPriceFromBirdeye(),
  ]);
  
  // Return median price
  prices.sort((a, b) => a - b);
  return prices[Math.floor(prices.length / 2)];
}
```

---

### Monetization Summary Table

| Mechanism | How It Works | Platform Benefit |
|-----------|--------------|------------------|
| House Edge | Multipliers are 15-25% below fair odds | Profit on every bet mathematically |
| Win Fee | 3-5% cut of all payouts | Additional revenue stream |
| Max Payouts | Cap maximum possible losses | Limits downside risk |
| Dynamic Odds | Reduce multipliers when exposure is high | Prevents catastrophic losses |
| Volume | More bets = law of large numbers kicks in | Variance smooths out, edge realized |

**The Golden Rule:** Over thousands of bets, the math ALWAYS wins. Individual users may win big, but the aggregate will favor the platform by the house edge percentage.

---

### Transparency Recommendations

While the house edge is baked in, consider these for user trust:

1. **Display "theoretical return"**: "This game has a 95% theoretical return to player"
2. **Show platform fee clearly**: "5% platform fee on winnings"
3. **Provably fair resolution**: Use blockchain timestamps or commit-reveal for bet resolution
4. **Public statistics**: Show overall platform win/loss ratios

---

### Legal Considerations

⚠️ **This platform may be classified as:**
- Online gambling (regulated in most jurisdictions)
- Binary options trading (banned in many countries)
- Prediction market (varying regulations)

**Recommended Actions:**
1. Consult gambling/gaming lawyer
2. Consider offshore jurisdiction (Curaçao, Malta, etc.)
3. Implement KYC/AML if required
4. Geo-block restricted jurisdictions
5. Add responsible gambling features (deposit limits, self-exclusion)

---

### Monetization Implementation Priority

1. **CRITICAL**: House edge multiplier calculation (this is core to profitability)
2. **CRITICAL**: Maximum payout caps and exposure management
3. **HIGH**: Win fee implementation
4. **HIGH**: Volatility circuit breakers
5. **MEDIUM**: Bot detection
6. **MEDIUM**: Dynamic odds adjustment
7. **LOW**: Advanced anti-arbitrage checks
