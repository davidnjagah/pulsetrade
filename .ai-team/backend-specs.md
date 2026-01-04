# PulseTrade Backend Specifications

## API Overview

Base URL: `/api`
Authentication: Supabase Auth (JWT tokens)
Content-Type: `application/json`

---

## Endpoints

### Bets

#### POST /api/bets/place
Place a new bet on the grid.

**Request:**
```json
{
  "amount": 10,
  "targetPrice": 3350.50,
  "targetTime": "2026-01-03T15:30:00Z",
  "priceAtPlacement": 3334.40
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "amount": 10,
  "targetPrice": 3350.50,
  "targetTime": "2026-01-03T15:30:00Z",
  "multiplier": 2.45,
  "priceAtPlacement": 3334.40,
  "placedAt": "2026-01-03T15:25:00Z",
  "status": "active",
  "potentialPayout": 24.50
}
```

**Errors:**
- 400: Invalid bet parameters
- 401: Unauthorized
- 402: Insufficient balance
- 429: Rate limited (cooldown)

---

#### GET /api/bets/active
Get user's currently active bets.

**Response (200):**
```json
{
  "bets": [
    {
      "id": "uuid",
      "amount": 10,
      "targetPrice": 3350.50,
      "targetTime": "2026-01-03T15:30:00Z",
      "multiplier": 2.45,
      "placedAt": "2026-01-03T15:25:00Z",
      "status": "active"
    }
  ],
  "totalExposure": 50
}
```

---

#### POST /api/bets/resolve (Internal)
Resolve a bet based on price movement.

**Request:**
```json
{
  "betId": "uuid",
  "actualPrice": 3351.20,
  "resolvedAt": "2026-01-03T15:30:00Z"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "won",
  "payout": 23.275,
  "platformFee": 1.225
}
```

---

### User

#### GET /api/user/balance
Get current user balance.

**Response (200):**
```json
{
  "balance": 2566.52,
  "lockedInBets": 50,
  "available": 2516.52
}
```

---

#### POST /api/user/settings
Update user settings.

**Request:**
```json
{
  "backgroundMusic": false,
  "soundEffects": true,
  "slippageTolerance": 30,
  "showHighLow": false,
  "doubleTapTrading": false
}
```

**Response (200):**
```json
{
  "success": true,
  "settings": { ... }
}
```

---

### Chat

#### GET /api/chat/messages
Get recent chat messages.

**Query Params:**
- `limit`: Number of messages (default: 50, max: 100)
- `before`: Cursor for pagination

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "userId": "uuid",
      "username": "DegenzLive",
      "avatarUrl": "https://...",
      "message": "Let's go!",
      "createdAt": "2026-01-03T15:20:00Z"
    }
  ],
  "cursor": "next_page_cursor"
}
```

---

#### POST /api/chat/send
Send a chat message.

**Request:**
```json
{
  "message": "Nice win!"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "message": "Nice win!",
  "createdAt": "2026-01-03T15:25:00Z"
}
```

**Errors:**
- 400: Message too long (max 200 chars)
- 429: Rate limited

---

### Leaderboard

#### GET /api/leaderboard
Get top traders.

**Query Params:**
- `limit`: Number of entries (default: 100)
- `period`: "daily" | "weekly" | "alltime"

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "CryptoKing",
      "avatarUrl": "https://...",
      "wins": 142,
      "losses": 89,
      "profit": 15420.50,
      "winRate": 0.615
    }
  ],
  "totalUsers": 1500
}
```

---

### Price Feed

#### WS /api/price-feed
WebSocket connection for real-time price data.

**Subscribe:**
```json
{
  "type": "subscribe",
  "asset": "SOL"
}
```

**Price Update:**
```json
{
  "type": "price",
  "price": 3334.40,
  "timestamp": 1704295500000,
  "volume24h": 1500000000
}
```

---

## Data Models

### User
```typescript
interface User {
  id: string;
  walletAddress: string;
  username: string;
  avatarUrl: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Bet
```typescript
interface Bet {
  id: string;
  userId: string;
  amount: number;
  targetPrice: number;
  targetTime: Date;
  multiplier: number;
  placedAt: Date;
  resolvedAt: Date | null;
  status: 'active' | 'won' | 'lost' | 'expired';
  payout: number | null;
  priceAtPlacement: number;
}
```

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: Date;
}
```

### UserSettings
```typescript
interface UserSettings {
  userId: string;
  backgroundMusic: boolean;
  soundEffects: boolean;
  slippageTolerance: number;
  showHighLow: boolean;
  doubleTapTrading: boolean;
}
```

---

## Business Logic

### Multiplier Calculation
```typescript
function calculateMultiplier(
  currentPrice: number,
  targetPrice: number,
  currentTime: number,
  targetTime: number,
  volatility: number
): number {
  const priceDistance = Math.abs(targetPrice - currentPrice) / currentPrice;
  const timeMinutes = (targetTime - currentTime) / 1000 / 60;

  // Calculate true probability
  const baseProb = Math.exp(-priceDistance * 50);
  const timeAdjust = Math.sqrt(timeMinutes / 5);
  const volAdjust = 1 + (volatility * 2);
  const trueProbability = Math.min(0.95, Math.max(0.001, baseProb * timeAdjust * volAdjust));

  // Fair multiplier with house edge
  const fairMultiplier = 1 / trueProbability;
  const HOUSE_EDGE = 0.20;
  const displayMultiplier = fairMultiplier * (1 - HOUSE_EDGE);

  return Math.max(1.1, Math.min(displayMultiplier, 1000));
}
```

### Payout Calculation
```typescript
function calculatePayout(amount: number, multiplier: number): {
  grossPayout: number;
  platformFee: number;
  netPayout: number;
} {
  const PLATFORM_FEE_RATE = 0.05;

  const grossPayout = amount * multiplier;
  const winnings = grossPayout - amount;
  const platformFee = winnings * PLATFORM_FEE_RATE;
  const netPayout = grossPayout - platformFee;

  return { grossPayout, platformFee, netPayout };
}
```

### Bet Validation
```typescript
const LIMITS = {
  MIN_BET: 1,
  MAX_BET: 100,
  MAX_ACTIVE_BETS: 20,
  COOLDOWN_MS: 500,
  MAX_SINGLE_PAYOUT: 10000,
  MAX_DAILY_PAYOUT_PER_USER: 50000,
  MAX_PLATFORM_EXPOSURE: 500000,
};

function validateBet(bet: BetRequest, user: User): ValidationResult {
  if (bet.amount < LIMITS.MIN_BET) return { valid: false, error: 'Bet too small' };
  if (bet.amount > LIMITS.MAX_BET) return { valid: false, error: 'Bet too large' };
  if (bet.amount > user.balance) return { valid: false, error: 'Insufficient balance' };
  // ... more validations
  return { valid: true };
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /bets/place | 2 per second per user |
| POST /chat/send | 1 per 2 seconds per user |
| GET /* | 100 per minute per user |
| WS price-feed | 1 connection per user |

---

## Error Response Format

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Your balance is too low for this bet",
    "details": {
      "required": 50,
      "available": 25.50
    }
  }
}
```

---

## Sprint 7: New Endpoints

### Health Check

#### GET /api/health
Basic health check for the platform.

**Query Params:**
- `detail`: "true" for detailed health information (optional)

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-04T12:00:00Z",
  "uptime": 3600000,
  "version": "1.0.0-sprint7"
}
```

**Detailed Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-04T12:00:00Z",
  "uptime": 3600000,
  "version": "1.0.0-sprint7",
  "services": {
    "betting": { "status": "up", "lastCheck": "..." },
    "pricing": { "status": "up", "lastCheck": "..." },
    "riskManagement": { "status": "up", "lastCheck": "..." },
    "antiExploitation": { "status": "up", "lastCheck": "..." }
  },
  "metrics": {
    "activeBets": 42,
    "totalUsers": 150,
    "responseTime": { "averageMs": 45, "maxMs": 120 },
    "exposure": { "total": 15000, "percent": 0.03 },
    "revenue": { "daily": 1250.50, "effectiveEdge": 0.22 }
  },
  "performance": { ... }
}
```

**Status Codes:**
- 200: System healthy
- 503: System unhealthy or degraded

---

### Admin Statistics (Protected)

#### GET /api/admin/stats
Get platform statistics and revenue data.

**Headers:**
- `x-admin-key`: Admin API key (required in production)

**Query Params:**
- `period`: "daily" | "weekly" | "monthly" | "alltime" (default: "daily")

**Response (200):**
```json
{
  "success": true,
  "timestamp": "2026-01-04T12:00:00Z",
  "period": "daily",
  "revenue": {
    "totalVolume": 50000,
    "totalRevenue": 11000,
    "houseEdgeRevenue": 10000,
    "platformFeeRevenue": 1000,
    "lossRevenue": 30000,
    "effectiveEdge": 0.22,
    "projectedDaily": 11000,
    "projectedMonthly": 330000
  },
  "bets": {
    "total": 500,
    "wins": 200,
    "losses": 300,
    "winRate": 0.4,
    "averageBetSize": 20,
    "averageMultiplier": 2.5,
    "activeBets": 25
  },
  "users": {
    "totalUsers": 150,
    "topRevenueUsers": [...]
  },
  "risk": {
    "totalExposure": 15000,
    "maxExposure": 500000,
    "exposurePercent": 0.03,
    "riskLevel": "low",
    "circuitBreaker": {
      "active": false,
      "reason": null,
      "volatilityLevel": 0.015,
      "allowBetting": true,
      "multiplierAdjustment": 1.0
    }
  },
  "system": {
    "uptime": 3600000,
    "memoryUsage": 45,
    "lastUpdate": "2026-01-04T12:00:00Z"
  }
}
```

**Errors:**
- 401: Invalid or missing admin API key
- 400: Invalid period parameter

#### POST /api/admin/stats
Admin actions for platform control.

**Headers:**
- `x-admin-key`: Admin API key (required)

**Request (Circuit Breaker):**
```json
{
  "action": "circuit_breaker",
  "enable": true,
  "reason": "Maintenance",
  "duration": 300000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Circuit breaker activated"
}
```

---

## Sprint 7: Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INSUFFICIENT_BALANCE` | 402 | User balance too low for bet |
| `BET_LIMIT_EXCEEDED` | 400 | Bet amount exceeds maximum |
| `COOLDOWN_ACTIVE` | 429 | Bet placed too quickly |
| `MAX_ACTIVE_BETS` | 400 | Maximum concurrent bets reached |
| `RISK_CHECK_FAILED` | 400 | Bet rejected by risk management |
| `EXPLOITATION_DETECTED` | 403 | Suspicious activity detected |
| `CIRCUIT_BREAKER_ACTIVE` | 503 | Trading temporarily suspended |
| `PRICE_MANIPULATION` | 400 | Price manipulation detected |
| `ARBITRAGE_DETECTED` | 400 | Arbitrage attempt blocked |
| `PAYOUT_LIMIT_EXCEEDED` | 400 | Exceeds daily payout limit |
| `ACCOUNT_SUSPENDED` | 403 | User account suspended |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Sprint 7: Monetization Logic

### House Edge (20%)
- Applied to all multiplier calculations
- Fair multiplier = 1 / trueProbability
- Display multiplier = fairMultiplier * (1 - 0.20)
- Example: 10% probability = 10x fair = 8x displayed

### Platform Fee (5%)
- Applied to winnings only (not original stake)
- Net payout = grossPayout - (winnings * 0.05)
- Example: $10 bet at 2x = $20 gross - ($10 winnings * 5%) = $19.50 net

### Combined Edge
- Effective platform edge: ~22-25% on all volume
- Revenue = losses + platform fees - payouts

### Risk Controls
1. **Exposure Limits**: Max $500,000 total exposure
2. **Bet Limits**: $1 min, $100 max per bet
3. **Payout Caps**: $10,000 max single, $50,000 daily per user
4. **Circuit Breakers**: Pause trading during >10% volatility
5. **Dynamic Multipliers**: Reduce odds when exposure is high

---

## Sprint 7: Anti-Exploitation

### Bot Detection
- Rapid betting detection (>10 bets/minute)
- Inhuman timing patterns (<150ms between bets)
- Consistent betting patterns analysis

### Win Rate Monitoring
- Flag accounts with >60% win rate over 20+ bets
- Auto-suspend at >75% sustained win rate

### Front-Running Prevention
- 100-500ms random delay on resolutions
- User-specific delay based on suspicion score
- Resolution order randomization

### Arbitrage Prevention
- Block opposing bets that guarantee profit
- Monitor combined position probability

---

## Sprint 7: Price Oracle

### Multi-Source Verification
- Primary: Pyth Network
- Secondary: Switchboard, Jupiter
- Fallback: Birdeye

### Manipulation Detection
- Max 2% deviation between sources
- Detect sudden price jumps (>5% in 1 minute)
- Median price calculation for resistance

### Reliability
- 1 second price cache TTL
- Fallback chain on source failures
- Stale price detection (>30 seconds)

---
