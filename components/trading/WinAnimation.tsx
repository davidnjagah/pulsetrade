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
  shape: "circle" | "square" | "star" | "diamond" | "heart";
  rotation: number;
  rotationSpeed: number;
  delay: number;
  gravity: number;
}

interface WinAnimationProps {
  isActive: boolean;
  position?: { x: number; y: number };
  winAmount?: number;
  onComplete?: () => void;
  onSoundTrigger?: () => void; // Event emit for sound effect
  particleCount?: number;
  duration?: number;
  intensity?: "normal" | "big" | "jackpot";
}

// Enhanced color palette with more variety
const COLORS = [
  "#e6ff00", // Neon Yellow
  "#ffdd00", // Gold
  "#fff700", // Bright yellow
  "#ffd700", // Golden
  "#ff69b4", // Hot pink
  "#00ff88", // Green (win)
  "#00ffcc", // Cyan
  "#ff6b6b", // Coral
  "#ffa500", // Orange
  "#ff1493", // Deep pink
];

// Confetti specific colors (more celebratory)
const CONFETTI_COLORS = [
  "#e6ff00",
  "#ff69b4",
  "#00ff88",
  "#ffd700",
  "#ff6b6b",
  "#00ffcc",
  "#ffa500",
  "#ff1493",
  "#7c3aed",
  "#06b6d4",
];

function generateParticles(
  count: number,
  centerX: number,
  centerY: number,
  intensity: "normal" | "big" | "jackpot" = "normal"
): Particle[] {
  const speedMultiplier = intensity === "jackpot" ? 1.5 : intensity === "big" ? 1.25 : 1;
  const sizeMultiplier = intensity === "jackpot" ? 1.3 : intensity === "big" ? 1.15 : 1;

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: centerX,
    y: centerY,
    angle: (360 / count) * i + Math.random() * 40 - 20,
    speed: (100 + Math.random() * 150) * speedMultiplier,
    size: (5 + Math.random() * 10) * sizeMultiplier,
    color: i % 2 === 0
      ? COLORS[Math.floor(Math.random() * COLORS.length)]
      : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: ["circle", "square", "star", "diamond", "heart"][Math.floor(Math.random() * 5)] as Particle["shape"],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 1080, // Random rotation direction
    delay: Math.random() * 0.15, // Staggered start
    gravity: 0.3 + Math.random() * 0.4, // Varying gravity
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
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}dd)`,
          boxShadow: `0 0 ${size * 1.5}px ${color}88`,
        }}
      />
    );
  }

  if (shape === "square") {
    return (
      <div
        className="rounded-sm"
        style={{
          width: size,
          height: size * 0.6,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 ${size}px ${color}66`,
        }}
      />
    );
  }

  if (shape === "diamond") {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: `linear-gradient(45deg, ${color}, ${color}cc)`,
          transform: "rotate(45deg)",
          boxShadow: `0 0 ${size}px ${color}88`,
        }}
      />
    );
  }

  if (shape === "heart") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }

  // Star shape using SVG for better rendering
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function WinAnimation({
  isActive,
  position = { x: 50, y: 50 },
  winAmount,
  onComplete,
  onSoundTrigger,
  particleCount = 50, // Increased from 30
  duration = 1000,    // Increased from 800
  intensity = "normal",
}: WinAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showRing, setShowRing] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [showStarburst, setShowStarburst] = useState(false);

  // Determine intensity based on win amount
  const effectiveIntensity = winAmount
    ? winAmount >= 100 ? "jackpot" : winAmount >= 50 ? "big" : intensity
    : intensity;

  const effectiveParticleCount = effectiveIntensity === "jackpot" ? 80
    : effectiveIntensity === "big" ? 60 : particleCount;

  const triggerAnimation = useCallback(() => {
    // Trigger sound effect immediately
    onSoundTrigger?.();

    // Generate particles with intensity
    setParticles(generateParticles(effectiveParticleCount, position.x, position.y, effectiveIntensity));
    setShowRing(true);
    setShowAmount(true);
    setShowStarburst(true);

    // Cleanup after animation
    const timer = setTimeout(() => {
      setParticles([]);
      setShowRing(false);
      setShowAmount(false);
      setShowStarburst(false);
      onComplete?.();
    }, duration + 400);

    return () => clearTimeout(timer);
  }, [effectiveParticleCount, effectiveIntensity, position.x, position.y, duration, onComplete, onSoundTrigger]);

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
        {/* Screen flash for jackpot */}
        {showStarburst && effectiveIntensity === "jackpot" && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, rgba(230,255,0,0.15) 0%, transparent 60%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Starburst rays */}
        {showStarburst && (
          <motion.div
            className="absolute"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 2], rotate: 45 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <svg width="300" height="300" viewBox="-150 -150 300 300">
              {[...Array(12)].map((_, i) => (
                <motion.line
                  key={i}
                  x1="0"
                  y1="0"
                  x2="150"
                  y2="0"
                  stroke="#e6ff00"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                  transform={`rotate(${i * 30})`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                />
              ))}
            </svg>
          </motion.div>
        )}

        {/* Primary expanding ring */}
        {showRing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              border: "4px solid #e6ff00",
              boxShadow: "0 0 30px #e6ff00, inset 0 0 30px rgba(230,255,0,0.3)",
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 1,
            }}
            animate={{
              width: effectiveIntensity === "jackpot" ? 350 : 250,
              height: effectiveIntensity === "jackpot" ? 350 : 250,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: duration / 1000,
              ease: [0.25, 0.46, 0.45, 0.94], // Custom ease
            }}
          />
        )}

        {/* Secondary ring (pink) */}
        {showRing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              border: "3px solid #ff69b4",
              boxShadow: "0 0 20px rgba(255,105,180,0.6)",
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 0.9,
            }}
            animate={{
              width: effectiveIntensity === "jackpot" ? 280 : 180,
              height: effectiveIntensity === "jackpot" ? 280 : 180,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: duration / 1000,
              delay: 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        )}

        {/* Third ring (green) */}
        {showRing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              border: "2px solid #00ff88",
              boxShadow: "0 0 15px rgba(0,255,136,0.5)",
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 0.7,
            }}
            animate={{
              width: effectiveIntensity === "jackpot" ? 200 : 120,
              height: effectiveIntensity === "jackpot" ? 200 : 120,
              opacity: 0,
            }}
            transition={{
              duration: duration / 1000,
              delay: 0.15,
              ease: "easeOut",
            }}
          />
        )}

        {/* Central flash burst */}
        {showRing && (
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(230,255,0,0.8) 0%, rgba(255,105,180,0.4) 40%, transparent 70%)",
            }}
            initial={{
              width: 30,
              height: 30,
              opacity: 1,
            }}
            animate={{
              width: effectiveIntensity === "jackpot" ? 400 : 300,
              height: effectiveIntensity === "jackpot" ? 400 : 300,
              opacity: 0,
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
          />
        )}

        {/* Particles with physics */}
        {particles.map((particle) => {
          const rad = (particle.angle * Math.PI) / 180;
          const distance = particle.speed * (effectiveIntensity === "jackpot" ? 1.5 : 1);
          const endX = Math.cos(rad) * distance * 3;
          const endY = Math.sin(rad) * distance * 3 + (particle.gravity * 150); // Add gravity

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
                scale: 0,
                opacity: 0,
                rotate: 0,
              }}
              animate={{
                x: endX,
                y: endY,
                scale: [0, 1.2, 1, 0.3, 0],
                opacity: [0, 1, 1, 0.6, 0],
                rotate: particle.rotation + particle.rotationSpeed,
              }}
              transition={{
                duration: duration / 1000 + 0.3,
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
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

        {/* Win Amount Text with enhanced animation */}
        {showAmount && winAmount !== undefined && (
          <motion.div
            className="absolute font-bold"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              color: "#00ff88",
              fontSize: effectiveIntensity === "jackpot" ? "3rem" : effectiveIntensity === "big" ? "2.5rem" : "2rem",
              textShadow: `
                0 0 10px rgba(0, 255, 136, 1),
                0 0 20px rgba(0, 255, 136, 0.8),
                0 0 40px rgba(0, 255, 136, 0.6),
                0 0 60px rgba(0, 255, 136, 0.4)
              `,
            }}
            initial={{
              scale: 0,
              opacity: 0,
              y: 20,
            }}
            animate={{
              scale: [0, 1.3, 1],
              opacity: [0, 1, 1],
              y: [-20, -60, -80],
            }}
            exit={{
              scale: 0.8,
              opacity: 0,
              y: -100,
            }}
            transition={{
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
            }}
          >
            <motion.span
              animate={{
                textShadow: [
                  "0 0 10px rgba(0, 255, 136, 1), 0 0 20px rgba(0, 255, 136, 0.8)",
                  "0 0 20px rgba(0, 255, 136, 1), 0 0 40px rgba(0, 255, 136, 0.8), 0 0 60px rgba(230, 255, 0, 0.6)",
                  "0 0 10px rgba(0, 255, 136, 1), 0 0 20px rgba(0, 255, 136, 0.8)",
                ],
              }}
              transition={{ duration: 0.5, repeat: 2, repeatType: "reverse" }}
            >
              +${winAmount.toFixed(2)}
            </motion.span>
          </motion.div>
        )}

        {/* Jackpot extra text */}
        {showAmount && effectiveIntensity === "jackpot" && (
          <motion.div
            className="absolute font-bold text-lg"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
              color: "#e6ff00",
              textShadow: "0 0 10px rgba(230, 255, 0, 0.8)",
            }}
            initial={{ scale: 0, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: [0, 1, 1, 0], y: 20 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            JACKPOT!
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
