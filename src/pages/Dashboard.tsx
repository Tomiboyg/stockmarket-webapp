import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { getQuote, generateMockQuote } from '../services/finnhub'
import type { StockQuote } from '../types'
import { Star, Search } from 'lucide-react'

const INDEX_SYMBOLS = ['SPY', 'QQQ', 'DIA']

function IndexCard({ symbol, quote, loading }: { symbol: string; quote: StockQuote | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded px-4 py-3">
        <div className="text-zinc-600 text-xs font-mono">{symbol}</div>
        <div className="text-zinc-700 text-sm mt-1">--</div>
      </div>
    )
  }
  if (!quote) return null
  const isUp = quote.dp >= 0
  return (
    <div className="border border-zinc-800 rounded px-4 py-3 hover:border-zinc-700 transition-colors">
      <div className="text-zinc-500 text-xs font-mono tracking-wide">{symbol}</div>
      <div className="text-lg font-mono font-medium text-white mt-0.5">${quote.c.toFixed(2)}</div>
      <div className={`text-xs font-mono mt-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isUp ? '+' : ''}{quote.dp.toFixed(2)}%
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [indexQuotes, setIndexQuotes] = useState<Record<string, StockQuote | null>>({})
  const [indexLoading, setIndexLoading] = useState(true)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, StockQuote | null>>({})
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const load = async () => {
      const results: Record<string, StockQuote | null> = {}
      for (const sym of INDEX_SYMBOLS) {
        try {
          const q = await getQuote(sym)
          results[sym] = q || generateMockQuote(sym)
        } catch {
          results[sym] = generateMockQuote(sym)
        }
      }
      if (mountedRef.current) {
        setIndexQuotes(results)
        setIndexLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!user) {
      setWatchlistLoading(false)
      return
    }
    const load = async () => {
      try {
        const { data } = await supabase.from('watchlists').select('symbol').eq('user_id', user.id)
        if (mountedRef.current) {
          setWatchlist((data || []).map((r) => r.symbol))
          setWatchlistLoading(false)
        }
      } catch {
        if (mountedRef.current) setWatchlistLoading(false)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    if (watchlist.length === 0) return
    const load = async () => {
      const results: Record<string, StockQuote | null> = {}
      for (const sym of watchlist) {
        try {
          const q = await getQuote(sym)
          results[sym] = q || generateMockQuote(sym)
        } catch {
          results[sym] = generateMockQuote(sym)
        }
      }
      if (mountedRef.current) setWatchlistQuotes(results)
    }
    load()
  }, [watchlist])

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Overview</h1>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {INDEX_SYMBOLS.map((sym) => (
          <IndexCard key={sym} symbol={sym} quote={indexQuotes[sym]} loading={indexLoading} />
        ))}
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Star size={14} />
            Watchlist
          </h2>
          {watchlist.length > 0 && (
            <button
              onClick={() => navigate('/search')}
              className="text-xs text-zinc-600 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <Search size={12} />
              Add symbols
            </button>
          )}
        </div>

        {watchlistLoading ? (
          <div className="text-zinc-600 text-xs border border-zinc-800 rounded p-4">Loading...</div>
        ) : watchlist.length === 0 ? (
          <div className="border border-zinc-800 rounded p-5 text-center">
            <Star size={20} className="text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-xs mb-3">Your watchlist is empty</p>
            <button
              onClick={() => navigate('/search')}
              className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1.5 transition-colors cursor-pointer"
            >
              Search stocks
            </button>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                  <th className="text-left px-4 py-2.5 font-medium">Symbol</th>
                  <th className="text-right px-4 py-2.5 font-medium">Price</th>
                  <th className="text-right px-4 py-2.5 font-medium">Change</th>
                  <th className="text-right px-4 py-2.5 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((sym) => {
                  const q = watchlistQuotes[sym]
                  if (!q) return null
                  const isUp = q.dp >= 0
                  return (
                    <tr
                      key={sym}
                      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/stock/${encodeURIComponent(sym)}`)}
                    >
                      <td className="px-4 py-3 font-mono text-zinc-200 text-sm">{sym}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-100">${q.c.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? '+' : ''}{q.d.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? '+' : ''}{q.dp.toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
