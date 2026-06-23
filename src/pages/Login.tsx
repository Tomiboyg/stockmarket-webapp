import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <TrendingUp size={22} className="text-emerald-500" />
          <span className="font-semibold text-lg tracking-tight">StockView</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="text-rose-500 text-xs">{error}</p>}

          <button
            type="submit"
            className="w-full bg-zinc-100 text-zinc-950 text-sm font-medium rounded px-3 py-2 hover:bg-zinc-300 transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
