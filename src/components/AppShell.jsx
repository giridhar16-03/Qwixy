import { Link, NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import { BarChart3, Calendar, CalendarDays, Clock3, House, Settings, MessageSquare } from 'lucide-react'

const menu = [
  { to: '/dashboard', icon: House, label: 'Dashboard' },
  { to: '/assistant', icon: MessageSquare, label: 'Qwixy AI' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/planner', icon: CalendarDays, label: 'Planner' },
  { to: '/timer', icon: Clock3, label: 'Timer' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function AppShell({ title, subtitle, children }) {
  useEffect(() => {
    try {
      const theme = localStorage.getItem('theme') || 'light'
      document.documentElement.setAttribute('data-theme', theme)
    } catch {
      // ignore
    }
  }, [])
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="app-sidebar rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link to="/" className="app-brand text-xl font-bold font-heading text-slate-900">
              Qwixy
            </Link>
          </div>
          <nav className="space-y-2">
            {menu.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `app-nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="space-y-6">
          <section className="app-page-header rounded-2xl border bg-white p-6 shadow-soft">
            <h1 className="font-heading text-3xl font-bold text-slate-900">{title}</h1>
            <p className="app-page-subtitle mt-1 text-slate-600">{subtitle}</p>
          </section>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
