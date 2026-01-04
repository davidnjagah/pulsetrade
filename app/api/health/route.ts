/**
 * PulseTrade Health Check API
 * Provides system health and status information
 *
 * GET /api/health - Basic health check
 * GET /api/health?detail=true - Detailed health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSystemStats, getResponseTimeStats } from '@/lib/betService';
import { getRevenueStats } from '@/lib/monetizationService';
import { getRiskStatus, getExposureSnapshot } from '@/lib/riskManagement';
import { getOracleStatus } from '@/lib/priceOracle';
import { getAntiExploitationStats } from '@/lib/antiExploitation';
import { PerfTimer } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
}

interface DetailedHealthStatus extends HealthStatus {
  services: {
    betting: ServiceStatus;
    pricing: ServiceStatus;
    riskManagement: ServiceStatus;
    antiExploitation: ServiceStatus;
  };
  metrics: {
    activeBets: number;
    totalUsers: number;
    responseTime: {
      averageMs: number;
      maxMs: number;
    };
    exposure: {
      total: number;
      percent: number;
    };
    revenue: {
      daily: number;
      effectiveEdge: number;
    };
  };
  performance: Record<string, { avg: number; min: number; max: number; count: number }>;
}

interface ServiceStatus {
  status: 'up' | 'degraded' | 'down';
  lastCheck: string;
  message?: string;
}

// ============================================
// State
// ============================================

const serverStartTime = Date.now();
const APP_VERSION = '1.0.0-sprint7';

// ============================================
// Health Check Functions
// ============================================

/**
 * Check betting service health
 */
function checkBettingService(): ServiceStatus {
  try {
    const stats = getSystemStats();
    const responseStats = getResponseTimeStats();

    if (responseStats.averageMs > 500) {
      return {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        message: `High latency: ${responseStats.averageMs}ms average`,
      };
    }

    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      message: String(error),
    };
  }
}

/**
 * Check pricing service health
 */
function checkPricingService(): ServiceStatus {
  try {
    const oracleStatus = getOracleStatus();

    if (oracleStatus.sourceErrors.length > 2) {
      return {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        message: `${oracleStatus.sourceErrors.length} price sources with errors`,
      };
    }

    if (!oracleStatus.lastPrice) {
      return {
        status: 'down',
        lastCheck: new Date().toISOString(),
        message: 'No price data available',
      };
    }

    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      message: String(error),
    };
  }
}

/**
 * Check risk management service health
 */
function checkRiskManagement(): ServiceStatus {
  try {
    const riskStatus = getRiskStatus();

    if (riskStatus.circuitBreaker.active) {
      return {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        message: `Circuit breaker active: ${riskStatus.circuitBreaker.reason}`,
      };
    }

    if (riskStatus.exposure.riskLevel === 'critical') {
      return {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        message: 'Exposure at critical levels',
      };
    }

    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      message: String(error),
    };
  }
}

/**
 * Check anti-exploitation service health
 */
function checkAntiExploitation(): ServiceStatus {
  try {
    const stats = getAntiExploitationStats();

    if (stats.bannedUsers > 100) {
      return {
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        message: `High number of banned users: ${stats.bannedUsers}`,
      };
    }

    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      message: String(error),
    };
  }
}

/**
 * Determine overall system health
 */
function getOverallStatus(services: Record<string, ServiceStatus>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services);

  const downCount = statuses.filter((s) => s.status === 'down').length;
  const degradedCount = statuses.filter((s) => s.status === 'degraded').length;

  if (downCount > 0) {
    return 'unhealthy';
  }

  if (degradedCount > 1) {
    return 'degraded';
  }

  return 'healthy';
}

// ============================================
// API Handler
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detail') === 'true';

  try {
    const uptime = Date.now() - serverStartTime;

    // Basic health check
    if (!detailed) {
      const services = {
        betting: checkBettingService(),
        pricing: checkPricingService(),
        riskManagement: checkRiskManagement(),
        antiExploitation: checkAntiExploitation(),
      };

      const basicHealth: HealthStatus = {
        status: getOverallStatus(services),
        timestamp: new Date().toISOString(),
        uptime,
        version: APP_VERSION,
      };

      return NextResponse.json(basicHealth, {
        status: basicHealth.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Detailed health check
    const services = {
      betting: checkBettingService(),
      pricing: checkPricingService(),
      riskManagement: checkRiskManagement(),
      antiExploitation: checkAntiExploitation(),
    };

    const systemStats = getSystemStats();
    const responseStats = getResponseTimeStats();
    const revenueStats = getRevenueStats();
    const exposure = getExposureSnapshot();
    const perfStats = PerfTimer.getAllStats();

    const detailedHealth: DetailedHealthStatus = {
      status: getOverallStatus(services),
      timestamp: new Date().toISOString(),
      uptime,
      version: APP_VERSION,
      services,
      metrics: {
        activeBets: systemStats.totalActiveBets,
        totalUsers: systemStats.totalUsers,
        responseTime: {
          averageMs: responseStats.averageMs,
          maxMs: responseStats.maxMs,
        },
        exposure: {
          total: exposure.totalExposure,
          percent: exposure.totalExposure / systemStats.maxPlatformExposure,
        },
        revenue: {
          daily: revenueStats.daily.totalRevenue,
          effectiveEdge: revenueStats.daily.effectiveEdge,
        },
      },
      performance: perfStats,
    };

    return NextResponse.json(detailedHealth, {
      status: detailedHealth.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[Health API] Error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - serverStartTime,
        version: APP_VERSION,
        error: String(error),
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD request for simple alive check
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'ok',
      'X-Uptime': String(Date.now() - serverStartTime),
    },
  });
}
