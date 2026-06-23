import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Search, LogOut, TrendingUp } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Search' },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-[#020202]">
      {/* Ambient glows */}
      <div className="fixed top-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#ff4c24]/[0.04] blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/[0.03] blur-[160px] pointer-events-none" />

      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-56 border-r border-[#161619] flex-col flex-shrink-0 bg-[#050507]/40 backdrop-blur-sm z-10">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[#161619]">
          <TrendingUp size={18} className="text-[#ff4c24]" />
          <span className="font-mono tracking-widest font-semibold text-[10px] uppercase text-white/90">StockView</span>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? 'text-white bg-[#ff4c24]/[0.07] border-l border-[#ff4c24]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#121214]/40'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-[#161619] p-5 space-y-3 bg-[#050507]/60">
          <div className="text-[10px] font-mono text-zinc-600 truncate">{user?.email}</div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#ff4c24] transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-[#161619] bg-[#020202]/95 backdrop-blur-lg flex items-center justify-around z-50">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider ${
              isActive ? 'text-[#ff4c24]' : 'text-zinc-600'
            }`
          }
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider ${
              isActive ? 'text-[#ff4c24]' : 'text-zinc-600'
            }`
          }
        >
          <Search size={16} />
          Search
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600"
        >
          <LogOut size={16} />
          Exit
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 min-h-screen">
        <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
