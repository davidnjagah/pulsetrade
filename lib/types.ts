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

export type ChatMessageType = 'message' | 'bet_notification';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  message: string;
  type: ChatMessageType;
  createdAt: Date;
}

export interface BetNotification {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  type: 'bet_notification';
  notificationType: 'placed' | 'won' | 'lost';
  amount: number;
  multiplier: number;
  payout?: number;
  targetPrice?: number;
  createdAt: Date;
}

export type ChatItem = ChatMessage | BetNotification;

export interface ChatSendRequest {
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
}

export interface ChatMessagesResponse {
  messages: ChatItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface ChatStreamEvent {
  type: 'message' | 'bet_notification' | 'heartbeat' | 'connected';
  data?: ChatItem;
  timestamp: number;
}

// ============================================
// Leaderboard Types
// ============================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  walletAddress: string;
  wins: number;
  losses: number;
  profit: number;
  winRate: number;
  totalBets: number;
  streak: number; // Current win/loss streak (positive = wins, negative = losses)
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalUsers: number;
  period: LeaderboardPeriod;
  generatedAt: string;
  userRank?: LeaderboardEntry | null; // Requesting user's rank if authenticated
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

// ============================================
// User Profile Types
// ============================================

export interface UserProfile {
  id: string;
  walletAddress: string;
  username: string | null;
  avatarUrl: string | null;
  balance: number;
  createdAt: string;
  isDemo: boolean;
  rank?: number;
  stats: UserStats;
}

export interface UserStats {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalWagered: number;
  totalPayout: number;
  profit: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number; // Positive = win streak, negative = loss streak
  longestWinStreak: number;
  longestLossStreak: number;
  averageBetSize: number;
  averageMultiplier: number;
  profitByPeriod: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface BetHistoryItem {
  id: string;
  amount: number;
  targetPrice: number;
  priceAtPlacement: number;
  multiplier: number;
  status: BetStatus;
  placedAt: string;
  resolvedAt: string | null;
  payout: number | null;
  profit: number; // payout - amount (negative if lost)
  targetTime: string;
}

export interface BetHistoryResponse {
  history: BetHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface UserProfileResponse {
  profile: UserProfile;
  recentBets: BetHistoryItem[];
}

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

// ============================================
// Authentication Types
// ============================================

export type WalletType = 'phantom' | 'solflare' | 'demo';

export interface Session {
  id: string;
  userId: string;
  walletAddress: string;
  walletType: WalletType;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

export interface SessionUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  balance: number;
  isDemo: boolean;
}

export interface SessionValidation {
  valid: boolean;
  error?: string;
  session?: Session;
  user?: SessionUser;
}

export interface AuthConnectRequest {
  walletAddress: string;
  walletType: WalletType;
  signature?: string; // Optional signature for wallet verification
}

export interface AuthConnectResponse {
  success: boolean;
  sessionToken: string;
  expiresAt: string;
  user: {
    id: string;
    walletAddress: string;
    displayName: string;
    avatarUrl: string | null;
    balance: number;
    isDemo: boolean;
    isNewUser: boolean;
  };
}

export interface AuthDisconnectRequest {
  sessionToken?: string; // Optional, can also come from header
}

export interface AuthDisconnectResponse {
  success: boolean;
  message: string;
}

export interface AuthSessionResponse {
  valid: boolean;
  user?: {
    id: string;
    walletAddress: string;
    displayName: string;
    avatarUrl: string | null;
    balance: number;
    isDemo: boolean;
  };
  session?: {
    createdAt: string;
    expiresAt: string;
    lastActivityAt: string;
  };
  error?: string;
}

export interface AuthenticatedRequest {
  userId: string;
  walletAddress: string;
  session: Session;
  isDemo: boolean;
}
