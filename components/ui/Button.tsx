"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingScreen";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-pulse-pink to-pulse-pink-deep
    text-white font-semibold
    shadow-pulse-glow hover:shadow-pulse-glow-strong
    border border-transparent
  `,
  secondary: `
    bg-pulse-bg-secondary
    text-white
    border border-pulse-pink/20
    hover:border-pulse-pink/40 hover:bg-pulse-bg-accent/50
  `,
  ghost: `
    bg-transparent
    text-pulse-text-secondary hover:text-white
    hover:bg-pulse-bg-secondary/50
    border border-transparent
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-red-600
    text-white font-semibold
    shadow-[0_0_20px_rgba(239,68,68,0.3)]
    hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]
    border border-transparent
  `,
  success: `
    bg-gradient-to-r from-green-500 to-green-600
    text-white font-semibold
    shadow-[0_0_20px_rgba(34,197,94,0.3)]
    hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]
    border border-transparent
  `,
  outline: `
    bg-transparent
    text-pulse-pink
    border-2 border-pulse-pink
    hover:bg-pulse-pink/10
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-xs gap-1",
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2",
  xl: "px-8 py-3 text-lg gap-3",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = false,
      className,
      ...props
    },
    ref
  ) => {
    const disabled = isDisabled || isLoading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          "font-medium transition-all duration-200",
          rounded ? "rounded-full" : "rounded-lg",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          disabled && "opacity-50 cursor-not-allowed",
          "tap-target select-none",
          className
        )}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {isLoading && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            className="mr-2"
          >
            <LoadingSpinner size="sm" />
          </motion.span>
        )}

        {!isLoading && leftIcon && (
          <motion.span
            className="flex items-center"
            initial={{ x: -5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            {leftIcon}
          </motion.span>
        )}

        <span>{children}</span>

        {rightIcon && (
          <motion.span
            className="flex items-center"
            initial={{ x: 5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

// Icon button variant
interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  rounded?: boolean;
  label: string; // Accessibility
}

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-14 h-14",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = "ghost",
      size = "md",
      isLoading = false,
      isDisabled = false,
      rounded = true,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const disabled = isDisabled || isLoading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          rounded ? "rounded-full" : "rounded-lg",
          variantStyles[variant],
          iconSizeStyles[size],
          disabled && "opacity-50 cursor-not-allowed",
          "tap-target select-none",
          className
        )}
        disabled={disabled}
        aria-label={label}
        whileHover={disabled ? undefined : { scale: 1.1 }}
        whileTap={disabled ? undefined : { scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {isLoading ? <LoadingSpinner size="sm" /> : icon}
      </motion.button>
    );
  }
);

IconButton.displayName = "IconButton";

// Animated hover card effect
interface HoverCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function HoverCard({
  children,
  className,
  glowColor = "rgba(255, 105, 180, 0.2)",
}: HoverCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-pulse-bg-secondary/50 border border-pulse-pink/10",
        "transition-colors hover:border-pulse-pink/30",
        className
      )}
      whileHover={{
        y: -4,
        boxShadow: `0 10px 40px ${glowColor}`,
        transition: { duration: 0.3 },
      }}
    >
      {children}
    </motion.div>
  );
}

// Animated input wrapper
interface AnimatedInputProps {
  children: ReactNode;
  isFocused?: boolean;
  className?: string;
}

export function AnimatedInput({
  children,
  isFocused = false,
  className,
}: AnimatedInputProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-lg",
        "border-2 transition-colors duration-200",
        isFocused
          ? "border-pulse-pink shadow-[0_0_15px_rgba(255,105,180,0.3)]"
          : "border-pulse-pink/20",
        className
      )}
      animate={{
        scale: isFocused ? 1.01 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Ripple effect button
interface RippleButtonProps extends ButtonProps {
  rippleColor?: string;
}

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, rippleColor = "rgba(255, 255, 255, 0.3)", ...props }, ref) => {
    return (
      <Button ref={ref} {...props}>
        <motion.span
          className="absolute inset-0 rounded-lg"
          whileTap={{
            background: [
              `radial-gradient(circle at center, ${rippleColor} 0%, transparent 0%)`,
              `radial-gradient(circle at center, transparent 0%, ${rippleColor} 100%)`,
            ],
          }}
          transition={{ duration: 0.5 }}
        />
        <span className="relative z-10">{children}</span>
      </Button>
    );
  }
);

RippleButton.displayName = "RippleButton";

export default Button;
