import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getQuote,
  getProfile,
  getCandles,
  generateMockQuote,
  generateMockProfile,
  generateMockCandles,
} from '../services/finnhub'
import type { StockQuote, StockProfile, CandleData } from '../types'
import StockChart from '../components/StockChart'
import WatchlistButton from '../components/WatchlistButton'
import TradeCard from '../components/TradeCard'
import { ArrowLeft } from 'lucide-react'

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [profile, setProfile] = useState<StockProfile | null>(null)
  const [candles, setCandles] = useState<CandleData[]>([])
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
        const [q, p, c] = await Promise.all([
          getQuote(symbol).catch(() => null),
          getProfile(symbol).catch(() => null),
          getCandles(symbol, 'D', 365).catch(() => null),
        ])

        if (mountedRef.current) {
          setQuote(q || generateMockQuote(symbol))
          setProfile(p || generateMockProfile(symbol))
          setCandles(c && c.length > 0 ? c : generateMockCandles(symbol, 365))
          setLoading(false)
        }
      } catch {
        if (mountedRef.current) {
          setQuote(generateMockQuote(symbol))
          setProfile(generateMockProfile(symbol))
          setCandles(generateMockCandles(symbol, 365))
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
        <div className="text-zinc-600 text-xs font-mono">Loading {symbol}...</div>
      </div>
    )
  }

  const isUp = quote ? quote.dp >= 0 : true

  const formatCash = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

  return (
    <div className="w-full space-y-6">
      {/* Back + header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft size={12} />
          Back
        </button>
        <WatchlistButton symbol={symbol} />
      </div>

      {/* Title row */}
      <div className="flex items-baseline justify-between border-b border-[#161619] pb-5">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-mono font-medium text-white/90 tracking-tight">{symbol}</h1>
            {profile && (
              <span className="text-sm text-zinc-500">{profile.name}</span>
            )}
          </div>
          {quote && (
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-3xl font-mono tabular-nums font-medium text-white/90 tracking-tight">
                ${(quote.c ?? 0).toFixed(2)}
              </span>
              <span className={`font-mono text-sm tabular-nums ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? '+' : ''}{(quote.d ?? 0).toFixed(2)} ({isUp ? '+' : ''}{(quote.dp ?? 0).toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: chart + stats */}
        <div className="xl:col-span-8 space-y-6">
          <div className="border border-[#161619] rounded bg-[#020202]/40 overflow-hidden">
            <StockChart data={candles} height={440} />
          </div>

          {quote && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Open" value={formatCash(quote.o ?? 0)} />
              <Stat label="High" value={formatCash(quote.h ?? 0)} />
              <Stat label="Low" value={formatCash(quote.l ?? 0)} />
              <Stat label="Prev. Close" value={formatCash(quote.pc ?? 0)} />
            </div>
          )}

          {profile && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Industry" value={profile.finnhubIndustry || '—'} />
              <Stat label="Exchange" value={profile.exchange || '—'} />
              <Stat label="IPO" value={profile.ipo || '—'} />
              <Stat label="Market" value={profile.market || '—'} />
            </div>
          )}
        </div>

        {/* Right: Trade card */}
        <div className="xl:col-span-4 w-full">
          {quote && <TradeCard symbol={symbol} currentPrice={quote.c ?? 0} />}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#161619] rounded px-4 py-3 bg-[#050507]/20">
      <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono mb-1">{label}</div>
      <div className="text-sm font-mono tabular-nums text-zinc-300">{value}</div>
    </div>
  )
}
