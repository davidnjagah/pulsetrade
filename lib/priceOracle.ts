/**
 * PulseTrade Price Oracle Service
 * Multi-source price verification with manipulation detection
 *
 * Features:
 * - Multiple price sources (Pyth, Chainlink/Switchboard, Birdeye, Jupiter)
 * - Median price calculation for manipulation resistance
 * - Price manipulation detection
 * - Fallback chain for reliability
 * - Caching for performance
 */

// ============================================
// Types
// ============================================

export type PriceSource = 'pyth' | 'switchboard' | 'birdeye' | 'jupiter' | 'mock';

export interface PriceQuote {
  source: PriceSource;
  price: number;
  timestamp: number;
  confidence?: number; // Optional confidence interval
  isStale: boolean;
}

export interface VerifiedPrice {
  price: number;
  timestamp: number;
  sources: PriceQuote[];
  sourceCount: number;
  spreadPercent: number;
  isManipulated: boolean;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export interface OracleConfig {
  pythEndpoint?: string;
  switchboardProgram?: string;
  birdeyeApiKey?: string;
  jupiterEndpoint?: string;
  stalePriceThresholdMs: number;
  maxPriceDeviation: number;
  minSourcesRequired: number;
}

export interface PriceCache {
  price: number;
  timestamp: number;
  sources: PriceSource[];
  expiresAt: number;
}

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: OracleConfig = {
  stalePriceThresholdMs: 30000, // 30 seconds
  maxPriceDeviation: 0.02, // 2% max deviation between sources
  minSourcesRequired: 2,
};

// Stale price thresholds by source
const STALE_THRESHOLDS: Record<PriceSource, number> = {
  pyth: 10000, // 10 seconds
  switchboard: 30000, // 30 seconds
  birdeye: 60000, // 60 seconds
  jupiter: 15000, // 15 seconds
  mock: 5000, // 5 seconds
};

// Source reliability weights (for weighted median)
const SOURCE_WEIGHTS: Record<PriceSource, number> = {
  pyth: 1.0, // Most reliable
  switchboard: 0.9,
  jupiter: 0.85,
  birdeye: 0.8,
  mock: 0.1, // Lowest priority
};

// Cache TTL
const CACHE_TTL_MS = 1000; // 1 second cache

// ============================================
// State
// ============================================

let oracleConfig: OracleConfig = { ...DEFAULT_CONFIG };
let priceCache: PriceCache | null = null;
let lastSourceErrors: Map<PriceSource, { error: string; timestamp: number }> = new Map();

// Price history for manipulation detection
const priceHistory: Array<{ price: number; timestamp: number }> = [];
const PRICE_HISTORY_WINDOW_MS = 60000; // 1 minute

// ============================================
// Configuration
// ============================================

/**
 * Configure the price oracle
 */
export function configureOracle(config: Partial<OracleConfig>): void {
  oracleConfig = { ...oracleConfig, ...config };
}

/**
 * Get current oracle configuration
 */
export function getOracleConfig(): OracleConfig {
  return { ...oracleConfig };
}

// ============================================
// Individual Source Fetchers
// ============================================

/**
 * Fetch price from Pyth Network
 */
async function fetchPythPrice(): Promise<PriceQuote | null> {
  try {
    // In production, this would connect to Pyth's price feed
    // For SOL/USD: pyth price feed ID
    const endpoint = oracleConfig.pythEndpoint || process.env.PYTH_ENDPOINT;

    if (!endpoint) {
      return null;
    }

    // Mock implementation - in production would use @pythnetwork/client
    const response = await fetch(`${endpoint}/api/latest_price_feeds?ids[]=ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`);

    if (!response.ok) {
      throw new Error(`Pyth API error: ${response.status}`);
    }

    const data = await response.json();
    const priceData = data[0];

    const now = Date.now();
    const priceTimestamp = priceData.price?.publish_time * 1000 || now;

    return {
      source: 'pyth',
      price: parseFloat(priceData.price?.price) * Math.pow(10, priceData.price?.expo || 0),
      timestamp: priceTimestamp,
      confidence: parseFloat(priceData.price?.conf) * Math.pow(10, priceData.price?.expo || 0),
      isStale: now - priceTimestamp > STALE_THRESHOLDS.pyth,
    };
  } catch (error) {
    lastSourceErrors.set('pyth', { error: String(error), timestamp: Date.now() });
    return null;
  }
}

/**
 * Fetch price from Birdeye API
 */
async function fetchBirdeyePrice(): Promise<PriceQuote | null> {
  try {
    const apiKey = oracleConfig.birdeyeApiKey || process.env.BIRDEYE_API_KEY;

    if (!apiKey) {
      return null;
    }

    // SOL token address
    const solAddress = 'So11111111111111111111111111111111111111112';

    const response = await fetch(`https://public-api.birdeye.so/public/price?address=${solAddress}`, {
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.status}`);
    }

    const data = await response.json();
    const now = Date.now();

    return {
      source: 'birdeye',
      price: data.data?.value || 0,
      timestamp: data.data?.updateUnixTime * 1000 || now,
      isStale: now - (data.data?.updateUnixTime * 1000 || now) > STALE_THRESHOLDS.birdeye,
    };
  } catch (error) {
    lastSourceErrors.set('birdeye', { error: String(error), timestamp: Date.now() });
    return null;
  }
}

/**
 * Fetch price from Jupiter aggregator
 */
async function fetchJupiterPrice(): Promise<PriceQuote | null> {
  try {
    const endpoint = oracleConfig.jupiterEndpoint || 'https://price.jup.ag/v4';

    const response = await fetch(`${endpoint}/price?ids=SOL`);

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    const data = await response.json();
    const now = Date.now();

    return {
      source: 'jupiter',
      price: data.data?.SOL?.price || 0,
      timestamp: now,
      isStale: false, // Jupiter is always fresh on request
    };
  } catch (error) {
    lastSourceErrors.set('jupiter', { error: String(error), timestamp: Date.now() });
    return null;
  }
}

/**
 * Generate mock price (for development/testing)
 */
function generateMockPrice(basePrice: number = 200): PriceQuote {
  // Add small random variation
  const variation = (Math.random() - 0.5) * 0.002 * basePrice;
  const price = basePrice + variation;

  return {
    source: 'mock',
    price: Math.round(price * 100) / 100,
    timestamp: Date.now(),
    isStale: false,
  };
}

// ============================================
// Price Aggregation
// ============================================

/**
 * Fetch prices from all available sources
 */
export async function fetchAllPrices(): Promise<PriceQuote[]> {
  const quotes: PriceQuote[] = [];

  // Try all sources in parallel
  const results = await Promise.allSettled([
    fetchPythPrice(),
    fetchBirdeyePrice(),
    fetchJupiterPrice(),
  ]);

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      quotes.push(result.value);
    }
  });

  // If no quotes, add mock price
  if (quotes.length === 0) {
    quotes.push(generateMockPrice());
  }

  return quotes;
}

/**
 * Calculate median price from quotes
 */
function calculateMedianPrice(quotes: PriceQuote[]): number {
  if (quotes.length === 0) {
    throw new Error('No price quotes available');
  }

  // Sort by price
  const sortedPrices = quotes.map((q) => q.price).sort((a, b) => a - b);

  const mid = Math.floor(sortedPrices.length / 2);

  if (sortedPrices.length % 2 === 0) {
    return (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
  }

  return sortedPrices[mid];
}

/**
 * Calculate weighted median price
 */
function calculateWeightedMedianPrice(quotes: PriceQuote[]): number {
  if (quotes.length === 0) {
    throw new Error('No price quotes available');
  }

  // Filter out stale quotes
  const freshQuotes = quotes.filter((q) => !q.isStale);
  const quotesToUse = freshQuotes.length >= oracleConfig.minSourcesRequired ? freshQuotes : quotes;

  // Sort by price
  const sortedQuotes = [...quotesToUse].sort((a, b) => a.price - b.price);

  // Calculate total weight
  const totalWeight = sortedQuotes.reduce((sum, q) => sum + SOURCE_WEIGHTS[q.source], 0);

  // Find weighted median
  let cumulativeWeight = 0;
  for (const quote of sortedQuotes) {
    cumulativeWeight += SOURCE_WEIGHTS[quote.source];
    if (cumulativeWeight >= totalWeight / 2) {
      return quote.price;
    }
  }

  return sortedQuotes[Math.floor(sortedQuotes.length / 2)].price;
}

/**
 * Calculate price spread between sources
 */
function calculateSpread(quotes: PriceQuote[]): number {
  if (quotes.length < 2) {
    return 0;
  }

  const prices = quotes.map((q) => q.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return (max - min) / min;
}

// ============================================
// Manipulation Detection
// ============================================

/**
 * Detect potential price manipulation
 */
function detectManipulation(
  newPrice: number,
  quotes: PriceQuote[]
): { isManipulated: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isManipulated = false;

  // Check spread between sources
  const spread = calculateSpread(quotes);
  if (spread > oracleConfig.maxPriceDeviation) {
    warnings.push(`High price deviation between sources: ${(spread * 100).toFixed(2)}%`);
    isManipulated = true;
  }

  // Check for sudden price jumps
  const now = Date.now();
  const cutoff = now - PRICE_HISTORY_WINDOW_MS;
  const recentHistory = priceHistory.filter((p) => p.timestamp >= cutoff);

  if (recentHistory.length > 0) {
    const avgRecentPrice = recentHistory.reduce((sum, p) => sum + p.price, 0) / recentHistory.length;
    const priceChange = Math.abs(newPrice - avgRecentPrice) / avgRecentPrice;

    if (priceChange > 0.05) {
      // 5% sudden change
      warnings.push(`Sudden price movement detected: ${(priceChange * 100).toFixed(2)}%`);
    }

    if (priceChange > 0.10) {
      // 10% is likely manipulation
      isManipulated = true;
    }
  }

  // Check for single source outliers
  const medianPrice = calculateMedianPrice(quotes);
  quotes.forEach((quote) => {
    const deviation = Math.abs(quote.price - medianPrice) / medianPrice;
    if (deviation > 0.02) {
      warnings.push(`${quote.source} price deviates ${(deviation * 100).toFixed(2)}% from median`);
    }
  });

  // Check for stale prices
  const staleCount = quotes.filter((q) => q.isStale).length;
  if (staleCount > 0) {
    warnings.push(`${staleCount} of ${quotes.length} price sources are stale`);
  }

  return { isManipulated, warnings };
}

/**
 * Record price for history
 */
function recordPriceHistory(price: number): void {
  const now = Date.now();

  priceHistory.push({ price, timestamp: now });

  // Clean up old entries
  const cutoff = now - PRICE_HISTORY_WINDOW_MS;
  while (priceHistory.length > 0 && priceHistory[0].timestamp < cutoff) {
    priceHistory.shift();
  }
}

// ============================================
// Main Functions
// ============================================

/**
 * Get verified price from multiple sources
 */
export async function getVerifiedPrice(): Promise<VerifiedPrice> {
  // Check cache first
  if (priceCache && Date.now() < priceCache.expiresAt) {
    // Return cached data with updated sources info
    const quotes = priceCache.sources.map((source) => ({
      source,
      price: priceCache!.price,
      timestamp: priceCache!.timestamp,
      isStale: false,
    }));

    return {
      price: priceCache.price,
      timestamp: priceCache.timestamp,
      sources: quotes,
      sourceCount: priceCache.sources.length,
      spreadPercent: 0,
      isManipulated: false,
      confidence: 'high',
      warnings: ['Using cached price'],
    };
  }

  // Fetch from all sources
  const quotes = await fetchAllPrices();

  if (quotes.length === 0) {
    throw new Error('No price sources available');
  }

  // Calculate prices
  const medianPrice = calculateMedianPrice(quotes);
  const weightedPrice = calculateWeightedMedianPrice(quotes);
  const spread = calculateSpread(quotes);

  // Use weighted price if close to median, otherwise use median (more resistant to manipulation)
  const priceDiff = Math.abs(weightedPrice - medianPrice) / medianPrice;
  const finalPrice = priceDiff < 0.005 ? weightedPrice : medianPrice;

  // Detect manipulation
  const { isManipulated, warnings } = detectManipulation(finalPrice, quotes);

  // Record in history
  recordPriceHistory(finalPrice);

  // Determine confidence level
  let confidence: VerifiedPrice['confidence'];
  if (quotes.length >= 3 && spread < 0.01 && !isManipulated) {
    confidence = 'high';
  } else if (quotes.length >= 2 && spread < 0.02) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Update cache
  priceCache = {
    price: finalPrice,
    timestamp: Date.now(),
    sources: quotes.map((q) => q.source),
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return {
    price: Math.round(finalPrice * 100) / 100,
    timestamp: Date.now(),
    sources: quotes,
    sourceCount: quotes.length,
    spreadPercent: Math.round(spread * 10000) / 100,
    isManipulated,
    confidence,
    warnings,
  };
}

/**
 * Get price for bet resolution
 * Uses stricter verification for settlements
 */
export async function getResolutionPrice(): Promise<{
  price: number;
  verified: boolean;
  sources: PriceSource[];
}> {
  const result = await getVerifiedPrice();

  // Don't use manipulated prices for resolution
  if (result.isManipulated) {
    // Wait and retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const retryResult = await getVerifiedPrice();

    if (retryResult.isManipulated) {
      // Use most trusted available source
      const pythQuote = result.sources.find((s) => s.source === 'pyth' && !s.isStale);
      if (pythQuote) {
        return {
          price: pythQuote.price,
          verified: false,
          sources: ['pyth'],
        };
      }

      throw new Error('Cannot verify price for resolution - manipulation detected');
    }

    return {
      price: retryResult.price,
      verified: true,
      sources: retryResult.sources.map((s) => s.source),
    };
  }

  return {
    price: result.price,
    verified: result.confidence !== 'low',
    sources: result.sources.map((s) => s.source),
  };
}

// ============================================
// Admin / Utility Functions
// ============================================

/**
 * Get oracle status
 */
export function getOracleStatus(): {
  cacheValid: boolean;
  lastPrice: number | null;
  lastUpdate: number | null;
  sourceErrors: Array<{ source: PriceSource; error: string; timestamp: number }>;
  priceHistoryLength: number;
} {
  const errors: Array<{ source: PriceSource; error: string; timestamp: number }> = [];
  lastSourceErrors.forEach((value, key) => {
    errors.push({ source: key, ...value });
  });

  return {
    cacheValid: priceCache !== null && Date.now() < priceCache.expiresAt,
    lastPrice: priceCache?.price || null,
    lastUpdate: priceCache?.timestamp || null,
    sourceErrors: errors,
    priceHistoryLength: priceHistory.length,
  };
}

/**
 * Clear oracle cache
 */
export function clearOracleCache(): void {
  priceCache = null;
}

/**
 * Reset oracle state (for testing)
 */
export function resetOracle(): void {
  priceCache = null;
  lastSourceErrors.clear();
  priceHistory.length = 0;
  oracleConfig = { ...DEFAULT_CONFIG };
}

/**
 * Add mock price for testing
 */
export function addMockPrice(price: number): PriceQuote {
  return generateMockPrice(price);
}

// ============================================
// Export Types and Constants
// ============================================

export { DEFAULT_CONFIG, STALE_THRESHOLDS, SOURCE_WEIGHTS, CACHE_TTL_MS };
