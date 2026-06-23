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
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-mono font-medium text-white">{symbol}</h1>
            {profile && (
              <span className="text-xs text-zinc-500 mt-0.5">{profile.name}</span>
            )}
          </div>
          {quote && (
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl font-mono font-medium text-white">
                ${quote.c.toFixed(2)}
              </span>
              <span className={`font-mono text-sm ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? '+' : ''}{quote.d.toFixed(2)} ({isUp ? '+' : ''}{quote.dp.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        <WatchlistButton symbol={symbol} />
      </div>

      <div className="mb-6">
        <StockChart data={candles} height={420} />
      </div>

      {quote && (
        <div className="border border-zinc-800 rounded p-4 mb-6">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Key Statistics</h2>
          <div className="grid grid-cols-4 gap-4">
            <Stat label="Open" value={`$${quote.o.toFixed(2)}`} />
            <Stat label="High" value={`$${quote.h.toFixed(2)}`} />
            <Stat label="Low" value={`$${quote.l.toFixed(2)}`} />
            <Stat label="Prev. Close" value={`$${quote.pc.toFixed(2)}`} />
          </div>
        </div>
      )}

      {profile && (
        <div className="border border-zinc-800 rounded p-4">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Company</h2>
          <div className="grid grid-cols-4 gap-4">
            <Stat label="Industry" value={profile.finnhubIndustry || '—'} />
            <Stat label="Exchange" value={profile.exchange || '—'} />
            <Stat label="IPO" value={profile.ipo || '—'} />
            <Stat label="Market" value={profile.market || '—'} />
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-600 mb-0.5">{label}</div>
      <div className="text-sm font-mono text-zinc-300">{value}</div>
    </div>
  )
}
