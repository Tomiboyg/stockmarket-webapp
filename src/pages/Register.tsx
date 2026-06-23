import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TrendingUp } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await signUp(email, password)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020202] px-4">
        <div className="text-center">
          <p className="text-emerald-500 text-sm font-mono mb-2">Account created successfully!</p>
          <p className="text-zinc-500 text-[10px] font-mono">Redirecting to sign in...</p>
        </div>
      </div>
    )
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
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-rose-500 text-[10px] font-mono">{error}</p>}

          <button
            type="submit"
            className="w-full bg-white/90 text-[#020202] text-[10px] font-mono uppercase tracking-widest font-medium rounded px-3 py-2.5 hover:bg-white transition-colors cursor-pointer"
          >
            Create account
          </button>
        </form>

        <p className="text-[10px] font-mono text-zinc-600 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
