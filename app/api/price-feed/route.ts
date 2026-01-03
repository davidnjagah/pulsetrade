/**
 * PulseTrade Price Feed API Route
 * Next.js 14 App Router API endpoint for price data
 *
 * This endpoint provides:
 * - Server-Sent Events (SSE) for real-time price updates
 * - Current price snapshot via GET
 * - Price history for chart initialization
 *
 * Note: True WebSocket would require a custom server or Edge runtime
 * SSE provides similar functionality for our use case
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Mock Price Generator (for development)
// ============================================

class MockPriceState {
  private static instance: MockPriceState;
  private price: number = 200;
  private history: Array<{ price: number; timestamp: number }> = [];
  private volatility: number = 0.002;
  private trend: number = 0;

  private constructor() {
    // Initialize with some history
    const now = Date.now();
    for (let i = 600; i >= 0; i--) {
      this.history.push({
        price: this.generatePrice(),
        timestamp: now - i * 1000,
      });
    }
  }

  static getInstance(): MockPriceState {
    if (!MockPriceState.instance) {
      MockPriceState.instance = new MockPriceState();
    }
    return MockPriceState.instance;
  }

  generatePrice(): number {
    // Random walk with mean reversion
    const randomChange =
      (Math.random() - 0.5) * 2 * this.volatility * this.price;

    // Occasional trend changes
    if (Math.random() < 0.05) {
      this.trend = (Math.random() - 0.5) * 0.0002 * this.price;
    }

    this.price += randomChange + this.trend;
    this.price = Math.max(50, Math.min(500, this.price));

    const currentPrice = Number(this.price.toFixed(4));

    // Add to history
    this.history.push({
      price: currentPrice,
      timestamp: Date.now(),
    });

    // Keep only last 10 minutes of history
    const cutoff = Date.now() - 10 * 60 * 1000;
    this.history = this.history.filter((p) => p.timestamp >= cutoff);

    return currentPrice;
  }

  getHistory(): Array<{ price: number; timestamp: number }> {
    return [...this.history];
  }

  getLatestPrice(): { price: number; timestamp: number } {
    if (this.history.length === 0) {
      return { price: this.price, timestamp: Date.now() };
    }
    return this.history[this.history.length - 1];
  }

  getVolatility(): number {
    if (this.history.length < 2) return 0;

    const prices = this.history.slice(-60).map((p) => p.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
    const variance =
      squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;

    return Math.sqrt(variance);
  }

  getHighLow(): { high: number; low: number } {
    if (this.history.length === 0) {
      return { high: this.price, low: this.price };
    }

    const prices = this.history.map((p) => p.price);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }
}

// ============================================
// Response Helpers
// ============================================

interface PriceResponse {
  price: number;
  timestamp: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  volatility?: number;
  source: string;
}

interface HistoryResponse {
  history: Array<{ price: number; timestamp: number }>;
  currentPrice: number;
  volatility: number;
  highLow: { high: number; low: number };
}

// ============================================
// GET Handler - Current Price or SSE Stream
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  // Return price history for chart initialization
  if (mode === 'history') {
    return handleHistoryRequest();
  }

  // Return SSE stream for real-time updates
  if (mode === 'stream') {
    return handleStreamRequest(request);
  }

  // Default: Return current price snapshot
  return handleSnapshotRequest();
}

/**
 * Handle snapshot request - returns current price
 */
function handleSnapshotRequest(): NextResponse<PriceResponse> {
  const mockState = MockPriceState.getInstance();
  const latest = mockState.getLatestPrice();
  const highLow = mockState.getHighLow();

  const response: PriceResponse = {
    price: latest.price,
    timestamp: latest.timestamp,
    high24h: highLow.high,
    low24h: highLow.low,
    volatility: mockState.getVolatility(),
    source: 'mock',
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });
}

/**
 * Handle history request - returns price history for chart
 */
function handleHistoryRequest(): NextResponse<HistoryResponse> {
  const mockState = MockPriceState.getInstance();
  const history = mockState.getHistory();
  const latest = mockState.getLatestPrice();

  const response: HistoryResponse = {
    history,
    currentPrice: latest.price,
    volatility: mockState.getVolatility(),
    highLow: mockState.getHighLow(),
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Handle SSE stream request - real-time price updates
 */
function handleStreamRequest(request: NextRequest): Response {
  const mockState = MockPriceState.getInstance();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial price
      const initial = mockState.getLatestPrice();
      const initialData = `data: ${JSON.stringify({
        type: 'price',
        price: initial.price,
        timestamp: initial.timestamp,
        volatility: mockState.getVolatility(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialData));

      // Set up interval for price updates
      const interval = setInterval(() => {
        try {
          const newPrice = mockState.generatePrice();
          const data = `data: ${JSON.stringify({
            type: 'price',
            price: newPrice,
            timestamp: Date.now(),
            volatility: mockState.getVolatility(),
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Client disconnected
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    },
  });
}

// ============================================
// POST Handler - Price Actions (Future Use)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'subscribe':
        // Future: Handle WebSocket subscription via Supabase Realtime
        return NextResponse.json({
          success: true,
          message: 'Use SSE stream for real-time updates: GET /api/price-feed?mode=stream',
        });

      case 'get_multiplier':
        // Calculate multiplier for a given target
        return handleMultiplierRequest(body);

      default:
        return NextResponse.json(
          { error: { code: 'INVALID_ACTION', message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } },
      { status: 400 }
    );
  }
}

/**
 * Handle multiplier calculation request
 */
async function handleMultiplierRequest(body: {
  targetPrice: number;
  targetTime: number;
}): Promise<NextResponse> {
  const { targetPrice, targetTime } = body;

  if (!targetPrice || !targetTime) {
    return NextResponse.json(
      {
        error: {
          code: 'MISSING_PARAMS',
          message: 'targetPrice and targetTime are required',
        },
      },
      { status: 400 }
    );
  }

  const mockState = MockPriceState.getInstance();
  const currentPrice = mockState.getLatestPrice().price;
  const currentTime = Date.now();
  const volatility = mockState.getVolatility();

  // Import multiplier calculator dynamically to avoid circular deps
  const { calculateDisplayMultiplier } = await import(
    '@/lib/multiplierCalculator'
  );

  const result = calculateDisplayMultiplier({
    currentPrice,
    targetPrice,
    currentTime,
    targetTime,
    volatility,
  });

  return NextResponse.json({
    currentPrice,
    targetPrice,
    multiplier: result.multiplier,
    probability: result.trueProbability,
    houseEdge: result.houseEdge,
  });
}

// ============================================
// Edge Runtime Config (Optional)
// ============================================

// Uncomment to use Edge runtime for better streaming performance
// export const runtime = 'edge';

// ============================================
// API Documentation
// ============================================

/**
 * API Endpoints:
 *
 * GET /api/price-feed
 *   Returns current price snapshot
 *   Response: { price, timestamp, high24h, low24h, volatility, source }
 *
 * GET /api/price-feed?mode=history
 *   Returns price history for last 10 minutes
 *   Response: { history, currentPrice, volatility, highLow }
 *
 * GET /api/price-feed?mode=stream
 *   Returns SSE stream with real-time price updates
 *   Each event: { type: 'price', price, timestamp, volatility }
 *
 * POST /api/price-feed
 *   Body: { action: 'get_multiplier', targetPrice, targetTime }
 *   Returns calculated multiplier for given target
 *
 * Usage Example (Client):
 * ```typescript
 * // SSE Connection
 * const eventSource = new EventSource('/api/price-feed?mode=stream');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('New price:', data.price);
 * };
 *
 * // Snapshot
 * const response = await fetch('/api/price-feed');
 * const { price } = await response.json();
 * ```
 */
