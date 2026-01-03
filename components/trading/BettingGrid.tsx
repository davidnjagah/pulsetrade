"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import BetChip from "./BetChip";
import type { Bet } from "@/hooks/useBets";

export interface GridCell {
  id: string;
  row: number;
  col: number;
  multiplier: number;
  priceLevel: number;
  isActive: boolean;
  timeOffset: number; // seconds from now
}

interface BettingGridProps {
  currentPrice?: number;
  rows?: number;
  cols?: number;
  onCellClick?: (cell: GridCell) => void;
  bets?: Bet[];
  selectedAmount?: number;
}

// Generate multiplier based on distance from current price and time
function calculateMultiplier(priceDistance: number, timeOffset: number): number {
  // Closer to current price = lower multiplier
  // Further from current price = higher multiplier
  // Shorter time = lower multiplier (more likely to hit)
  const base = 1.2;
  const priceMultiplier = Math.abs(priceDistance) * 0.3;
  const timeMultiplier = Math.max(0, (timeOffset - 10) * 0.02); // More time = slightly lower odds

  const multiplier = base + priceMultiplier + timeMultiplier;
  return Math.min(Math.max(multiplier, 1.2), 5.0); // Clamp between 1.2x and 5x
}

export default function BettingGrid({
  currentPrice = 97500,
  rows = 8,
  cols = 5,
  onCellClick,
  bets = [],
  selectedAmount = 5,
}: BettingGridProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // Generate grid cells with multipliers
  const gridCells = useMemo(() => {
    const cells: GridCell[] = [];
    const priceRange = 500; // Price range per row
    const timeRange = 15; // Seconds per column

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const priceDistance = Math.abs(row - Math.floor(rows / 2));
        const priceLevel = currentPrice + (Math.floor(rows / 2) - row) * priceRange;
        const timeOffset = (col + 1) * timeRange; // 15s, 30s, 45s, 60s, 75s
        const multiplier = calculateMultiplier(priceDistance, timeOffset);

        cells.push({
          id: `${row}-${col}`,
          row,
          col,
          multiplier,
          priceLevel,
          isActive: row === Math.floor(rows / 2),
          timeOffset,
        });
      }
    }

    return cells;
  }, [currentPrice, rows, cols]);

  // Get bets for a specific cell
  const getBetsForCell = (cellId: string) => {
    return bets.filter((bet) => bet.cellId === cellId);
  };

  const handleCellClick = (cell: GridCell) => {
    setSelectedCell(cell.id);
    onCellClick?.(cell);
  };

  return (
    <div className="relative w-full h-full">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 grid gap-[1px]"
        style={{
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {gridCells.map((cell) => {
          const cellBets = getBetsForCell(cell.id);
          const hasActiveBets = cellBets.some(
            (b) => b.status === "active" || b.status === "pending"
          );

          return (
            <button
              key={cell.id}
              onClick={() => handleCellClick(cell)}
              onMouseEnter={() => setHoveredCell(cell.id)}
              onMouseLeave={() => setHoveredCell(null)}
              className={`
                grid-cell relative flex flex-col items-center justify-center
                transition-all duration-200 cursor-pointer
                ${
                  hoveredCell === cell.id
                    ? "bg-pulse-pink/20 border-pulse-pink/40"
                    : "bg-transparent"
                }
                ${
                  selectedCell === cell.id
                    ? "bg-pulse-pink/30 border-pulse-pink/60"
                    : ""
                }
                ${cell.isActive ? "border-pulse-yellow/30" : ""}
                ${hasActiveBets ? "bg-pulse-yellow/10 border-pulse-yellow/30" : ""}
              `}
            >
              {/* Multiplier display */}
              <span
                className={`
                  text-xs font-bold font-mono transition-opacity duration-200
                  ${
                    hoveredCell === cell.id || selectedCell === cell.id
                      ? "opacity-100 text-pulse-multiplier"
                      : "opacity-40 text-pulse-multiplier"
                  }
                `}
              >
                {cell.multiplier.toFixed(1)}x
              </span>

              {/* Time indicator */}
              <span
                className={`
                  text-[8px] font-mono transition-opacity duration-200
                  ${
                    hoveredCell === cell.id
                      ? "opacity-80 text-pulse-text-secondary"
                      : "opacity-0"
                  }
                `}
              >
                {cell.timeOffset}s
              </span>

              {/* Price level (shown on hover) */}
              {hoveredCell === cell.id && (
                <span className="absolute bottom-1 text-[10px] text-pulse-text-secondary font-mono animate-fade-in">
                  ${cell.priceLevel.toLocaleString()}
                </span>
              )}

              {/* Bet indicator for cells with selected amount preview */}
              {hoveredCell === cell.id && !hasActiveBets && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="opacity-50 scale-75">
                    <BetChip
                      amount={selectedAmount}
                      multiplier={cell.multiplier}
                      status="pending"
                      size="sm"
                    />
                  </div>
                </div>
              )}

              {/* Active row indicator */}
              {cell.isActive && cell.col === Math.floor(cols / 2) && (
                <div className="absolute left-1 w-1.5 h-1.5 rounded-full bg-pulse-yellow animate-pulse" />
              )}

              {/* Placed bets display */}
              <AnimatePresence>
                {cellBets.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col gap-1 items-center">
                      {cellBets.slice(0, 3).map((bet, index) => (
                        <div
                          key={bet.id}
                          style={{
                            transform: `translateY(${index * -4}px)`,
                            zIndex: cellBets.length - index,
                          }}
                        >
                          <BetChip
                            amount={bet.amount}
                            multiplier={bet.multiplier}
                            status={bet.status}
                            size="sm"
                          />
                        </div>
                      ))}
                      {cellBets.length > 3 && (
                        <span className="text-[10px] text-pulse-yellow font-bold">
                          +{cellBets.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Current price line indicator */}
      <div
        className="absolute left-0 right-0 h-[2px] pointer-events-none"
        style={{
          top: `${(100 / rows) * Math.floor(rows / 2)}%`,
          background:
            "linear-gradient(90deg, transparent, rgba(230, 255, 0, 0.6), transparent)",
          boxShadow: "0 0 10px rgba(230, 255, 0, 0.4)",
        }}
      />

      {/* Price labels on the side */}
      <div className="absolute right-0 top-0 bottom-0 w-16 flex flex-col justify-between pointer-events-none py-2">
        {Array.from({ length: rows }, (_, i) => {
          const priceLevel =
            currentPrice + (Math.floor(rows / 2) - i) * 500;
          return (
            <div
              key={i}
              className="text-[10px] font-mono text-pulse-text-secondary text-right pr-2"
            >
              ${priceLevel.toLocaleString()}
            </div>
          );
        })}
      </div>

      {/* Time labels at the bottom */}
      <div className="absolute bottom-0 left-0 right-16 flex justify-around pointer-events-none pb-8">
        {Array.from({ length: cols }, (_, i) => (
          <div
            key={i}
            className="text-[10px] font-mono text-pulse-text-secondary"
          >
            {(i + 1) * 15}s
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-4 text-xs text-pulse-text-secondary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-pulse-yellow" />
          <span>Current Price</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded bg-pulse-pink/30" />
          <span>Tap to Bet</span>
        </div>
      </div>
    </div>
  );
}

// Export GridCell type for external use
export type { GridCell as BettingGridCell };
