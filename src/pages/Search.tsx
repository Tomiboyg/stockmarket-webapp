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
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-medium mb-5">Search</h1>

      <div className="relative mb-6">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by symbol or company..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
        />
      </div>

      {loading && <div className="text-zinc-600 text-xs border border-zinc-800 rounded p-4">Searching...</div>}

      {error && <div className="text-zinc-600 text-xs border border-zinc-800 rounded p-4">{error}</div>}

      {!loading && !error && results.length === 0 && debouncedQuery && (
        <div className="border border-zinc-800 rounded p-5 text-center">
          <p className="text-zinc-600 text-xs">No results for "{debouncedQuery}"</p>
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
                className="flex items-center gap-4 px-4 py-3 rounded border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                onClick={() => navigate(`/stock/${encodeURIComponent(r.symbol)}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm text-zinc-200">{r.symbol}</div>
                  <div className="text-xs text-zinc-500 truncate max-w-56">{r.description}</div>
                </div>

                {sp && <Sparkline data={sp} width={72} height={28} />}

                {q && (
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm tabular-nums text-zinc-100">${(q.c ?? 0).toFixed(2)}</div>
                    <div className={`font-mono text-xs flex items-center gap-1 justify-end ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
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
