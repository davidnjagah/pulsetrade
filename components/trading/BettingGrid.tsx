"use client";

import { useState, useMemo } from "react";

interface GridCell {
  id: string;
  row: number;
  col: number;
  multiplier: number;
  priceLevel: number;
  isActive: boolean;
}

interface BettingGridProps {
  currentPrice?: number;
  rows?: number;
  cols?: number;
  onCellClick?: (cell: GridCell) => void;
}

// Generate multiplier based on distance from current price
function calculateMultiplier(distance: number): number {
  // Closer to current price = lower multiplier
  // Further from current price = higher multiplier
  const base = 1.2;
  const multiplier = base + Math.abs(distance) * 0.3;
  return Math.min(multiplier, 5.0); // Cap at 5x
}

export default function BettingGrid({
  currentPrice = 97500,
  rows = 8,
  cols = 5,
  onCellClick,
}: BettingGridProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // Generate grid cells with multipliers
  const gridCells = useMemo(() => {
    const cells: GridCell[] = [];
    const priceRange = 500; // Price range per row

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const distance = Math.abs(row - Math.floor(rows / 2));
        const priceLevel = currentPrice + (Math.floor(rows / 2) - row) * priceRange;
        const multiplier = calculateMultiplier(distance);

        cells.push({
          id: `${row}-${col}`,
          row,
          col,
          multiplier,
          priceLevel,
          isActive: row === Math.floor(rows / 2),
        });
      }
    }

    return cells;
  }, [currentPrice, rows, cols]);

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
        {gridCells.map((cell) => (
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

            {/* Price level (shown on hover) */}
            {hoveredCell === cell.id && (
              <span className="absolute bottom-1 text-[10px] text-pulse-text-secondary font-mono animate-fade-in">
                ${cell.priceLevel.toLocaleString()}
              </span>
            )}

            {/* Active row indicator */}
            {cell.isActive && cell.col === Math.floor(cols / 2) && (
              <div className="absolute left-1 w-1.5 h-1.5 rounded-full bg-pulse-yellow animate-pulse" />
            )}
          </button>
        ))}
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

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-4 text-xs text-pulse-text-secondary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-pulse-yellow" />
          <span>Current Price</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded bg-pulse-pink/30" />
          <span>Higher Multiplier</span>
        </div>
      </div>
    </div>
  );
}
