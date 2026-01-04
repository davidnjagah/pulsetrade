"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  href?: string;
  className?: string;
}

// Heartbeat/Pulse line SVG path
const pulsePath = "M0,50 L15,50 L20,50 L25,30 L30,70 L35,20 L40,80 L45,40 L50,50 L55,50 L60,50 L65,50 L70,50 L75,50 L80,50 L85,50 L90,50 L95,50 L100,50";

// Simplified pulse for icon
const simplePulsePath = "M0,12 L4,12 L6,6 L8,18 L10,4 L12,16 L14,10 L16,12 L20,12";

const sizeConfig = {
  sm: {
    container: "w-6 h-6",
    icon: 24,
    textSize: "text-lg",
    gap: "gap-1.5",
  },
  md: {
    container: "w-8 h-8",
    icon: 32,
    textSize: "text-xl",
    gap: "gap-2",
  },
  lg: {
    container: "w-10 h-10",
    icon: 40,
    textSize: "text-2xl",
    gap: "gap-2.5",
  },
  xl: {
    container: "w-16 h-16",
    icon: 64,
    textSize: "text-4xl",
    gap: "gap-4",
  },
};

// Logo icon with animated pulse line
function LogoIcon({
  size = "md",
  isHovered = false,
  animated = true
}: {
  size?: "sm" | "md" | "lg" | "xl";
  isHovered?: boolean;
  animated?: boolean;
}) {
  const config = sizeConfig[size];
  const iconSize = config.icon;

  return (
    <motion.div
      className={`${config.container} rounded-lg bg-gradient-to-br from-pulse-pink to-pulse-pink-deep flex items-center justify-center shadow-pulse-glow relative overflow-hidden`}
      animate={isHovered ? {
        scale: 1.05,
        boxShadow: "0 0 30px rgba(255, 20, 147, 0.6)",
      } : {
        scale: 1,
        boxShadow: "0 0 20px rgba(255, 105, 180, 0.4)",
      }}
      transition={{ duration: 0.3 }}
    >
      <svg
        width={iconSize * 0.6}
        height={iconSize * 0.6}
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Heartbeat/EKG line */}
        <motion.path
          d={simplePulsePath}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: animated ? 0 : 1 }}
          animate={{
            pathLength: 1,
            opacity: isHovered ? [1, 0.6, 1] : 1,
          }}
          transition={animated ? {
            pathLength: { duration: 1, ease: "easeInOut" },
            opacity: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
          } : undefined}
        />

        {/* Glow effect when hovered */}
        {isHovered && (
          <motion.path
            d={simplePulsePath}
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.3}
            filter="blur(2px)"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </svg>

      {/* Pulse ring animation */}
      {animated && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-white/30"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.3, 1.5],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
    </motion.div>
  );
}

// Logo text with gradient
function LogoText({
  size = "md",
  isHovered = false
}: {
  size?: "sm" | "md" | "lg" | "xl";
  isHovered?: boolean;
}) {
  const config = sizeConfig[size];

  return (
    <motion.span
      className={`${config.textSize} font-bold tracking-tight select-none`}
      animate={isHovered ? { x: 2 } : { x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-white">Pulse</span>
      <motion.span
        className="text-pulse-pink"
        animate={isHovered ? {
          textShadow: "0 0 20px rgba(255, 105, 180, 0.6)",
        } : {
          textShadow: "0 0 0px rgba(255, 105, 180, 0)",
        }}
      >
        Trade
      </motion.span>
    </motion.span>
  );
}

// Full Logo component
export default function Logo({
  size = "md",
  showText = true,
  animated = true,
  href = "/",
  className = "",
}: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = sizeConfig[size];

  const logoContent = (
    <motion.div
      className={`flex items-center ${config.gap} ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.98 }}
    >
      <LogoIcon size={size} isHovered={isHovered} animated={animated} />
      {showText && <LogoText size={size} isHovered={isHovered} />}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

// Standalone animated logo for loading screens
export function AnimatedLogo({ size = "xl" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const config = sizeConfig[size];
  const iconSize = config.icon * 2;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Large animated logo icon */}
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pulse-pink to-pulse-pink-deep flex items-center justify-center shadow-pulse-glow-strong"
          animate={{
            boxShadow: [
              "0 0 30px rgba(255, 105, 180, 0.4)",
              "0 0 50px rgba(255, 20, 147, 0.6)",
              "0 0 30px rgba(255, 105, 180, 0.4)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg
            width={iconSize * 0.5}
            height={iconSize * 0.5}
            viewBox="0 0 100 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Full pulse line */}
            <motion.path
              d={pulsePath}
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Glow layer */}
            <motion.path
              d={pulsePath}
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.3}
              filter="blur(4px)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
        </motion.div>

        {/* Pulse rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-2xl border-2 border-pulse-pink/30"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.4, 0.1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      {/* Logo text */}
      <motion.div
        className="text-4xl font-bold tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-white">Pulse</span>
        <motion.span
          className="text-pulse-pink"
          animate={{
            textShadow: [
              "0 0 10px rgba(255, 105, 180, 0.4)",
              "0 0 20px rgba(255, 105, 180, 0.6)",
              "0 0 10px rgba(255, 105, 180, 0.4)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Trade
        </motion.span>
      </motion.div>
    </div>
  );
}

// Compact logo for favicon/small displays
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-lg bg-gradient-to-br from-pulse-pink to-pulse-pink-deep flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={simplePulsePath}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
