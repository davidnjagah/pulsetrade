import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Uses clsx for conditional classes and tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  options: {
    showSign?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSign = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const formatted = amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (showSign && amount > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Truncate a wallet address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Generate a consistent color from a string (for avatars)
 */
export function stringToColor(str: string): string {
  const colors = [
    "#ff69b4", "#ff1493", "#9b59b6", "#3498db",
    "#1abc9c", "#2ecc71", "#f1c40f", "#e67e22",
    "#e74c3c", "#00d4ff",
  ];

  const hash = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if we're running on the client side
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ============================================
// SPRINT 7: Performance Optimization Utilities
// ============================================

/**
 * Generic cache with TTL support
 */
export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiresAt: number }> = new Map();
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(options: { defaultTTL?: number; maxSize?: number } = {}) {
    this.defaultTTL = options.defaultTTL || 60000; // 1 minute default
    this.maxSize = options.maxSize || 1000;
  }

  set(key: K, value: V, ttl?: number): void {
    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    });

    return removed;
  }

  getStats(): { size: number; hitRate?: number } {
    return { size: this.cache.size };
  }
}

/**
 * Memoization decorator for functions
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: { maxSize?: number; ttl?: number; keyFn?: (...args: Parameters<T>) => string } = {}
): T {
  const cache = new TTLCache<string, ReturnType<T>>({
    defaultTTL: options.ttl || 60000,
    maxSize: options.maxSize || 100,
  });

  const keyFn = options.keyFn || ((...args: Parameters<T>) => JSON.stringify(args));

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Request coalescing for concurrent identical requests
 */
export class RequestCoalescer<T> {
  private inFlight: Map<string, Promise<T>> = new Map();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    // If there's already a request in flight for this key, wait for it
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    // Start new request
    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  pendingCount(): number {
    return this.inFlight.size;
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private lastRefill: number;

  constructor(options: { maxTokens: number; refillRate: number }) {
    this.maxTokens = options.maxTokens;
    this.tokens = options.maxTokens;
    this.refillRate = options.refillRate;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  async waitAndAcquire(): Promise<void> {
    while (!this.tryAcquire()) {
      await sleep(100);
    }
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Batch processor for combining multiple operations
 */
export class BatchProcessor<TInput, TOutput> {
  private queue: Array<{ input: TInput; resolve: (output: TOutput) => void; reject: (error: Error) => void }> = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly maxWait: number;
  private readonly processFn: (inputs: TInput[]) => Promise<TOutput[]>;

  constructor(options: {
    batchSize: number;
    maxWait: number;
    processFn: (inputs: TInput[]) => Promise<TOutput[]>;
  }) {
    this.batchSize = options.batchSize;
    this.maxWait = options.maxWait;
    this.processFn = options.processFn;
  }

  add(input: TInput): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      this.queue.push({ input, resolve, reject });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.maxWait);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const inputs = batch.map((item) => item.input);

    try {
      const outputs = await this.processFn(inputs);

      batch.forEach((item, index) => {
        if (outputs[index] !== undefined) {
          item.resolve(outputs[index]);
        } else {
          item.reject(new Error('No output for batch item'));
        }
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      });
    }

    // Process remaining items if any
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => this.flush(), this.maxWait);
    }
  }

  queueSize(): number {
    return this.queue.length;
  }
}

/**
 * Performance timer for measuring operations
 */
export class PerfTimer {
  private static timers: Map<string, number[]> = new Map();

  static start(label: string): () => number {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;

      let times = this.timers.get(label);
      if (!times) {
        times = [];
        this.timers.set(label, times);
      }

      times.push(duration);

      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }

      return duration;
    };
  }

  static getStats(label: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.timers.get(label);
    if (!times || times.length === 0) return null;

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
    };
  }

  static getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.timers.forEach((_, label) => {
      const s = this.getStats(label);
      if (s) stats[label] = s;
    });

    return stats;
  }

  static clear(): void {
    this.timers.clear();
  }
}
