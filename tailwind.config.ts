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
      },
      backgroundImage: {
        'pulse-gradient': 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 50%, #3d1f5c 100%)',
        'pulse-gradient-radial': 'radial-gradient(ellipse at center, #2d1b4e 0%, #1a0a2e 100%)',
      },
      boxShadow: {
        'pulse-glow': '0 0 20px rgba(255, 105, 180, 0.4)',
        'pulse-glow-strong': '0 0 30px rgba(255, 20, 147, 0.6)',
        'bet-chip': '0 4px 12px rgba(230, 255, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'bounce-in': 'bounceIn 0.3s ease-out',
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
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
