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
