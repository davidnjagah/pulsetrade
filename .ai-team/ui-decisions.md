# PulseTrade UI Decisions Log

## Design System Decisions

### Date: January 3, 2026

#### Color System
- **Decision**: Use dark purple (#1a0a2e) as primary background
- **Rationale**: Creates premium crypto aesthetic, reduces eye strain for extended trading sessions
- **Alternatives Considered**: Pure black (too harsh), dark blue (too common)

#### Price Line Style
- **Decision**: Pink/magenta (#ff69b4) with glow effect
- **Rationale**: High visibility against dark background, energetic feel matches brand
- **Glow Implementation**: CSS box-shadow or canvas shadow blur

#### Bet Chip Design
- **Decision**: Bright yellow (#e6ff00) rounded rectangles
- **Rationale**: Maximum contrast against dark/pink palette, immediately recognizable
- **Size**: 50-70px width for comfortable tap targets

---

## Component Decisions

### Chart Library
- **Decision**: [TBD - Lightweight Charts vs Custom Canvas]
- **Considerations**:
  - Lightweight Charts: Easier to implement, good performance
  - Custom Canvas: More control, can match exact design specs
- **Rationale**: [To be documented]

### Animation Library
- **Decision**: Framer Motion
- **Rationale**: React-native integration, declarative API, good performance
- **Alternative**: CSS animations for simple transitions, GSAP for complex sequences

### State Management
- **Decision**: [TBD - React Context vs Zustand vs Jotai]
- **Considerations**:
  - Need real-time price updates without re-renders
  - Bet state needs to sync with server
  - User settings need persistence

---

## Pattern Library

### Buttons
```tsx
// Primary button
<button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg">
  Action
</button>

// Ghost button
<button className="border border-pink-500/50 text-pink-500 px-4 py-2 rounded-lg hover:bg-pink-500/10">
  Secondary
</button>
```

### Cards
```tsx
<div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
  {/* Content */}
</div>
```

### Inputs
```tsx
<input
  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
  placeholder="Enter value"
/>
```

---

## Spacing Conventions

- **Component padding**: 16px (lg)
- **Element gaps**: 8px (sm) to 12px (md)
- **Section margins**: 24px (xl) to 32px (2xl)
- **Border radius**: 8px (cards), 12px (modals), full (avatars)

---

## Typography Scale

```css
/* Headings */
.h1 { font-size: 2.25rem; font-weight: 700; } /* 36px */
.h2 { font-size: 1.5rem; font-weight: 600; }  /* 24px */
.h3 { font-size: 1.125rem; font-weight: 600; } /* 18px */

/* Body */
.body-lg { font-size: 1rem; }    /* 16px */
.body-md { font-size: 0.875rem; } /* 14px */
.body-sm { font-size: 0.75rem; }  /* 12px */

/* Price display */
.price { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
```

---

## Responsive Breakpoints Usage

### Mobile (< 768px)
- Full-width chart
- Sidebar collapsed to bottom nav
- Chat as bottom sheet
- Simplified grid (fewer cells)

### Tablet (768px - 1024px)
- Chart with compact sidebar
- Chat panel collapsible
- Full grid visible

### Desktop (> 1024px)
- Full layout with all panels
- Maximum information density

---

## Accessibility Decisions

- **Focus indicators**: Pink outline for interactive elements
- **Color contrast**: All text meets WCAG AA (4.5:1 ratio)
- **Tap targets**: Minimum 44px on mobile
- **Motion**: Respect prefers-reduced-motion
- **Screen readers**: ARIA labels on interactive elements

---

## Future Considerations

- [ ] Dark/light mode toggle (currently dark only)
- [ ] Custom theme colors
- [ ] Compact mode for power users
- [ ] Chart type options (line, candle, area)

---
