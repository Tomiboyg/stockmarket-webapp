import type { StockQuote, StockProfile, SearchResult, CandleData } from '../types'

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY
const BASE_URL = 'https://finnhub.io/api/v1'

let requestCount = 0
const RATE_LIMIT = 55
const WINDOW_MS = 60_000
let windowStart = Date.now()

function checkRateLimit(): boolean {
  const now = Date.now()
  if (now - windowStart > WINDOW_MS) {
    requestCount = 0
    windowStart = now
  }
  requestCount++
  return requestCount <= RATE_LIMIT
}

async function fetchJson<T>(endpoint: string): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Finnhub API key not configured. Using mock data.')
    return null
  }
  if (!checkRateLimit()) {
    console.warn('API rate limit approach. Falling back to mock data.')
    return null
  }
  try {
    const res = await fetch(`${BASE_URL}${endpoint}&token=${API_KEY}`)
    if (res.status === 429) {
      console.warn('Finnhub 429 rate limited.')
      return null
    }
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return []
  const data = await fetchJson<{ result: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`)
  if (!data?.result) return []
  return data.result.filter((r) => r.type === 'Common Stock' || r.type === 'ETF' || r.type === 'REIT').slice(0, 10)
}

export async function getQuote(symbol: string): Promise<StockQuote | null> {
  return fetchJson<StockQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`)
}

export async function getProfile(symbol: string): Promise<StockProfile | null> {
  return fetchJson<StockProfile>(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`)
}

export async function getCandles(
  symbol: string,
  resolution: 'D' | 'W' | 'M' = 'D',
  daysBack = 365
): Promise<CandleData[] | null> {
  const now = Math.floor(Date.now() / 1000)
  const from = now - daysBack * 86400
  const data = await fetchJson<{
    c: number[]
    h: number[]
    l: number[]
    o: number[]
    t: number[]
    v: number[]
    s: string
  }>(`/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}`)

  if (!data || data.s === 'no_data') return null
  if (!data.c || !data.t || data.c.length === 0) return null

  return data.t.map((time, i) => ({
    time,
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }))
}

export function generateMockQuote(symbol: string): StockQuote {
  const basePrice = symbol.length * 25 + Math.random() * 50
  const change = (Math.random() - 0.5) * basePrice * 0.04
  return {
    c: basePrice + change,
    d: change,
    dp: (change / basePrice) * 100,
    h: basePrice + Math.abs(change) * 1.5 + Math.random() * 2,
    l: basePrice - Math.abs(change) * 1.5 - Math.random() * 2,
    o: basePrice - change * 0.5,
    pc: basePrice,
  }
}

export function generateMockCandles(symbol: string, count = 365): CandleData[] {
  const now = Math.floor(Date.now() / 1000)
  const daySeconds = 86400
  let price = symbol.length * 25 + Math.random() * 50
  const volatility = price * 0.025

  return Array.from({ length: count }, (_, i) => {
    const time = now - (count - 1 - i) * daySeconds
    const change = (Math.random() - 0.48) * volatility
    const open = price
    const close = +(price + change).toFixed(2)
    const absChange = Math.abs(change)
    const high = +(Math.max(open, close) + Math.random() * absChange * 0.5).toFixed(2)
    const low = +(Math.min(open, close) - Math.random() * absChange * 0.5).toFixed(2)
    price = close
    return {
      time,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000 + 1000000),
    }
  })
}

export function generateMockProfile(symbol: string): StockProfile {
  const names: Record<string, string> = {
    AAPL: 'Apple Inc.',
    MSFT: 'Microsoft Corporation',
    GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.',
    TSLA: 'Tesla Inc.',
    NVDA: 'NVIDIA Corporation',
    META: 'Meta Platforms Inc.',
    SPY: 'SPDR S&P 500 ETF Trust',
    QQQ: 'Invesco QQQ Trust',
    DIA: 'SPDR Dow Jones Industrial Average ETF',
  }
  return {
    name: names[symbol] || `${symbol} Corporation`,
    ticker: symbol,
    market: 'us_market',
    ipo: '2000-01-01',
    logo: '',
    weburl: `https://www.${symbol.toLowerCase()}.com`,
    finnhubIndustry: 'Technology',
    exchange: 'NASDAQ',
  }
}

export function generateMockSearchResults(query: string): SearchResult[] {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY', 'QQQ', 'DIA',
    'AMD', 'INTC', 'NFLX', 'DIS', 'BA', 'JPM', 'V', 'WMT', 'JNJ', 'PG',
    'MA', 'UNH', 'HD', 'PYPL', 'ADBE', 'CRM', 'CMCSA', 'NFLX', 'XOM', 'CVX',
    'COST', 'ABNB', 'UBER', 'SQ', 'SNAP', 'PINS', 'SHOP', 'ZM', 'DOCU', 'ROKU']
  const upper = query.toUpperCase()
  const matches = symbols.filter((s) => s.includes(upper)).slice(0, 8)
  if (matches.length === 0) {
    return [{ description: `${query} Corporation`, displaySymbol: query.toUpperCase(), symbol: query.toUpperCase(), type: 'Common Stock' }]
  }
  return matches.map((s) => ({
    description: `${s} - Mock description`,
    displaySymbol: s,
    symbol: s,
    type: 'Common Stock',
  }))
}
