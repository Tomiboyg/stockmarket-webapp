import { useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'

interface Props {
  symbol: string
  currentPrice: number
}

export default function TradeCard({ symbol, currentPrice }: Props) {
  const { cash, holdings, buyStock, sellStock } = usePortfolio()
  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY')
  const [shares, setShares] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const holding = holdings.find((h) => h.symbol === symbol)
  const sharesOwned = holding ? holding.shares : 0
  const shareCount = Number(shares) || 0
  const totalCost = shareCount * currentPrice
  const canAfford = mode === 'BUY' ? cash >= totalCost : sharesOwned >= shareCount

  const handleExecute = async () => {
    if (!shares || shareCount <= 0) {
      setStatus('error')
      setMessage('Enter a valid number of shares')
      return
    }
    if (!canAfford) {
      setStatus('error')
      setMessage(mode === 'BUY' ? 'Insufficient funds' : 'Not enough shares')
      return
    }
    setPending(true)
    setStatus('idle')
    setMessage('')

    const fn = mode === 'BUY' ? buyStock : sellStock
    const result = await fn(symbol, shareCount, currentPrice)
    setPending(false)

    if (result.success) {
      setStatus('success')
      setMessage(`${mode === 'BUY' ? 'Bought' : 'Sold'} ${shareCount} share${shareCount > 1 ? 's' : ''} of ${symbol}`)
      setShares('')
    } else {
      setStatus('error')
      setMessage(result.error || 'Trade failed')
    }
  }

  const formatCash = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

  return (
    <div className="border border-zinc-800 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Demo Trade</h2>
        <div className="flex gap-1">
          <button
            onClick={() => { setMode('BUY'); setStatus('idle'); setMessage('') }}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              mode === 'BUY'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                : 'text-zinc-500 border border-zinc-800 hover:text-zinc-300'
            }`}
          >
            <TrendingUp size={12} className="inline mr-1" />
            Buy
          </button>
          <button
            onClick={() => { setMode('SELL'); setStatus('idle'); setMessage('') }}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              mode === 'SELL'
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                : 'text-zinc-500 border border-zinc-800 hover:text-zinc-300'
            }`}
          >
            <TrendingDown size={12} className="inline mr-1" />
            Sell
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 pb-3 border-b border-zinc-800/50">
        <span>Cash: <span className="font-mono text-zinc-200">{formatCash(cash)}</span></span>
        <span>Holdings: <span className="font-mono text-zinc-200">{sharesOwned} shares</span></span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="number"
          min="1"
          step="1"
          value={shares}
          onChange={(e) => { setShares(e.target.value); setStatus('idle'); setMessage('') }}
          placeholder="Shares"
          className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
        />
        <span className="text-xs text-zinc-500">shares × {formatCash(currentPrice)}</span>
      </div>

      <div className="text-xs text-zinc-400 mb-3">
        Est. {mode === 'BUY' ? 'Cost' : 'Proceeds'}: <span className="font-mono text-zinc-200">{formatCash(totalCost)}</span>
      </div>

      {!canAfford && shares && shareCount > 0 && (
        <div className="text-xs text-rose-500 mb-3">
          {mode === 'BUY' ? 'Insufficient funds for this trade' : 'Not enough shares to sell'}
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-xs text-emerald-500 mb-3">
          <CheckCircle size={14} />
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="text-xs text-rose-500 mb-3">{message}</div>
      )}

      <button
        onClick={handleExecute}
        disabled={pending || !shares || shareCount <= 0 || !canAfford}
        className={`w-full text-xs py-2 rounded transition-colors font-medium ${
          mode === 'BUY'
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600'
            : 'bg-rose-600 hover:bg-rose-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600'
        }`}
      >
        {pending ? 'Processing...' : `${mode === 'BUY' ? 'Buy' : 'Sell'} ${symbol}`}
      </button>
    </div>
  )
}
