# PulseTrade

Real-time cryptocurrency tap trading platform where users place bets on price movements using a grid-based prediction system.

## Features

- Live price charts with real-time updates
- Grid-based betting system with dynamic multipliers
- Instant win/loss feedback with animations
- Real-time chat and social features
- Leaderboard rankings

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime, WebSocket
- **Price Feed**: Helius/Pyth (Solana)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## Project Structure

```
pulsetrade/
├── .ai-team/           # AI team coordination files
├── app/                # Next.js app router pages
├── components/         # React components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
├── design/             # Design assets
└── backend/            # Backend services
```

## Development Workflow

This project uses an AI-assisted development workflow. See `.ai-team/` for:

- `DAILY_LOG.md` - Development progress
- `sprint-plan.md` - Sprint tasks and goals
- `*_CONTEXT.md` - Team member contexts

## License

Proprietary - All rights reserved
