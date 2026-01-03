/**
 * PulseTrade Price Feed Service
 * Handles real-time price data from multiple oracles
 *
 * Primary: Helius (wss://atlas-mainnet.helius-rpc.com)
 * Secondary: Pyth Network
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

export type PriceSource = 'helius' | 'pyth' | 'mock';

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
}

// ============================================
// Price Feed Service
// ============================================

export class PriceService {
  private config: PriceServiceConfig;
  private state: PriceServiceState;
  private historyBuffer: PriceHistoryBuffer;
  private mockGenerator: MockPriceGenerator | null = null;
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
    };
    this.historyBuffer = new PriceHistoryBuffer();
  }

  /**
   * Start the price feed service
   */
  async start(): Promise<void> {
    switch (this.config.source) {
      case 'helius':
        await this.startHeliusFeed();
        break;
      case 'pyth':
        await this.startPythFeed();
        break;
      case 'mock':
      default:
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

    this.updateConnectionState(false);
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
      console.warn('Helius API key not found, falling back to mock feed');
      this.config.source = 'mock';
      return this.startMockFeed();
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
   * Start Pyth Network feed
   */
  private async startPythFeed(): Promise<void> {
    const pythEndpoint =
      this.config.pythEndpoint ||
      process.env.PYTH_ENDPOINT ||
      'wss://hermes.pyth.network/ws';

    try {
      await this.connectWebSocket(pythEndpoint, this.handlePythMessage.bind(this));
    } catch (error) {
      console.error('Failed to connect to Pyth:', error);
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
   * Handle Pyth WebSocket messages
   */
  private handlePythMessage(data: unknown): void {
    // Pyth Network price format
    const message = data as {
      type?: string;
      price_feed?: {
        price?: {
          price: string;
          expo: number;
        };
      };
    };

    if (message.type === 'price_update' && message.price_feed?.price) {
      const { price, expo } = message.price_feed.price;
      const actualPrice = Number(price) * Math.pow(10, expo);
      this.handlePriceUpdate(actualPrice);
    }
  }

  /**
   * Handle a new price update
   */
  private handlePriceUpdate(price: number): void {
    const timestamp = Date.now();

    // Update state
    this.state.currentPrice = price;
    this.state.lastUpdate = timestamp;

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
    priceServiceInstance = new PriceService({
      source: config.source || 'mock',
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

export { PriceHistoryBuffer, MockPriceGenerator };
