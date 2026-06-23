import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchStocks, generateMockSearchResults, getQuote, generateMockQuote } from '../services/finnhub'
import type { SearchResult, StockQuote } from '../types'
import { Search as SearchIcon, TrendingUp, TrendingDown } from 'lucide-react'
import WatchlistButton from '../components/WatchlistButton'

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
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults([])
      setQuotes({})
      return
    }

    setLoading(true)
    const fetchResults = async () => {
      let searchResults = await searchStocks(debouncedQuery)
      if (searchResults.length === 0) {
        searchResults = generateMockSearchResults(debouncedQuery)
      }

      setResults(searchResults)

      const quoteMap: Record<string, StockQuote | null> = {}
      for (const r of searchResults) {
        const q = await getQuote(r.symbol)
        quoteMap[r.symbol] = q || generateMockQuote(r.symbol)
      }
      setQuotes(quoteMap)
      setLoading(false)
    }
    fetchResults()
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
          placeholder="Search by symbol or company name..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors font-mono"
        />
      </div>

      {loading && (
        <div className="text-zinc-600 text-xs">Searching...</div>
      )}

      {!loading && results.length === 0 && debouncedQuery && (
        <div className="text-zinc-600 text-xs border border-zinc-800 rounded p-4">
          No results for "{debouncedQuery}"
        </div>
      )}

      {results.length > 0 && (
        <div className="border border-zinc-800 rounded overflow-hidden">
          {results.map((r, idx) => {
            const q = quotes[r.symbol]
            const isUp = q ? q.dp >= 0 : true
            return (
              <div
                key={`${r.symbol}-${idx}`}
                className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/stock/${r.symbol}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <div className="font-mono text-sm text-zinc-200">{r.symbol}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-60">{r.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {q && (
                    <div className="text-right">
                      <div className="font-mono text-sm text-zinc-100">${q.c.toFixed(2)}</div>
                      <div className={`font-mono text-xs flex items-center gap-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isUp ? '+' : ''}{q.dp.toFixed(2)}%
                      </div>
                    </div>
                  )}
                  <div onClick={(e) => e.stopPropagation()}>
                    <WatchlistButton symbol={r.symbol} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
