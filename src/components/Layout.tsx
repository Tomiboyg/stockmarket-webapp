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
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <nav className="w-52 border-r border-zinc-800 flex flex-col flex-shrink-0">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-zinc-800">
          <TrendingUp size={20} className="text-emerald-500" />
          <span className="font-semibold text-sm tracking-tight">StockView</span>
        </div>

        <div className="flex-1 py-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-white bg-zinc-900 border-r-2 border-emerald-500'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-zinc-800 p-4 space-y-3">
          <div className="text-xs text-zinc-600 truncate">{user?.email}</div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
