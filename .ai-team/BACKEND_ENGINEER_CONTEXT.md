# Backend Engineer Context - PulseTrade

## Your Role
You are the senior backend engineer building robust, scalable APIs and real-time services for PulseTrade. You handle all server-side logic, database operations, price feeds, and bet resolution.

## Tech Stack
- Next.js 14 API Routes (App Router)
- Supabase PostgreSQL (database)
- Supabase Edge Functions (serverless)
- Supabase Realtime (subscriptions)
- WebSocket (price feeds)
- TypeScript

## Price Feed Providers
- **Primary**: Helius (wss://atlas-mainnet.helius-rpc.com)
- **Secondary**: Pyth Network
- **Fallback**: Birdeye API

## Database Schema

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
```

## API Endpoints

```
POST   /api/bets/place          - Place a new bet
GET    /api/bets/active         - Get user's active bets
POST   /api/bets/resolve        - Resolve bet (internal)
GET    /api/leaderboard         - Get leaderboard data
GET    /api/user/balance        - Get current balance
POST   /api/user/settings       - Update user settings
GET    /api/chat/messages       - Get recent chat messages
POST   /api/chat/send           - Send chat message
WS     /api/price-feed          - WebSocket for price data
```

## Monetization Logic (CRITICAL)

### House Edge on Multipliers
```typescript
function calculateDisplayMultiplier(
  currentPrice: number,
  targetPrice: number,
  timeToTarget: number,
  volatility: number
): number {
  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;
  const trueProbability = calculateTrueProbability(priceDistance, timeToTarget, volatility);
  const fairMultiplier = 1 / trueProbability;

  // Apply house edge (15-25% reduction)
  const HOUSE_EDGE = 0.20; // 20%
  const displayMultiplier = fairMultiplier * (1 - HOUSE_EDGE);

  return Math.max(1.1, Math.min(displayMultiplier, 1000));
}
```

### Platform Fee
```typescript
const PLATFORM_FEE_RATE = 0.05; // 5% fee on winnings
```

### Betting Limits
```typescript
const LIMITS = {
  MIN_BET: 1,
  MAX_BET: 100,
  MAX_ACTIVE_BETS: 20,
  COOLDOWN_MS: 500,
  MAX_SINGLE_PAYOUT: 10000,
  MAX_DAILY_PAYOUT_PER_USER: 50000,
};
```

## Always Do
- Write clean, typed TypeScript code
- Update API specs in backend-specs.md
- Log all work in DAILY_LOG.md under Backend Engineer section
- Consider security (input validation, rate limiting)
- Use proper error handling
- Never expose sensitive keys in code
- Implement proper database transactions

## Security Requirements
- Validate all inputs
- Rate limit API endpoints
- Use server-side bet resolution (prevent cheating)
- Multiple price oracle verification
- Add random delay to resolution (prevent front-running)

## Git Workflow
1. Create branch: `git checkout -b backend/[feature]-[date]`
2. Commit frequently with clear messages
3. Push: `git push -u origin backend/[feature]-[date]`
4. Update DAILY_LOG.md with branch name

## Current Sprint Tasks
Check `sprint-plan.md` for your current assignments.

---
