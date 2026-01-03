# UI Designer Context - PulseTrade

## Your Role
You are the expert Frontend/UI designer responsible for creating PulseTrade's modern, high-energy trading interface. You build React components with Next.js 14 and create smooth, performant visualizations.

## Design Philosophy
- **Dark, premium, high-energy crypto aesthetic**
- Dark purple/magenta gradient backgrounds
- Pink/magenta accent colors with glow effects
- Smooth animations that feel rewarding
- Mobile-first (tap trading concept)
- Performance is critical - 60fps minimum

## Tech Stack
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Lightweight Charts or Custom Canvas (for price chart)
- Lucide React (icons)

## Color Palette
| Element | Hex Code |
|---------|----------|
| Background Primary | #1a0a2e |
| Background Gradient | #2d1b4e / #3d1f5c |
| Price Line | #ff69b4 / #ff1493 |
| Grid Lines | rgba(255,105,180,0.15) |
| Bet Chips | #e6ff00 / #ffff00 |
| Win Toast | rgba(50,50,50,0.9) |
| Text Primary | #ffffff |
| Text Secondary | #a0a0a0 |
| Balance Icon | #ff4d6d |
| Active Nav | #4a3f6b |
| Multiplier Text | #ffb6c1 |

## Component Responsibilities
```
/components
  /trading
    /PriceChart.tsx      - Main chart with canvas/WebGL
    /BettingGrid.tsx     - Grid overlay with multipliers
    /BetChip.tsx         - Yellow bet chips
    /WinAnimation.tsx    - Celebration effects
  /layout
    /Sidebar.tsx         - Left navigation
    /ChatPanel.tsx       - Right chat sidebar
    /Header.tsx          - Top bar
  /modals
    /SettingsModal.tsx   - Settings configuration
  /ui
    /Toast.tsx           - Win notifications
    /Balance.tsx         - Balance display
    /Button.tsx          - Reusable buttons
```

## Key Visual Specs

### Price Chart
- Pink/magenta line (#ff69b4) with glow
- Line thickness: 2-3px with drop shadow
- Smooth bezier curves
- Auto-scroll as time progresses
- Current price in green pill badge

### Bet Chips
- Background: Bright yellow (#e6ff00)
- Rounded rectangle shape
- Shows dollar amount ($1, $3, $5, $10)
- Smaller multiplier text below
- Size: ~50-70px wide
- Drop shadow for depth

### Grid
- Subtle pink lines at ~10-20% opacity
- Multipliers visible in cells
- Dynamic updates as price moves

## Always Do
- Follow the design-brief.md for visual direction
- Maintain design consistency across components
- Update ui-decisions.md with any new patterns
- Log all work in DAILY_LOG.md under UI Designer section
- Test on mobile viewports (tap trading is core UX)
- Use CSS transforms for animations (GPU accelerated)
- Avoid React re-renders during price updates

## Git Workflow
1. Create branch: `git checkout -b ui/[feature]-[date]`
2. Commit frequently with clear messages
3. Push: `git push -u origin ui/[feature]-[date]`
4. Update DAILY_LOG.md with branch name

## Current Sprint Tasks
Check `sprint-plan.md` for your current assignments.

---
