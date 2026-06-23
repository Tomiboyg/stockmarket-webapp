import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { getQuote, generateMockQuote } from '../services/finnhub'
import type { StockQuote } from '../types'
import { Star } from 'lucide-react'

const INDEX_SYMBOLS = ['SPY', 'QQQ', 'DIA']

interface IndexCardProps {
  symbol: string
  quote: StockQuote | null
  loading: boolean
}

function IndexCard({ symbol, quote, loading }: IndexCardProps) {
  if (loading) {
    return (
      <div className="border border-zinc-800 rounded p-4">
        <div className="text-zinc-600 text-xs font-mono">{symbol}</div>
        <div className="text-zinc-700 text-sm mt-2">--</div>
      </div>
    )
  }
  if (!quote) return null
  const isUp = quote.dp >= 0
  return (
    <div className="border border-zinc-800 rounded p-4">
      <div className="text-zinc-500 text-xs font-mono mb-1">{symbol}</div>
      <div className="text-lg font-mono font-medium text-white">
        ${quote.c.toFixed(2)}
      </div>
      <div className={`text-xs font-mono mt-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
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

  useEffect(() => {
    const loadIndexes = async () => {
      const results: Record<string, StockQuote | null> = {}
      for (const sym of INDEX_SYMBOLS) {
        const q = await getQuote(sym)
        results[sym] = q || generateMockQuote(sym)
      }
      setIndexQuotes(results)
      setIndexLoading(false)
    }
    loadIndexes()
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('watchlists')
      .select('symbol')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const symbols = (data || []).map((r) => r.symbol)
        setWatchlist(symbols)
        setWatchlistLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (watchlist.length === 0) return
    const loadQuotes = async () => {
      const results: Record<string, StockQuote | null> = {}
      for (const sym of watchlist) {
        const q = await getQuote(sym)
        results[sym] = q || generateMockQuote(sym)
      }
      setWatchlistQuotes(results)
    }
    loadQuotes()
  }, [watchlist])

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-lg font-medium mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {INDEX_SYMBOLS.map((sym) => (
          <IndexCard key={sym} symbol={sym} quote={indexQuotes[sym]} loading={indexLoading} />
        ))}
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
          <Star size={14} />
          Watchlist
        </h2>

        {watchlistLoading ? (
          <div className="text-zinc-600 text-xs">Loading watchlist...</div>
        ) : watchlist.length === 0 ? (
          <div className="text-zinc-600 text-xs border border-zinc-800 rounded p-4">
            Your watchlist is empty.{' '}
            <button
              onClick={() => navigate('/search')}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
            >
              Search stocks
            </button>
            {' '}to add symbols.
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
                      onClick={() => navigate(`/stock/${sym}`)}
                    >
                      <td className="px-4 py-3 font-mono text-zinc-200">{sym}</td>
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
