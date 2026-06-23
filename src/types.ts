export interface StockQuote {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
}

export interface StockProfile {
  name: string
  ticker: string
  market: string
  ipo: string
  logo: string
  weburl: string
  finnhubIndustry: string
  exchange: string
}

export interface SearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface WatchlistItem {
  id: string
  user_id: string
  symbol: string
  created_at: string
}
