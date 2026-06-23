import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { Star } from 'lucide-react'

interface Props {
  symbol: string
}

export default function WatchlistButton({ symbol }: Props) {
  const { user } = useAuth()
  const [isWatched, setIsWatched] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('symbol', symbol)
      .maybeSingle()
      .then(({ data }) => {
        setIsWatched(!!data)
        setLoading(false)
      })
  }, [user, symbol])

  const toggle = async () => {
    if (!user) return
    setLoading(true)
    if (isWatched) {
      await supabase.from('watchlists').delete().eq('user_id', user.id).eq('symbol', symbol)
      setIsWatched(false)
    } else {
      await supabase.from('watchlists').insert({ user_id: user.id, symbol })
      setIsWatched(true)
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors ${
        isWatched
          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Star size={13} fill={isWatched ? 'currentColor' : 'none'} />
      {isWatched ? 'Watched' : 'Watch'}
    </button>
  )
}
