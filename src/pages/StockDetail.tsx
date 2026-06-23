import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getQuote,
  getProfile,
  getCandles,
  getNews,
  generateMockQuote,
  generateMockProfile,
  generateMockCandles,
  generateMockNews,
} from '../services/finnhub'
import type { StockQuote, StockProfile, CandleData, NewsItem } from '../types'
import StockChart from '../components/StockChart'
import WatchlistButton from '../components/WatchlistButton'
import TradeCard from '../components/TradeCard'
import { ArrowLeft, Clock } from 'lucide-react'

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [profile, setProfile] = useState<StockProfile | null>(null)
  const [candles, setCandles] = useState<CandleData[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!symbol) return
    setLoading(true)

    const load = async () => {
      try {
        const [q, p, c, n] = await Promise.all([
          getQuote(symbol).catch(() => null),
          getProfile(symbol).catch(() => null),
          getCandles(symbol, 'D', 365).catch(() => null),
          getNews(symbol).catch(() => [] as NewsItem[]),
        ])

        if (mountedRef.current) {
          setQuote(q || generateMockQuote(symbol))
          setProfile(p || generateMockProfile(symbol))
          setCandles(c && c.length > 0 ? c : generateMockCandles(symbol, 365))
          setNews(n.length > 0 ? n : generateMockNews(symbol))
          setLoading(false)
        }
      } catch {
        if (mountedRef.current) {
          setQuote(generateMockQuote(symbol))
          setProfile(generateMockProfile(symbol))
          setCandles(generateMockCandles(symbol, 365))
          setNews(generateMockNews(symbol))
          setLoading(false)
        }
      }
    }
    load()

    const refreshQuote = async () => {
      if (!symbol) return
      try {
        const q = await getQuote(symbol)
        if (mountedRef.current) setQuote(q || generateMockQuote(symbol))
      } catch {}
    }
    const id = setInterval(refreshQuote, 30000)
    return () => { clearInterval(id) }
  }, [symbol])

  if (!symbol) return null

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-zinc-600 text-sm">Loading {symbol}...</div>
      </div>
    )
  }

  const isUp = quote ? quote.dp >= 0 : true

  const formatNewsTime = (ts: number) => {
    const d = new Date(ts)
    const now = Date.now()
    const diff = now - ts
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-6 max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-mono font-medium text-white">{symbol}</h1>
            {profile && (
              <span className="text-sm text-zinc-500">{profile.name}</span>
            )}
          </div>
          {quote && (
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl font-mono tabular-nums font-medium text-white">
                ${(quote.c ?? 0).toFixed(2)}
              </span>
              <span className={`font-mono text-sm tabular-nums ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? '+' : ''}{(quote.d ?? 0).toFixed(2)} ({isUp ? '+' : ''}{(quote.dp ?? 0).toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        <WatchlistButton symbol={symbol} />
      </div>

      <div className="mb-6">
        <StockChart data={candles} height={420} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {quote && (
            <div className="border border-zinc-800 rounded p-4 mb-6">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Statistics</h2>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Open" value={`$${(quote.o ?? 0).toFixed(2)}`} />
                <Stat label="High" value={`$${(quote.h ?? 0).toFixed(2)}`} />
                <Stat label="Low" value={`$${(quote.l ?? 0).toFixed(2)}`} />
                <Stat label="Prev. Close" value={`$${(quote.pc ?? 0).toFixed(2)}`} />
              </div>
            </div>
          )}

          {profile && (
            <div className="border border-zinc-800 rounded p-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Company</h2>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Industry" value={profile.finnhubIndustry || '—'} />
                <Stat label="Exchange" value={profile.exchange || '—'} />
                <Stat label="IPO" value={profile.ipo || '—'} />
                <Stat label="Market" value={profile.market || '—'} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {quote && <TradeCard symbol={symbol} currentPrice={quote.c ?? 0} />}

          <div className="border border-zinc-800 rounded p-4">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">News</h2>
            {news.length === 0 ? (
              <p className="text-zinc-600 text-xs">No recent news</p>
            ) : (
              <div className="space-y-3">
                {news.map((item, i) => (
                  <div key={i} className="pb-3 border-b border-zinc-800/50 last:border-0 last:pb-0">
                    {item.url && item.url !== '#' ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-300 hover:text-white leading-relaxed block transition-colors"
                      >
                        {item.headline}
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-300 leading-relaxed block">{item.headline}</span>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-zinc-600">
                      <span className="text-[10px]">{item.source}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[10px] flex items-center gap-1">
                        <Clock size={10} />
                        {formatNewsTime(item.datetime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-zinc-600 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-mono tabular-nums text-zinc-300 mt-0.5">{value}</div>
    </div>
  )
}
