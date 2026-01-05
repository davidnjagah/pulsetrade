/**
 * PulseTrade Price Feed Service
 * Handles real-time price data from multiple oracles
 *
 * Primary: CoinGecko API via /api/price/sol
 * Secondary: Helius (if API key provided)
 * Fallback: Mock data for development
 */

import {
  PriceData,
  PriceHistoryPoint,
  PriceUpdate,
  PRICE_FEED_CONFIG,
} from './types';

// ============================================
// Types
// ============================================

export type PriceSource = 'coingecko' | 'helius' | 'mock';

export interface PriceServiceConfig {
  source: PriceSource;
  heliusApiKey?: string;
  pythEndpoint?: string;
  asset: string;
  onPriceUpdate: (update: PriceUpdate) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface PriceServiceState {
  connected: boolean;
  currentPrice: number | null;
  lastUpdate: number | null;
  source: PriceSource;
  change24h: number | null;
}

interface APIPrice {
  price: number;
  change24h: number;
  timestamp: number;
  stale?: boolean;
  mock?: boolean;
  error?: boolean;
}

// ============================================
// Price History Buffer
// ============================================

class PriceHistoryBuffer {
  private history: PriceHistoryPoint[] = [];
  private maxDurationMs: number;

  constructor(maxDurationMs: number = PRICE_FEED_CONFIG.BUFFER_DURATION_MS) {
    this.maxDurationMs = maxDurationMs;
  }

  /**
   * Add a new price point to the buffer
   */
  add(price: number, timestamp: number = Date.now()): void {
    this.history.push({ price, timestamp });
    this.cleanup();
  }

  /**
   * Remove old entries beyond the buffer duration
   */
  private cleanup(): void {
    const cutoffTime = Date.now() - this.maxDurationMs;
    this.history = this.history.filter((point) => point.timestamp >= cutoffTime);
  }

  /**
   * Get all history points
   */
  getHistory(): PriceHistoryPoint[] {
    this.cleanup();
    return [...this.history];
  }

  /**
   * Get the most recent price
   */
  getLatestPrice(): PriceHistoryPoint | null {
    if (this.history.length === 0) return null;
    return this.history[this.history.length - 1];
  }

  /**
   * Get price at a specific time (or closest before)
   */
  getPriceAt(timestamp: number): PriceHistoryPoint | null {
    const point = this.history
      .filter((p) => p.timestamp <= timestamp)
      .pop();
    return point || null;
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  getVolatility(): number {
    if (this.history.length < 2) return 0;

    const prices = this.history.map((p) => p.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;

    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Get high/low for the buffer period
   */
  getHighLow(): { high: number; low: number } | null {
    if (this.history.length === 0) return null;

    const prices = this.history.map((p) => p.price);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.history = [];
  }

  /**
   * Get buffer size
   */
  get length(): number {
    return this.history.length;
  }
}

// ============================================
// Mock Price Generator
// ============================================

class MockPriceGenerator {
  private basePrice: number;
  private volatility: number;
  private trend: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(basePrice: number = 200, volatility: number = 0.001) {
    this.basePrice = basePrice;
    this.volatility = volatility;
    this.trend = 0;
  }

  /**
   * Generate a realistic mock price update
   */
  generatePrice(): number {
    // Random walk with mean reversion
    const randomChange = (Math.random() - 0.5) * 2 * this.volatility * this.basePrice;

    // Add trend component (changes occasionally)
    if (Math.random() < 0.05) {
      this.trend = (Math.random() - 0.5) * 0.0002 * this.basePrice;
    }

    // Apply change with momentum
    this.basePrice += randomChange + this.trend;

    // Keep price reasonable (SOL-like range)
    this.basePrice = Math.max(50, Math.min(500, this.basePrice));

    return Number(this.basePrice.toFixed(4));
  }

  /**
   * Start generating prices at interval
   */
  start(callback: (price: number) => void, intervalMs: number = 1000): void {
    this.stop();
    this.intervalId = setInterval(() => {
      callback(this.generatePrice());
    }, intervalMs);
  }

  /**
   * Stop generating prices
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Set base price (used when transitioning from real prices)
   */
  setBasePrice(price: number): void {
    this.basePrice = price;
  }
}

// ============================================
// Real Price Fetcher
// ============================================

class RealPriceFetcher {
  private intervalId: NodeJS.Timeout | null = null;
  private lastRealPrice: number | null = null;
  private lastFetchTime: number = 0;
  private fetchIntervalMs: number = 5000; // Fetch from API every 5 seconds
  private updateIntervalMs: number = 1500; // Update UI every 1.5 seconds

  /**
   * Fetch price from the API endpoint
   */
  async fetchPrice(): Promise<APIPrice | null> {
    try {
      const response = await fetch('/api/price/sol', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: APIPrice = await response.json();
      this.lastRealPrice = data.price;
      this.lastFetchTime = Date.now();

      return data;
    } catch (error) {
      console.error('[PriceService] Failed to fetch price:', error);
      return null;
    }
  }

  /**
   * Add small random variation to price for real-time feel
   * Variation: 0.01% to 0.05% of price
   */
  private addVariation(price: number): number {
    const variationPercent = 0.0001 + Math.random() * 0.0004; // 0.01% to 0.05%
    const direction = Math.random() > 0.5 ? 1 : -1;
    const variation = price * variationPercent * direction;

    return Number((price + variation).toFixed(4));
  }

  /**
   * Start fetching prices at interval
   */
  start(
    callback: (price: number, change24h?: number) => void,
    onError?: (error: Error) => void
  ): void {
    this.stop();

    // Initial fetch
    this.fetchPrice().then((data) => {
      if (data) {
        callback(data.price, data.change24h);
      }
    });

    // Set up interval for updates
    this.intervalId = setInterval(async () => {
      const now = Date.now();

      // Fetch from API every 5 seconds
      if (now - this.lastFetchTime >= this.fetchIntervalMs) {
        const data = await this.fetchPrice();

        if (data) {
          callback(data.price, data.change24h);
        } else if (this.lastRealPrice) {
          // If fetch failed but we have a previous price, add variation
          const variedPrice = this.addVariation(this.lastRealPrice);
          callback(variedPrice);
        } else {
          onError?.(new Error('Failed to fetch price'));
        }
      } else if (this.lastRealPrice) {
        // Between API fetches, add small variations for real-time feel
        const variedPrice = this.addVariation(this.lastRealPrice);
        callback(variedPrice);
      }
    }, this.updateIntervalMs);
  }

  /**
   * Stop fetching prices
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get last known real price
   */
  getLastPrice(): number | null {
    return this.lastRealPrice;
  }
}

// ============================================
// Price Feed Service
// ============================================

export class PriceService {
  private config: PriceServiceConfig;
  private state: PriceServiceState;
  private historyBuffer: PriceHistoryBuffer;
  private mockGenerator: MockPriceGenerator | null = null;
  private realFetcher: RealPriceFetcher | null = null;
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: PriceServiceConfig) {
    this.config = config;
    this.state = {
      connected: false,
      currentPrice: null,
      lastUpdate: null,
      source: config.source,
      change24h: null,
    };
    this.historyBuffer = new PriceHistoryBuffer();
  }

  /**
   * Start the price feed service
   */
  async start(): Promise<void> {
    // Check if mock prices are enabled via environment
    const useMockPrices = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_USE_MOCK_PRICES === 'true'
      : false;

    if (useMockPrices || this.config.source === 'mock') {
      this.startMockFeed();
      return;
    }

    // Use real price feed
    switch (this.config.source) {
      case 'coingecko':
        await this.startCoinGeckoFeed();
        break;
      case 'helius':
        await this.startHeliusFeed();
        break;
      default:
        // Fallback to mock feed for any other source
        this.startMockFeed();
        break;
    }
  }

  /**
   * Stop the price feed service
   */
  stop(): void {
    this.stopReconnect();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.mockGenerator) {
      this.mockGenerator.stop();
      this.mockGenerator = null;
    }

    if (this.realFetcher) {
      this.realFetcher.stop();
      this.realFetcher = null;
    }

    this.updateConnectionState(false);
  }

  /**
   * Start CoinGecko price feed (via API route)
   */
  private async startCoinGeckoFeed(): Promise<void> {
    this.realFetcher = new RealPriceFetcher();

    this.realFetcher.start(
      (price, change24h) => {
        this.handlePriceUpdate(price, change24h);
      },
      (error) => {
        console.error('[PriceService] CoinGecko feed error:', error);
        this.handleError(error);

        // Fall back to mock if real feed fails consistently
        if (this.reconnectAttempts >= PRICE_FEED_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          console.log('[PriceService] Falling back to mock feed');
          this.config.source = 'mock';
          this.startMockFeed();
        }
      }
    );

    this.updateConnectionState(true);
  }

  /**
   * Start mock price feed (for development)
   */
  private startMockFeed(): void {
    this.mockGenerator = new MockPriceGenerator(200, 0.002);

    // Generate initial price
    const initialPrice = this.mockGenerator.generatePrice();
    this.handlePriceUpdate(initialPrice);

    // Start continuous updates
    this.mockGenerator.start((price) => {
      this.handlePriceUpdate(price);
    }, PRICE_FEED_CONFIG.UPDATE_INTERVAL_MS);

    this.updateConnectionState(true);
  }

  /**
   * Start Helius WebSocket feed
   */
  private async startHeliusFeed(): Promise<void> {
    const apiKey = this.config.heliusApiKey || process.env.HELIUS_API_KEY;

    if (!apiKey) {
      console.warn('Helius API key not found, falling back to CoinGecko');
      this.config.source = 'coingecko';
      return this.startCoinGeckoFeed();
    }

    const wsUrl = `wss://atlas-mainnet.helius-rpc.com/?api-key=${apiKey}`;

    try {
      await this.connectWebSocket(wsUrl, this.handleHeliusMessage.bind(this));
    } catch (error) {
      console.error('Failed to connect to Helius:', error);
      this.handleError(error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Connect to WebSocket endpoint
   */
  private connectWebSocket(
    url: string,
    messageHandler: (data: unknown) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In browser environment
        if (typeof window !== 'undefined') {
          this.ws = new WebSocket(url);
        } else {
          // Server-side - would need ws package
          console.log('WebSocket connections should be handled client-side');
          reject(new Error('Server-side WebSocket not implemented'));
          return;
        }

        this.ws.onopen = () => {
          console.log(`Connected to price feed: ${this.config.source}`);
          this.reconnectAttempts = 0;
          this.updateConnectionState(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            messageHandler(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.handleError(new Error('WebSocket connection error'));
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.updateConnectionState(false);
          this.scheduleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle Helius WebSocket messages
   */
  private handleHeliusMessage(data: unknown): void {
    // Helius message format for price data
    // This is a simplified handler - actual format depends on subscription type
    const message = data as { price?: number; slot?: number };

    if (message.price) {
      this.handlePriceUpdate(message.price);
    }
  }

  /**
   * Handle a new price update
   */
  private handlePriceUpdate(price: number, change24h?: number): void {
    const timestamp = Date.now();

    // Update state
    this.state.currentPrice = price;
    this.state.lastUpdate = timestamp;
    if (change24h !== undefined) {
      this.state.change24h = change24h;
    }

    // Add to history buffer
    this.historyBuffer.add(price, timestamp);

    // Emit update
    const update: PriceUpdate = {
      type: 'price',
      price,
      timestamp,
    };

    this.config.onPriceUpdate(update);
  }

  /**
   * Update connection state
   */
  private updateConnectionState(connected: boolean): void {
    this.state.connected = connected;
    this.config.onConnectionChange?.(connected);
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.config.onError?.(error);
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= PRICE_FEED_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnect attempts reached, falling back to mock');
      this.config.source = 'mock';
      this.startMockFeed();
      return;
    }

    this.stopReconnect();
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectAttempts++;
      console.log(
        `Reconnecting... (attempt ${this.reconnectAttempts}/${PRICE_FEED_CONFIG.MAX_RECONNECT_ATTEMPTS})`
      );
      await this.start();
    }, PRICE_FEED_CONFIG.RECONNECT_DELAY_MS);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ============================================
  // Public Getters
  // ============================================

  /**
   * Get current service state
   */
  getState(): PriceServiceState {
    return { ...this.state };
  }

  /**
   * Get current price
   */
  getCurrentPrice(): number | null {
    return this.state.currentPrice;
  }

  /**
   * Get 24h change percentage
   */
  get24hChange(): number | null {
    return this.state.change24h;
  }

  /**
   * Get price history
   */
  getPriceHistory(): PriceHistoryPoint[] {
    return this.historyBuffer.getHistory();
  }

  /**
   * Get price at specific timestamp
   */
  getPriceAt(timestamp: number): PriceHistoryPoint | null {
    return this.historyBuffer.getPriceAt(timestamp);
  }

  /**
   * Get current volatility
   */
  getVolatility(): number {
    return this.historyBuffer.getVolatility();
  }

  /**
   * Get high/low for buffer period
   */
  getHighLow(): { high: number; low: number } | null {
    return this.historyBuffer.getHighLow();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.connected;
  }
}

// ============================================
// Singleton Instance
// ============================================

let priceServiceInstance: PriceService | null = null;

/**
 * Get or create the price service singleton
 */
export function getPriceService(config?: Partial<PriceServiceConfig>): PriceService {
  if (!priceServiceInstance && config?.onPriceUpdate) {
    // Determine default source based on environment
    const useMockPrices = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_USE_MOCK_PRICES === 'true'
      : false;

    const defaultSource: PriceSource = useMockPrices ? 'mock' : 'coingecko';

    priceServiceInstance = new PriceService({
      source: config.source || defaultSource,
      asset: config.asset || 'SOL',
      onPriceUpdate: config.onPriceUpdate,
      onError: config.onError,
      onConnectionChange: config.onConnectionChange,
      heliusApiKey: config.heliusApiKey,
      pythEndpoint: config.pythEndpoint,
    });
  }

  if (!priceServiceInstance) {
    throw new Error('Price service not initialized. Please provide config first.');
  }

  return priceServiceInstance;
}

/**
 * Reset the price service singleton
 */
export function resetPriceService(): void {
  if (priceServiceInstance) {
    priceServiceInstance.stop();
    priceServiceInstance = null;
  }
}

// ============================================
// Export Types
// ============================================

export { PriceHistoryBuffer, MockPriceGenerator, RealPriceFetcher };
