"use client";

import { useEffect, useRef, useState } from "react";
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
}

export default function PriceChart({ symbol = "SOL/USD" }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#a0a0a0",
      },
      grid: {
        vertLines: { color: "rgba(255, 105, 180, 0.08)" },
        horzLines: { color: "rgba(255, 105, 180, 0.08)" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(255, 105, 180, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#ff69b4",
        },
        horzLine: {
          color: "rgba(255, 105, 180, 0.4)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#ff69b4",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 105, 180, 0.2)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "rgba(255, 105, 180, 0.2)",
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

    // Add the line series with pink glow effect
    const lineSeries = chart.addLineSeries({
      color: "#ff69b4",
      lineWidth: 3,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
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
      setCurrentPrice(lastPrice);

      // Calculate price change percentage
      const firstPrice = initialData[0].value;
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      setPriceChange(change);
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

    // Simulate real-time price updates
    const updateInterval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000) as Time;
      const lastData = seriesRef.current?.data();

      if (lastData && lastData.length > 0) {
        const lastPoint = lastData[lastData.length - 1] as LineData;
        const newPrice = lastPoint.value + (Math.random() - 0.5) * 50;

        seriesRef.current?.update({
          time: now,
          value: newPrice,
        });

        setCurrentPrice(newPrice);

        // Update price change
        const firstPoint = lastData[0] as LineData;
        const change = ((newPrice - firstPoint.value) / firstPoint.value) * 100;
        setPriceChange(change);
      }
    }, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(updateInterval);
      chart.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-full chart-container">
      {/* Symbol and price display */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-white">{symbol}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              priceChange >= 0
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {priceChange >= 0 ? "+" : ""}
            {priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Current price badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="price-badge flex items-center gap-2">
          <span className="font-mono font-bold text-white">
            ${currentPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      />

      {/* Live indicator */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-pulse-text-secondary">Live</span>
      </div>
    </div>
  );
}
