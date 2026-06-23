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
    <div className="flex items-center justify-center min-h-screen bg-[#020202] px-4">
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#ff4c24]/[0.04] blur-[160px] pointer-events-none" />
      <div className="w-full max-w-sm relative z-10">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <TrendingUp size={20} className="text-[#ff4c24]" />
          <span className="font-mono tracking-widest font-semibold text-xs uppercase text-white/80">StockView</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#050507]/40 border border-[#161619] rounded px-3 py-2.5 text-sm font-mono text-white/90 placeholder-zinc-700 focus:outline-none focus:border-[#ff4c24]/40 focus:ring-1 focus:ring-[#ff4c24]/20 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#050507]/40 border border-[#161619] rounded px-3 py-2.5 text-sm font-mono text-white/90 placeholder-zinc-700 focus:outline-none focus:border-[#ff4c24]/40 focus:ring-1 focus:ring-[#ff4c24]/20 transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="text-rose-500 text-[10px] font-mono">{error}</p>}

          <button
            type="submit"
            className="w-full bg-white/90 text-[#020202] text-[10px] font-mono uppercase tracking-widest font-medium rounded px-3 py-2.5 hover:bg-white transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </form>

        <p className="text-[10px] font-mono text-zinc-600 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
