/**
 * PulseTrade Admin Statistics API
 * Protected endpoint for platform statistics and monitoring
 *
 * GET /api/admin/stats - Get platform statistics
 *
 * Headers:
 * - x-admin-key: Admin API key for authentication
 *
 * Query Parameters:
 * - period: 'daily' | 'weekly' | 'monthly' | 'alltime' (default: 'daily')
 *
 * Response includes:
 * - Revenue statistics (house edge, platform fees, losses)
 * - Volume metrics
 * - User activity
 * - Risk management status
 * - System health
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRevenueStats, getRevenueByUser, getRecentRevenueEvents, projectRevenue } from '@/lib/monetizationService';
import { getRiskStatus, getExposureSnapshot } from '@/lib/riskManagement';
import { getSystemStats } from '@/lib/betService';

// ============================================
// Types
// ============================================

interface AdminStatsResponse {
  success: boolean;
  timestamp: string;
  period: string;
  revenue: {
    totalVolume: number;
    totalRevenue: number;
    houseEdgeRevenue: number;
    platformFeeRevenue: number;
    lossRevenue: number;
    effectiveEdge: number;
    projectedDaily?: number;
    projectedMonthly?: number;
  };
  bets: {
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    averageBetSize: number;
    averageMultiplier: number;
    activeBets: number;
  };
  users: {
    totalUsers: number;
    topRevenueUsers: Array<{ userId: string; revenue: number; bets: number }>;
  };
  risk: {
    totalExposure: number;
    maxExposure: number;
    exposurePercent: number;
    riskLevel: string;
    upExposure: number;
    downExposure: number;
    exposureRatio: number;
    circuitBreaker: {
      active: boolean;
      reason: string | null;
      volatilityLevel: number;
      allowBetting: boolean;
      multiplierAdjustment: number;
    };
  };
  system: {
    uptime: number;
    memoryUsage: number;
    lastUpdate: string;
  };
}

// ============================================
// Admin Authentication
// ============================================

// Simple admin key check - in production, use proper auth
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'pulsetrade-admin-dev-key';

function validateAdminAccess(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key');

  // Allow access in development mode without key
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return adminKey === ADMIN_API_KEY;
}

// ============================================
// System Metrics
// ============================================

const serverStartTime = Date.now();

function getSystemMetrics() {
  const uptime = Date.now() - serverStartTime;

  // Memory usage (approximate, works in Node.js)
  let memoryUsage = 0;
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    memoryUsage = Math.round((mem.heapUsed / mem.heapTotal) * 100);
  }

  return {
    uptime,
    memoryUsage,
    lastUpdate: new Date().toISOString(),
  };
}

// ============================================
// API Handler
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Validate admin access
  if (!validateAdminAccess(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing admin API key',
        },
      },
      { status: 401 }
    );
  }

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';

    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'alltime'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Get revenue statistics
    const revenueStats = getRevenueStats();
    const periodStats = revenueStats[period as keyof typeof revenueStats];

    // Get system statistics
    const systemStats = getSystemStats();

    // Get risk status
    const riskStatus = getRiskStatus();
    const exposure = getExposureSnapshot();

    // Get top revenue users
    const topUsers = getRevenueByUser(10);

    // Get projected revenue (if we have volume data)
    let projectedDaily = 0;
    let projectedMonthly = 0;
    if (periodStats.totalVolume > 0) {
      // Annualize based on period
      let dailyVolume = periodStats.totalVolume;
      if (period === 'weekly') {
        dailyVolume = periodStats.totalVolume / 7;
      } else if (period === 'monthly') {
        dailyVolume = periodStats.totalVolume / 30;
      } else if (period === 'alltime') {
        // Use 30-day assumption
        dailyVolume = periodStats.totalVolume / 30;
      }

      const projections = projectRevenue(dailyVolume);
      projectedDaily = projections.daily;
      projectedMonthly = projections.monthly;
    }

    // Build response
    const response: AdminStatsResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      period,
      revenue: {
        totalVolume: periodStats.totalVolume,
        totalRevenue: periodStats.totalRevenue,
        houseEdgeRevenue: periodStats.houseEdgeRevenue,
        platformFeeRevenue: periodStats.platformFeeRevenue,
        lossRevenue: periodStats.lossRevenue,
        effectiveEdge: periodStats.effectiveEdge,
        projectedDaily,
        projectedMonthly,
      },
      bets: {
        total: periodStats.totalBets,
        wins: periodStats.totalWins,
        losses: periodStats.totalLosses,
        winRate: periodStats.winRate,
        averageBetSize: periodStats.averageBetSize,
        averageMultiplier: periodStats.averageMultiplier,
        activeBets: systemStats.totalActiveBets,
      },
      users: {
        totalUsers: systemStats.totalUsers,
        topRevenueUsers: topUsers,
      },
      risk: {
        totalExposure: exposure.totalExposure,
        maxExposure: systemStats.maxPlatformExposure,
        exposurePercent: exposure.totalExposure / systemStats.maxPlatformExposure,
        riskLevel: exposure.riskLevel,
        upExposure: exposure.upExposure.potentialPayout,
        downExposure: exposure.downExposure.potentialPayout,
        exposureRatio: exposure.exposureRatio,
        circuitBreaker: {
          active: riskStatus.circuitBreaker.active,
          reason: riskStatus.circuitBreaker.reason,
          volatilityLevel: riskStatus.circuitBreaker.volatilityLevel,
          allowBetting: riskStatus.circuitBreaker.allowBetting,
          multiplierAdjustment: riskStatus.circuitBreaker.multiplierAdjustment,
        },
      },
      system: getSystemMetrics(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[Admin Stats API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch platform statistics',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/stats - Admin actions
 *
 * Actions:
 * - { action: 'circuit_breaker', enable: boolean, reason?: string }
 * - { action: 'reset_stats' } (development only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate admin access
  if (!validateAdminAccess(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing admin API key',
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'circuit_breaker': {
        const { enable, reason, duration } = body;

        if (enable) {
          const { activateCircuitBreaker } = await import('@/lib/riskManagement');
          activateCircuitBreaker(reason || 'Admin action', duration || 300000);

          return NextResponse.json({
            success: true,
            message: 'Circuit breaker activated',
            reason: reason || 'Admin action',
          });
        } else {
          const { deactivateCircuitBreaker } = await import('@/lib/riskManagement');
          deactivateCircuitBreaker();

          return NextResponse.json({
            success: true,
            message: 'Circuit breaker deactivated',
          });
        }
      }

      case 'reset_stats': {
        // Only allow in development
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'This action is only allowed in development mode',
              },
            },
            { status: 403 }
          );
        }

        const { clearRevenueData } = await import('@/lib/monetizationService');
        const { resetRiskState } = await import('@/lib/riskManagement');

        clearRevenueData();
        resetRiskState();

        return NextResponse.json({
          success: true,
          message: 'Statistics reset successfully',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: `Unknown action: ${action}`,
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Admin Stats API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process admin action',
        },
      },
      { status: 500 }
    );
  }
}
