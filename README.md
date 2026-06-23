# StockView — Virtual Trading Simulator

Dark, minimalistic stock market webapp with real-time data, paper trading, and portfolio analytics.

## Features

- **Live Market Data** — Real-time quotes, candlestick charts, and company profiles via Finnhub API (with automatic mock fallback)
- **Search & Discover** — Search stocks by symbol or company name with instant price previews and sparkline charts
- **Watchlists** — Persist your favorite symbols to Supabase with one-click toggle
- **Virtual Paper Trading** — Buy and sell stocks with $100,000 demo cash, track your portfolio performance
- **Portfolio Dashboard** — Holdings overview with live P&L, transaction history, and portfolio value tracking
- **Auto-Refresh** — Prices update every 30 seconds across all views
- **Dark Monochromatic UI** — Professional financial aesthetic, zero distractions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Charts | TradingView Lightweight Charts |
| Backend | Supabase (Auth, PostgreSQL, RLS) |
| Data | Finnhub API (free tier) |
| Hosting | GitHub Pages (auto-deployed via GitHub Actions) |

## Getting Started

```bash
git clone https://github.com/Tomiboyg/stockmarket-webapp.git
cd stockmarket-webapp
npm install
```

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FINNHUB_API_KEY=your_finnhub_api_key
```

Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor, then:

```bash
npm run dev
```

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the included workflow.

---

Made by Majner 23.6.2026
