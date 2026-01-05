/**
 * PulseTrade SOL Price API
 * Fetches real SOL/USD prices from CoinGecko
 *
 * GET /api/price/sol
 * Returns: { price: number, change24h: number, timestamp: number }
 */

import { NextResponse } from 'next/server';

// ============================================
// Types
// ============================================

interface CoinGeckoResponse {
  solana: {
    usd: number;
    usd_24h_change: number;
  };
}

interface PriceCache {
  price: number;
  change24h: number;
  timestamp: number;
}

// ============================================
// Cache Configuration
// ============================================

const CACHE_DURATION_MS = 5000; // 5 seconds cache
let priceCache: PriceCache | null = null;

// ============================================
// CoinGecko API
// ============================================

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true';

async function fetchCoinGeckoPrice(): Promise<PriceCache> {
  const apiKey = process.env.COINGECKO_API_KEY;

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  // Add API key if available (for higher rate limits)
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
  }

  const response = await fetch(COINGECKO_API_URL, {
    headers,
    next: { revalidate: 5 }, // Next.js cache revalidation
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data: CoinGeckoResponse = await response.json();

  if (!data.solana || typeof data.solana.usd !== 'number') {
    throw new Error('Invalid response from CoinGecko');
  }

  return {
    price: data.solana.usd,
    change24h: data.solana.usd_24h_change || 0,
    timestamp: Date.now(),
  };
}

// ============================================
// Helius Fallback (if API key provided)
// ============================================

async function fetchHeliusPrice(): Promise<PriceCache | null> {
  const apiKey = process.env.HELIUS_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    // Helius DAS API for token prices
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'sol-price',
        method: 'getAsset',
        params: {
          id: 'So11111111111111111111111111111111111111112', // Wrapped SOL mint
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Helius may return price info in token metadata
    if (data.result?.token_info?.price_info?.price_per_token) {
      return {
        price: data.result.token_info.price_info.price_per_token,
        change24h: 0, // Helius doesn't provide 24h change in this endpoint
        timestamp: Date.now(),
      };
    }

    return null;
  } catch (error) {
    console.error('[Price API] Helius fallback failed:', error);
    return null;
  }
}

// ============================================
// Mock Price (last fallback)
// ============================================

function getMockPrice(): PriceCache {
  // Generate a realistic mock price around $200
  const basePrice = 200;
  const variation = (Math.random() - 0.5) * 10; // +/- $5

  return {
    price: Number((basePrice + variation).toFixed(2)),
    change24h: (Math.random() - 0.5) * 10, // +/- 5%
    timestamp: Date.now(),
  };
}

// ============================================
// GET Handler
// ============================================

export async function GET() {
  try {
    // Check if mock prices are enabled
    const useMockPrices = process.env.NEXT_PUBLIC_USE_MOCK_PRICES === 'true';

    if (useMockPrices) {
      const mockData = getMockPrice();
      return NextResponse.json(mockData);
    }

    // Check cache
    if (priceCache && (Date.now() - priceCache.timestamp) < CACHE_DURATION_MS) {
      return NextResponse.json(priceCache);
    }

    // Try CoinGecko first (primary source)
    try {
      const coinGeckoData = await fetchCoinGeckoPrice();
      priceCache = coinGeckoData;

      return NextResponse.json(coinGeckoData);
    } catch (coinGeckoError) {
      console.warn('[Price API] CoinGecko failed, trying fallbacks:', coinGeckoError);

      // Try Helius as fallback
      const heliusData = await fetchHeliusPrice();

      if (heliusData) {
        priceCache = heliusData;
        return NextResponse.json(heliusData);
      }

      // Return cached data if available (even if stale)
      if (priceCache) {
        console.warn('[Price API] Using stale cache data');
        return NextResponse.json({
          ...priceCache,
          stale: true,
        });
      }

      // Last resort: mock price
      console.warn('[Price API] All sources failed, using mock price');
      const mockData = getMockPrice();
      return NextResponse.json({
        ...mockData,
        mock: true,
      });
    }
  } catch (error) {
    console.error('[Price API] Unexpected error:', error);

    // Return mock price on any error
    const mockData = getMockPrice();
    return NextResponse.json({
      ...mockData,
      error: true,
    });
  }
}

// ============================================
// OPTIONS Handler (CORS)
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
