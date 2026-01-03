# PulseTrade Design Brief

## Brand Identity

### Name
**PulseTrade** - Feel the market pulse, trade with energy

### Tagline Options
- "Trade the Pulse"
- "Tap. Predict. Win."
- "Feel the Market Pulse"

### Brand Personality
- **Energetic** - High-energy, fast-paced
- **Precise** - Accurate, real-time data
- **Premium** - Dark, sophisticated aesthetic
- **Exciting** - Gamified, rewarding experience

### Target Audience
Crypto traders looking for gamified, fast-paced tap trading

---

## Visual Design System

### Color Palette

#### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Deep Purple | #1a0a2e | Primary background |
| Dark Magenta | #2d1b4e | Secondary background |
| Rich Purple | #3d1f5c | Gradient accent |

#### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Hot Pink | #ff69b4 | Price line, highlights |
| Deep Pink | #ff1493 | Active states, glow |
| Neon Yellow | #e6ff00 | Bet chips, wins |
| Pure Yellow | #ffff00 | Bet chip highlights |

#### UI Colors
| Name | Hex | Usage |
|------|-----|-------|
| White | #ffffff | Primary text |
| Light Gray | #a0a0a0 | Secondary text |
| Pink Glow | rgba(255,105,180,0.15) | Grid lines |
| Dark Toast | rgba(50,50,50,0.9) | Notifications |
| Red Pink | #ff4d6d | Balance icon, alerts |
| Light Pink | #ffb6c1 | Multiplier text |

### Typography
- **Primary Font**: Inter or SF Pro Display (system)
- **Monospace**: JetBrains Mono or SF Mono (for numbers/prices)
- **Headings**: Bold, clean sans-serif
- **Body**: Regular weight, high legibility

### Spacing Scale
```
4px  - xs
8px  - sm
12px - md
16px - lg
24px - xl
32px - 2xl
48px - 3xl
```

---

## Component Specifications

### Price Chart
- **Line Color**: #ff69b4 with glow effect
- **Line Width**: 2-3px
- **Glow**: Drop shadow blur 10px, color #ff1493
- **Animation**: Smooth bezier curves, 60fps
- **Background**: Gradient from #1a0a2e to #2d1b4e
- **Current Price Badge**: Green pill, white text

### Betting Grid
- **Grid Lines**: rgba(255,105,180,0.15)
- **Cell Size**: Responsive, ~60-80px on desktop
- **Multiplier Font**: 14px bold, color #ffb6c1
- **Hover State**: Subtle glow on cell

### Bet Chips
- **Background**: #e6ff00
- **Border Radius**: 8px
- **Size**: 50-70px width
- **Amount Text**: 16px bold, dark text
- **Multiplier Text**: 12px, darker yellow
- **Shadow**: 0 4px 12px rgba(230,255,0,0.3)

### Win Animation
- **Particle Color**: Yellow/gold (#ffdd00)
- **Burst Radius**: 100px expanding
- **Duration**: 800ms
- **Confetti**: Small squares, various yellow shades

### Toast Notifications
- **Background**: rgba(50,50,50,0.95)
- **Border Radius**: 12px
- **Text**: White, checkmark icon green
- **Position**: Top-right, 20px from edges
- **Animation**: Slide in from right, auto-dismiss 4s

### Sidebar Navigation
- **Width**: 60px collapsed, 200px expanded
- **Background**: rgba(26,10,46,0.9)
- **Icons**: 24px, white/gray
- **Active State**: Purple highlight pill

### Chat Panel
- **Width**: 280px
- **Background**: Semi-transparent dark
- **Avatars**: 32px circular
- **Messages**: White text, compact bubbles
- **Bet Badges**: Yellow pills with amount

---

## Animation Guidelines

### Principles
1. **Smooth**: All animations at 60fps
2. **Purposeful**: Animations convey meaning
3. **Quick**: Most animations 200-400ms
4. **GPU-Accelerated**: Use transforms and opacity

### Timing Functions
- **Ease Out**: For elements entering (0.25, 0.1, 0.25, 1)
- **Ease In**: For elements leaving (0.55, 0.055, 0.675, 0.19)
- **Bounce**: For celebrations (spring physics)

### Key Animations
| Element | Animation | Duration |
|---------|-----------|----------|
| Price Line | Continuous draw | Real-time |
| Bet Placement | Scale up + bounce | 300ms |
| Win Celebration | Particle burst | 800ms |
| Toast Enter | Slide right | 200ms |
| Toast Exit | Fade out | 150ms |
| Balance Change | Number roll | 400ms |
| Grid Multiplier | Fade transition | 200ms |

---

## Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Mobile Considerations
- Full-width chart
- Collapsible sidebar (hamburger menu)
- Bottom sheet for chat
- Larger tap targets (min 44px)
- Simplified grid (fewer visible cells)

---

## Inspiration References

### Apps to Study
1. **Apollo** - Information density done right
2. **Things 3** - Minimal, functional beauty
3. **Superhuman** - Gesture-driven, fast
4. **Linear** - Speed and polish
5. **Robinhood** - Trading UX patterns

### Aesthetic Keywords
- Cyberpunk
- Neon
- Dark mode
- Glassmorphism (subtle)
- High contrast
- Data-rich

---

## Design Files Location
```
/design
  /figma-exports/
  /assets/
    /logo/
    /icons/
    /images/
```

---
