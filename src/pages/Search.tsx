import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchStocks, generateMockSearchResults, getQuote, generateMockQuote } from '../services/finnhub'
import type { SearchResult, StockQuote } from '../types'
import { Search as SearchIcon, TrendingUp, TrendingDown } from 'lucide-react'
import WatchlistButton from '../components/WatchlistButton'
import Sparkline, { generateSparklineData } from '../components/Sparkline'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [quotes, setQuotes] = useState<Record<string, StockQuote | null>>({})
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    inputRef.current?.focus()
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults([])
      setQuotes({})
      setSparklines({})
      setError('')
      return
    }

    setLoading(true)
    setError('')

    const run = async () => {
      try {
        let searchResults: SearchResult[] = []
        try { searchResults = await searchStocks(debouncedQuery) } catch { searchResults = [] }
        if (!mountedRef.current) return

        if (searchResults.length === 0) searchResults = generateMockSearchResults(debouncedQuery)

        setResults(searchResults)

        const qm: Record<string, StockQuote | null> = {}
        const sm: Record<string, number[]> = {}
        for (const r of searchResults) {
          try {
            const q = await getQuote(r.symbol)
            qm[r.symbol] = q || generateMockQuote(r.symbol)
          } catch {
            qm[r.symbol] = generateMockQuote(r.symbol)
          }
          sm[r.symbol] = generateSparklineData()
        }
        if (mountedRef.current) {
          setQuotes(qm)
          setSparklines(sm)
          setLoading(false)
        }
      } catch {
        if (mountedRef.current) {
          setError('Search failed. Try again.')
          setLoading(false)
        }
      }
    }

    run()
  }, [debouncedQuery])

  return (
    <div className="w-full space-y-6">
      <h1 className="text-lg font-medium text-white/90">Search</h1>

      {/* Search input with glow */}
      <div className="relative">
        <SearchIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by symbol or company..."
          className="w-full bg-[#050507]/40 border border-[#161619] rounded pl-10 pr-4 py-3 text-sm text-white/90 placeholder-zinc-700 focus:outline-none focus:border-[#ff4c24]/40 focus:ring-1 focus:ring-[#ff4c24]/20 transition-all font-mono"
        />
      </div>

      {loading && (
        <div className="text-zinc-600 text-xs font-mono border border-[#161619] rounded p-4 bg-[#050507]/20">
          Searching...
        </div>
      )}

      {error && (
        <div className="text-zinc-600 text-xs font-mono border border-[#161619] rounded p-4 bg-[#050507]/20">
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && debouncedQuery && (
        <div className="border border-[#161619] rounded p-6 text-center bg-[#050507]/20">
          <p className="text-zinc-600 text-xs font-mono">No results for "{debouncedQuery}"</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r, idx) => {
            const q = quotes[r.symbol]
            const sp = sparklines[r.symbol]
            const isUp = q ? q.dp >= 0 : true
            return (
              <div
                key={`${r.symbol}-${idx}`}
                className="flex items-center gap-4 px-5 py-3.5 rounded border border-[#161619] hover:border-zinc-700/30 cursor-pointer transition-colors bg-[#050507]/20"
                onClick={() => navigate(`/stock/${encodeURIComponent(r.symbol)}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm text-zinc-200">{r.symbol}</div>
                  <div className="text-[11px] text-zinc-600 truncate max-w-56">{r.description}</div>
                </div>

                {sp && <Sparkline data={sp} width={72} height={28} />}

                {q && (
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm tabular-nums text-zinc-100">${(q.c ?? 0).toFixed(2)}</div>
                    <div className={`font-mono text-[11px] flex items-center gap-1 justify-end ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isUp ? '+' : ''}{(q.dp ?? 0).toFixed(2)}%
                    </div>
                  </div>
                )}

                <div onClick={(e) => e.stopPropagation()}>
                  <WatchlistButton symbol={r.symbol} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
