import { useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { CheckCircle } from 'lucide-react'

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
    <div className="border border-[#161619] rounded bg-[#050507]/20">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-[#161619]">
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Demo Trade</h2>
      </div>

      {/* Buy/Sell toggle */}
      <div className="flex mx-5 mt-4 mb-3 border border-[#161619] rounded overflow-hidden">
        <button
          onClick={() => { setMode('BUY'); setStatus('idle'); setMessage('') }}
          className={`flex-1 text-[10px] font-mono uppercase tracking-wider py-2 transition-all ${
            mode === 'BUY'
              ? 'bg-emerald-500/10 text-emerald-500 border-r border-[#161619]'
              : 'text-zinc-600 hover:text-zinc-400 border-r border-[#161619]'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => { setMode('SELL'); setStatus('idle'); setMessage('') }}
          className={`flex-1 text-[10px] font-mono uppercase tracking-wider py-2 transition-all ${
            mode === 'SELL'
              ? 'bg-rose-500/10 text-rose-500'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Info row */}
      <div className="px-5 mb-4 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span>Cash: <span className="text-zinc-200">{formatCash(cash)}</span></span>
        <span>Hold: <span className="text-zinc-200">{sharesOwned}</span></span>
      </div>

      {/* Input */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 border border-[#161619] rounded px-3 py-2 focus-within:border-[#ff4c24]/40 focus-within:ring-1 focus-within:ring-[#ff4c24]/20 transition-all">
          <input
            type="number"
            min="1"
            step="1"
            value={shares}
            onChange={(e) => { setShares(e.target.value); setStatus('idle'); setMessage('') }}
            placeholder="0"
            className="w-full bg-transparent text-sm font-mono text-white placeholder-zinc-700 focus:outline-none"
          />
          <span className="text-[10px] text-zinc-600 font-mono">shares</span>
        </div>
      </div>

      {/* Cost/proceeds */}
      <div className="px-5 mb-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">
          {mode === 'BUY' ? 'Est. Cost' : 'Est. Proceeds'}
        </div>
        <div className="text-base font-mono font-medium text-white/80 tracking-tight">
          {formatCash(totalCost)}
        </div>
        <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
          {shareCount > 0 ? `${shareCount} × ${formatCash(currentPrice)}` : ''}
        </div>
      </div>

      {/* Validation feedback */}
      {!canAfford && shares && shareCount > 0 && (
        <div className="px-5 mb-3">
          <div className="text-[10px] font-mono text-rose-500">
            {mode === 'BUY' ? 'Insufficient funds' : 'Not enough shares'}
          </div>
        </div>
      )}

      {/* Status messages */}
      {status === 'success' && (
        <div className="px-5 mb-3 flex items-center gap-2 text-[10px] font-mono text-emerald-500">
          <CheckCircle size={12} />
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="px-5 mb-3 text-[10px] font-mono text-rose-500">{message}</div>
      )}

      {/* Execute button */}
      <div className="px-5 pb-5">
        <button
          onClick={handleExecute}
          disabled={pending || !shares || shareCount <= 0 || !canAfford}
          className={`w-full text-[10px] font-mono uppercase tracking-widest py-2.5 rounded transition-all ${
            mode === 'BUY'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-[#161619] disabled:text-zinc-700'
              : 'bg-rose-600 hover:bg-rose-500 text-white disabled:bg-[#161619] disabled:text-zinc-700'
          }`}
        >
          {pending ? 'Processing...' : `${mode === 'BUY' ? 'Buy' : 'Sell'} ${symbol}`}
        </button>
      </div>
    </div>
  )
}
