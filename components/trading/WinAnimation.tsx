"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "star";
  rotation: number;
}

interface WinAnimationProps {
  isActive: boolean;
  position?: { x: number; y: number };
  winAmount?: number;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
}

const COLORS = [
  "#e6ff00", // Yellow
  "#ffdd00", // Gold
  "#fff700", // Bright yellow
  "#ffd700", // Golden
  "#ff69b4", // Hot pink
  "#00ff88", // Green (win)
];

function generateParticles(count: number, centerX: number, centerY: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: centerX,
    y: centerY,
    angle: (360 / count) * i + Math.random() * 30 - 15,
    speed: 80 + Math.random() * 120,
    size: 4 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: ["circle", "square", "star"][Math.floor(Math.random() * 3)] as Particle["shape"],
    rotation: Math.random() * 360,
  }));
}

function ParticleShape({ shape, size, color }: { shape: Particle["shape"]; size: number; color: string }) {
  if (shape === "circle") {
    return (
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 ${size}px ${color}`,
        }}
      />
    );
  }

  if (shape === "square") {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 ${size}px ${color}`,
        }}
      />
    );
  }

  // Star shape using CSS
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
        filter: `drop-shadow(0 0 ${size / 2}px ${color})`,
      }}
    />
  );
}

export default function WinAnimation({
  isActive,
  position = { x: 50, y: 50 },
  winAmount,
  onComplete,
  particleCount = 30,
  duration = 800,
}: WinAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showRing, setShowRing] = useState(false);
  const [showAmount, setShowAmount] = useState(false);

  const triggerAnimation = useCallback(() => {
    // Generate particles
    setParticles(generateParticles(particleCount, position.x, position.y));
    setShowRing(true);
    setShowAmount(true);

    // Cleanup after animation
    const timer = setTimeout(() => {
      setParticles([]);
      setShowRing(false);
      setShowAmount(false);
      onComplete?.();
    }, duration + 200);

    return () => clearTimeout(timer);
  }, [particleCount, position.x, position.y, duration, onComplete]);

  useEffect(() => {
    if (isActive) {
      const cleanup = triggerAnimation();
      return cleanup;
    }
  }, [isActive, triggerAnimation]);

  if (!isActive && particles.length === 0 && !showRing) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {/* Expanding Ring */}
        {showRing && (
          <motion.div
            className="absolute rounded-full border-4"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              borderColor: "#e6ff00",
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 1,
            }}
            animate={{
              width: 200,
              height: 200,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: duration / 1000,
              ease: "easeOut",
            }}
          />
        )}

        {/* Second Ring (offset) */}
        {showRing && (
          <motion.div
            className="absolute rounded-full border-2"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              borderColor: "#ff69b4",
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 0.8,
            }}
            animate={{
              width: 150,
              height: 150,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: duration / 1000,
              delay: 0.05,
              ease: "easeOut",
            }}
          />
        )}

        {/* Flash Effect */}
        {showRing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(230,255,0,0.6) 0%, transparent 70%)",
            }}
            initial={{
              width: 20,
              height: 20,
              opacity: 1,
            }}
            animate={{
              width: 300,
              height: 300,
              opacity: 0,
            }}
            transition={{
              duration: 0.3,
            }}
          />
        )}

        {/* Particles */}
        {particles.map((particle) => {
          const rad = (particle.angle * Math.PI) / 180;
          const endX = position.x + Math.cos(rad) * particle.speed;
          const endY = position.y + Math.sin(rad) * particle.speed;

          return (
            <motion.div
              key={particle.id}
              className="absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: `${(endX - position.x) * 3}px`,
                y: `${(endY - position.y) * 3}px`,
                scale: 0,
                opacity: 0,
                rotate: particle.rotation + 720,
              }}
              transition={{
                duration: duration / 1000,
                ease: "easeOut",
              }}
            >
              <ParticleShape
                shape={particle.shape}
                size={particle.size}
                color={particle.color}
              />
            </motion.div>
          );
        })}

        {/* Win Amount Text */}
        {showAmount && winAmount !== undefined && (
          <motion.div
            className="absolute font-bold text-2xl"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              color: "#00ff88",
              textShadow: "0 0 20px rgba(0, 255, 136, 0.8), 0 0 40px rgba(0, 255, 136, 0.4)",
            }}
            initial={{
              scale: 0.5,
              opacity: 0,
              y: 0,
            }}
            animate={{
              scale: 1.2,
              opacity: 1,
              y: -50,
            }}
            exit={{
              scale: 0.8,
              opacity: 0,
              y: -80,
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            +${winAmount.toFixed(2)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to trigger win animations easily
export function useWinAnimation() {
  const [animationState, setAnimationState] = useState<{
    isActive: boolean;
    position: { x: number; y: number };
    winAmount?: number;
  }>({
    isActive: false,
    position: { x: 50, y: 50 },
    winAmount: undefined,
  });

  const triggerWin = useCallback(
    (position: { x: number; y: number }, winAmount?: number) => {
      setAnimationState({
        isActive: true,
        position,
        winAmount,
      });
    },
    []
  );

  const resetAnimation = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  return {
    ...animationState,
    triggerWin,
    resetAnimation,
  };
}
