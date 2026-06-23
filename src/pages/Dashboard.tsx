import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getQuote, generateMockQuote } from '../services/finnhub'
import type { StockQuote } from '../types'
import { Star, Search, Wallet, RefreshCw, Clock } from 'lucide-react'

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
      <div className="text-lg font-mono font-medium text-white mt-0.5">${(quote.c ?? 0).toFixed(2)}</div>
      <div className={`text-xs font-mono mt-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isUp ? '+' : ''}{(quote.dp ?? 0).toFixed(2)}%
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { cash, holdings, transactions, resetPortfolio } = usePortfolio()
  const navigate = useNavigate()
  const [indexQuotes, setIndexQuotes] = useState<Record<string, StockQuote | null>>({})
  const [indexLoading, setIndexLoading] = useState(true)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, StockQuote | null>>({})
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [holdingQuotes, setHoldingQuotes] = useState<Record<string, StockQuote | null>>({})
  const [txOpen, setTxOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const mountedRef = useRef(true)
  const watchlistRef = useRef(watchlist)
  const holdingsRef = useRef(holdings)

  watchlistRef.current = watchlist
  holdingsRef.current = holdings

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

  useEffect(() => {
    if (holdings.length === 0) return
    const load = async () => {
      const results: Record<string, StockQuote | null> = {}
      for (const h of holdings) {
        try {
          const q = await getQuote(h.symbol)
          results[h.symbol] = q || generateMockQuote(h.symbol)
        } catch {
          results[h.symbol] = generateMockQuote(h.symbol)
        }
      }
      if (mountedRef.current) setHoldingQuotes(results)
    }
    load()
  }, [holdings])

  useEffect(() => {
    const refresh = async () => {
      if (!mountedRef.current) return

      const idx: Record<string, StockQuote | null> = {}
      for (const sym of INDEX_SYMBOLS) {
        try { idx[sym] = await getQuote(sym) || generateMockQuote(sym) }
        catch { idx[sym] = generateMockQuote(sym) }
      }
      if (mountedRef.current) setIndexQuotes(idx)

      const wl = watchlistRef.current
      if (wl.length > 0) {
        const wlResults: Record<string, StockQuote | null> = {}
        for (const sym of wl) {
          try { wlResults[sym] = await getQuote(sym) || generateMockQuote(sym) }
          catch { wlResults[sym] = generateMockQuote(sym) }
        }
        if (mountedRef.current) setWatchlistQuotes(wlResults)
      }

      const hl = holdingsRef.current
      if (hl.length > 0) {
        const hlResults: Record<string, StockQuote | null> = {}
        for (const h of hl) {
          try { hlResults[h.symbol] = await getQuote(h.symbol) || generateMockQuote(h.symbol) }
          catch { hlResults[h.symbol] = generateMockQuote(h.symbol) }
        }
        if (mountedRef.current) setHoldingQuotes(hlResults)
      }
    }

    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [])

  const portfolioValue = holdings.reduce((sum, h) => {
    const q = holdingQuotes[h.symbol]
    const price = q ? q.c : h.average_buy_price
    return sum + h.shares * price
  }, cash)

  const totalGainAbs = portfolioValue - 100000
  const totalGainPct = ((portfolioValue - 100000) / 100000) * 100
  const hasGain = totalGainAbs >= 0

  const formatCash = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

  const formatTxTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const handleReset = async () => {
    await resetPortfolio()
    setResetConfirm(false)
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">Overview</h1>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {INDEX_SYMBOLS.map((sym) => (
          <IndexCard key={sym} symbol={sym} quote={indexQuotes[sym]} loading={indexLoading} />
        ))}
      </div>

      {/* Paper Portfolio Section */}
      {user && (
        <div className="border-t border-zinc-800 pt-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Wallet size={14} />
              Paper Portfolio
            </h2>
            <button
              onClick={() => setResetConfirm(true)}
              className="text-xs text-zinc-600 hover:text-rose-500 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="border border-zinc-800 rounded px-4 py-3">
              <div className="text-[10px] text-zinc-600 uppercase tracking-wide">Portfolio Value</div>
              <div className="text-lg font-mono font-medium text-white mt-0.5">{formatCash(portfolioValue)}</div>
            </div>
            <div className="border border-zinc-800 rounded px-4 py-3">
              <div className="text-[10px] text-zinc-600 uppercase tracking-wide">Cash Balance</div>
              <div className="text-lg font-mono font-medium text-white mt-0.5">{formatCash(cash)}</div>
            </div>
            <div className="border border-zinc-800 rounded px-4 py-3">
              <div className="text-[10px] text-zinc-600 uppercase tracking-wide">Total P&amp;L</div>
              <div className={`text-lg font-mono font-medium mt-0.5 ${hasGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                {hasGain ? '+' : ''}{totalGainAbs.toFixed(2)} ({hasGain ? '+' : ''}{totalGainPct.toFixed(2)}%)
              </div>
            </div>
          </div>

          {resetConfirm && (
            <div className="border border-rose-900/50 rounded px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-rose-500">Reset your portfolio to $100,000? This cannot be undone.</span>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded transition-colors"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {holdings.length > 0 && (
            <div className="border border-zinc-800 rounded overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                    <th className="text-left px-4 py-2.5 font-medium">Symbol</th>
                    <th className="text-right px-4 py-2.5 font-medium">Shares</th>
                    <th className="text-right px-4 py-2.5 font-medium">Avg Price</th>
                    <th className="text-right px-4 py-2.5 font-medium">Current</th>
                    <th className="text-right px-4 py-2.5 font-medium">Market Value</th>
                    <th className="text-right px-4 py-2.5 font-medium">P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const q = holdingQuotes[h.symbol]
                    const currentPrice = q ? q.c : h.average_buy_price
                    const marketValue = h.shares * currentPrice
                    const costBasis = h.shares * h.average_buy_price
                    const plAbs = marketValue - costBasis
                    const plPct = costBasis > 0 ? ((plAbs / costBasis) * 100) : 0
                    const plUp = plAbs >= 0
                    return (
                      <tr
                        key={h.symbol}
                        className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/stock/${encodeURIComponent(h.symbol)}`)}
                      >
                        <td className="px-4 py-3 font-mono text-zinc-200 text-sm">{h.symbol}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-300">{h.shares}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-300">{formatCash(h.average_buy_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-100">{formatCash(currentPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-100">{formatCash(marketValue)}</td>
                        <td className={`px-4 py-3 text-right font-mono ${plUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {plUp ? '+' : ''}{plAbs.toFixed(2)} ({plUp ? '+' : ''}{plPct.toFixed(2)}%)
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {holdings.length === 0 && (
            <div className="border border-zinc-800 rounded p-4 text-center mb-4">
              <p className="text-zinc-600 text-xs">No holdings yet. Search for stocks and start trading.</p>
            </div>
          )}

          {transactions.length > 0 && (
            <div>
              <button
                onClick={() => setTxOpen(!txOpen)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3"
              >
                <Clock size={12} />
                Transaction History ({transactions.length})
                <span className="text-zinc-700">{txOpen ? '▾' : '▸'}</span>
              </button>
              {txOpen && (
                <div className="border border-zinc-800 rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                        <th className="text-left px-4 py-2.5 font-medium">Type</th>
                        <th className="text-left px-4 py-2.5 font-medium">Symbol</th>
                        <th className="text-right px-4 py-2.5 font-medium">Shares</th>
                        <th className="text-right px-4 py-2.5 font-medium">Price</th>
                        <th className="text-right px-4 py-2.5 font-medium">Total</th>
                        <th className="text-right px-4 py-2.5 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 50).map((tx) => (
                        <tr key={tx.id} className="border-b border-zinc-800/50 last:border-0">
                          <td className={`px-4 py-2.5 font-mono text-xs ${tx.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.type}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-zinc-300 text-xs">{tx.symbol}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-300 text-xs">{tx.shares}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-300 text-xs">{formatCash(tx.price)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-300 text-xs">{formatCash(tx.total_amount)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-600 text-xs">{formatTxTime(tx.executed_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                      <td className="px-4 py-3 text-right font-mono text-zinc-100">${(q.c ?? 0).toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? '+' : ''}{(q.d ?? 0).toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? '+' : ''}{(q.dp ?? 0).toFixed(2)}%
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
