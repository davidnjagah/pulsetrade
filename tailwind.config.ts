import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary backgrounds
        'pulse-bg': '#1a0a2e',
        'pulse-bg-secondary': '#2d1b4e',
        'pulse-bg-accent': '#3d1f5c',

        // Accent colors
        'pulse-pink': '#ff69b4',
        'pulse-pink-deep': '#ff1493',
        'pulse-yellow': '#e6ff00',
        'pulse-yellow-pure': '#ffff00',

        // UI colors
        'pulse-text': '#ffffff',
        'pulse-text-secondary': '#a0a0a0',
        'pulse-multiplier': '#ffb6c1',
        'pulse-red': '#ff4d6d',
        'pulse-nav-active': '#4a3f6b',
        'pulse-balance-icon': '#ff4d6d',

        // Additional accent colors
        'pulse-green': '#00ff88',
        'pulse-cyan': '#00ffcc',
        'pulse-orange': '#ffa500',
      },
      backgroundImage: {
        'pulse-gradient': 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 50%, #3d1f5c 100%)',
        'pulse-gradient-radial': 'radial-gradient(ellipse at center, #2d1b4e 0%, #1a0a2e 100%)',
        'pulse-gradient-diagonal': 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #3d1f5c 100%)',
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #ff69b4 0deg, #ff1493 180deg, #ff69b4 360deg)',
      },
      boxShadow: {
        'pulse-glow': '0 0 20px rgba(255, 105, 180, 0.4)',
        'pulse-glow-strong': '0 0 30px rgba(255, 20, 147, 0.6)',
        'pulse-glow-intense': '0 0 50px rgba(255, 20, 147, 0.8)',
        'bet-chip': '0 4px 12px rgba(230, 255, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(255, 105, 180, 0.15)',
        'win-glow': '0 0 40px rgba(0, 255, 136, 0.4)',
        'loss-glow': '0 0 40px rgba(239, 68, 68, 0.4)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-bottom': 'slideInBottom 0.3s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 105, 180, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 20, 147, 0.6)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInBottom: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth-in': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};

export default config;
