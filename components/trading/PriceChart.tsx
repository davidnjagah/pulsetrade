"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, IChartApi, ISeriesApi, LineData, Time } from "lightweight-charts";

// Generate mock price data
function generateMockData(): LineData[] {
  const data: LineData[] = [];
  const now = Math.floor(Date.now() / 1000);
  let price = 95000 + Math.random() * 5000; // Start around BTC price range

  for (let i = 300; i >= 0; i--) {
    const time = (now - i * 10) as Time;
    price = price + (Math.random() - 0.5) * 100;
    data.push({
      time,
      value: price,
    });
  }

  return data;
}

interface PriceChartProps {
  symbol?: string;
  onPriceUpdate?: (price: number, change: number) => void;
  isLoading?: boolean;
}

// Price pulse animation component
function PricePulse({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute top-4 right-4 w-32 h-10"
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0px rgba(34, 197, 94, 0)",
                "0 0 20px rgba(34, 197, 94, 0.4)",
                "0 0 0px rgba(34, 197, 94, 0)"
              ]
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Chart loading skeleton
function ChartSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-pulse-bg-secondary/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Animated chart line skeleton */}
        <div className="relative w-64 h-32">
          <svg className="w-full h-full" viewBox="0 0 256 128">
            <motion.path
              d="M0 100 Q 32 80, 64 90 T 128 70 T 192 85 T 256 60"
              fill="none"
              stroke="rgba(255, 105, 180, 0.3)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Glow trail */}
            <motion.path
              d="M0 100 Q 32 80, 64 90 T 128 70 T 192 85 T 256 60"
              fill="none"
              stroke="rgba(255, 105, 180, 0.15)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="blur(4px)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>
        </div>
        <motion.div
          className="text-pulse-text-secondary text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading chart data...
        </motion.div>
      </div>
    </div>
  );
}

export default function PriceChart({
  symbol = "SOL/USD",
  onPriceUpdate,
  isLoading = false
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<number>(0);

  // Handle price update with pulse effect
  const handlePriceUpdate = useCallback((newPrice: number, change: number) => {
    const direction = newPrice > prevPriceRef.current ? "up" : newPrice < prevPriceRef.current ? "down" : null;
    setPriceDirection(direction);
    setIsPulsing(true);
    prevPriceRef.current = newPrice;

    setCurrentPrice(newPrice);
    setPriceChange(change);
    onPriceUpdate?.(newPrice, change);

    // Reset pulse
    setTimeout(() => setIsPulsing(false), 500);
  }, [onPriceUpdate]);

  useEffect(() => {
    if (!chartContainerRef.current || isLoading) return;

    // Create the chart with enhanced styling
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#a0a0a0",
      },
      grid: {
        vertLines: {
          color: "rgba(255, 105, 180, 0.06)",
          style: 1,
        },
        horzLines: {
          color: "rgba(255, 105, 180, 0.06)",
          style: 1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(255, 105, 180, 0.5)",
          width: 1,
          style: 0,
          labelBackgroundColor: "#ff69b4",
        },
        horzLine: {
          color: "rgba(255, 105, 180, 0.5)",
          width: 1,
          style: 0,
          labelBackgroundColor: "#ff69b4",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 105, 180, 0.15)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "rgba(255, 105, 180, 0.15)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Add the line series with enhanced pink glow effect
    const lineSeries = chart.addLineSeries({
      color: "#ff69b4",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 8,
      crosshairMarkerBorderColor: "#ff1493",
      crosshairMarkerBackgroundColor: "#ff69b4",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Generate and set initial data
    const initialData = generateMockData();
    lineSeries.setData(initialData);

    // Set current price from last data point
    if (initialData.length > 0) {
      const lastPrice = initialData[initialData.length - 1].value;
      const firstPrice = initialData[0].value;
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      prevPriceRef.current = lastPrice;
      handlePriceUpdate(lastPrice, change);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Store references
    chartRef.current = chart;
    seriesRef.current = lineSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Simulate real-time price updates with smoother interpolation
    const updateInterval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000) as Time;
      const lastData = seriesRef.current?.data();

      if (lastData && lastData.length > 0) {
        const lastPoint = lastData[lastData.length - 1] as LineData;
        // Smoother price movement
        const volatility = 30 + Math.random() * 20;
        const trend = Math.random() > 0.5 ? 1 : -1;
        const newPrice = lastPoint.value + (Math.random() - 0.5) * volatility * trend;

        seriesRef.current?.update({
          time: now,
          value: newPrice,
        });

        // Update price change
        const firstPoint = lastData[0] as LineData;
        const change = ((newPrice - firstPoint.value) / firstPoint.value) * 100;
        handlePriceUpdate(newPrice, change);
      }
    }, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(updateInterval);
      chart.remove();
    };
  }, [isLoading, handlePriceUpdate]);

  return (
    <div className="relative w-full h-full chart-container">
      {/* Symbol and price display */}
      <motion.div
        className="absolute top-4 left-4 z-10 flex flex-col gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-white">{symbol}</span>
          <motion.span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              priceChange >= 0
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
            key={priceChange.toFixed(2)}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            {priceChange >= 0 ? "+" : ""}
            {priceChange.toFixed(2)}%
          </motion.span>
        </div>
      </motion.div>

      {/* Current price badge with pulse effect */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          className={`price-badge flex items-center gap-2 relative overflow-hidden ${
            isPulsing ? "ring-2 ring-green-500/50" : ""
          }`}
          animate={isPulsing ? {
            scale: [1, 1.02, 1],
            boxShadow: priceDirection === "up"
              ? ["0 2px 8px rgba(34, 197, 94, 0.4)", "0 2px 16px rgba(34, 197, 94, 0.6)", "0 2px 8px rgba(34, 197, 94, 0.4)"]
              : priceDirection === "down"
              ? ["0 2px 8px rgba(239, 68, 68, 0.4)", "0 2px 16px rgba(239, 68, 68, 0.6)", "0 2px 8px rgba(239, 68, 68, 0.4)"]
              : undefined
          } : undefined}
          transition={{ duration: 0.3 }}
        >
          {/* Price direction indicator */}
          <AnimatePresence>
            {priceDirection && isPulsing && (
              <motion.div
                className={`absolute inset-0 ${
                  priceDirection === "up" ? "bg-green-500/10" : "bg-red-500/10"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          <span className="font-mono font-bold text-white relative z-10">
            ${currentPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </motion.div>
      </div>

      {/* Chart container with glow effect overlay */}
      <div
        ref={chartContainerRef}
        className="w-full h-full chart-glow-container"
        style={{ minHeight: "400px" }}
      />

      {/* Loading skeleton */}
      <AnimatePresence>
        {isLoading && <ChartSkeleton />}
      </AnimatePresence>

      {/* Live indicator with enhanced animation */}
      <motion.div
        className="absolute bottom-4 left-4 z-10 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <motion.div
            className="absolute inset-0 w-2 h-2 rounded-full bg-green-500"
            animate={{
              scale: [1, 2, 2],
              opacity: [0.8, 0.2, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>
        <span className="text-xs text-pulse-text-secondary">Live</span>
      </motion.div>

      {/* Glow trail effect overlay */}
      <div className="absolute inset-0 pointer-events-none chart-glow-overlay" />
    </div>
  );
}
