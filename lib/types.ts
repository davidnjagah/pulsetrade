/**
 * PulseTrade TypeScript Type Definitions
 * Core types for the betting platform
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  walletAddress: string | null;
  username: string | null;
  avatarUrl: string | null;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  backgroundMusic: boolean;
  soundEffects: boolean;
  slippageTolerance: number; // percentage (0-100)
  showHighLow: boolean;
  doubleTapTrading: boolean;
}

// ============================================
// Bet Types
// ============================================

export type BetStatus = 'active' | 'won' | 'lost' | 'expired';

export interface Bet {
  id: string;
  userId: string;
  amount: number;
  targetPrice: number;
  targetTime: Date;
  multiplier: number;
  placedAt: Date;
  resolvedAt: Date | null;
  status: BetStatus;
  payout: number | null;
  priceAtPlacement: number;
}

export interface BetPlaceRequest {
  amount: number;
  targetPrice: number;
  targetTime: string; // ISO 8601 format
  priceAtPlacement: number;
}

export interface BetPlaceResponse {
  id: string;
  amount: number;
  targetPrice: number;
  targetTime: string;
  multiplier: number;
  priceAtPlacement: number;
  placedAt: string;
  status: BetStatus;
  potentialPayout: number;
}

export interface BetResolveRequest {
  betId: string;
  actualPrice: number;
  resolvedAt: string;
}

export interface BetResolveResponse {
  id: string;
  status: BetStatus;
  payout: number;
  platformFee: number;
}

export interface ActiveBetsResponse {
  bets: Bet[];
  totalExposure: number;
}

// ============================================
// Price Feed Types
// ============================================

export interface PriceData {
  price: number;
  timestamp: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
}

export interface PriceHistoryPoint {
  price: number;
  timestamp: number;
}

export interface PriceUpdate {
  type: 'price';
  price: number;
  timestamp: number;
  volume24h?: number;
}

export interface PriceSubscription {
  type: 'subscribe';
  asset: string;
}

export interface PriceUnsubscription {
  type: 'unsubscribe';
  asset: string;
}

export type PriceMessage = PriceUpdate | PriceSubscription | PriceUnsubscription;

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  message: string;
  createdAt: Date;
}

export interface ChatSendRequest {
  message: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  cursor?: string;
}

// ============================================
// Leaderboard Types
// ============================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  profit: number;
  winRate: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalUsers: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

// ============================================
// User Balance Types
// ============================================

export interface UserBalance {
  balance: number;
  lockedInBets: number;
  available: number;
}

// ============================================
// Multiplier Calculation Types
// ============================================

export interface MultiplierInput {
  currentPrice: number;
  targetPrice: number;
  currentTime: number;
  targetTime: number;
  volatility: number;
}

export interface MultiplierResult {
  multiplier: number;
  trueProbability: number;
  fairMultiplier: number;
  houseEdge: number;
}

export interface PayoutCalculation {
  grossPayout: number;
  platformFee: number;
  netPayout: number;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

// ============================================
// API Error Types
// ============================================

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface APIErrorResponse {
  error: APIError;
}

// ============================================
// WebSocket Types
// ============================================

export type WebSocketMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'price'
  | 'bet_placed'
  | 'bet_resolved'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: unknown;
  error?: string;
}

// ============================================
// Constants
// ============================================

export const BETTING_LIMITS = {
  MIN_BET: 1,
  MAX_BET: 100,
  MAX_ACTIVE_BETS: 20,
  COOLDOWN_MS: 500,
  MAX_SINGLE_PAYOUT: 10000,
  MAX_DAILY_PAYOUT_PER_USER: 50000,
  MAX_PLATFORM_EXPOSURE: 500000,
} as const;

export const FEE_CONFIG = {
  HOUSE_EDGE: 0.20, // 20% house edge
  PLATFORM_FEE_RATE: 0.05, // 5% fee on winnings
} as const;

export const PRICE_FEED_CONFIG = {
  BUFFER_DURATION_MS: 10 * 60 * 1000, // 10 minutes
  UPDATE_INTERVAL_MS: 1000, // 1 second
  RECONNECT_DELAY_MS: 3000, // 3 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;

// ============================================
// Database Row Types (for Supabase)
// ============================================

export interface UserRow {
  id: string;
  wallet_address: string | null;
  username: string | null;
  avatar_url: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface BetRow {
  id: string;
  user_id: string;
  amount: number;
  target_price: number;
  target_time: string;
  multiplier: number;
  placed_at: string;
  resolved_at: string | null;
  status: BetStatus;
  payout: number | null;
  price_at_placement: number;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface UserSettingsRow {
  user_id: string;
  background_music: boolean;
  sound_effects: boolean;
  slippage_tolerance: number;
  show_high_low: boolean;
  double_tap_trading: boolean;
}

export interface LeaderboardRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  wins: number;
  losses: number;
  profit: number;
}
