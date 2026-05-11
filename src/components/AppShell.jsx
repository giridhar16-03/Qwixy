import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BarChart3, Calendar, CalendarDays, Clock3, House, Settings, MessageSquare, Menu, X } from 'lucide-react'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    try {
      const theme = localStorage.getItem('theme') || 'light'
      document.documentElement.setAttribute('data-theme', theme)
    } catch {
      // ignore
    }
  }, [])

  // Close sidebar when route changes (NavLink will trigger navigation)
  const handleNavClick = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <aside className={`${
          sidebarOpen ? 'fixed inset-0 z-50 bg-black/50 lg:bg-transparent lg:relative' : 'hidden'
        } lg:block`}>
          <div className={`${
            sidebarOpen ? 'fixed left-0 top-0 bottom-0 w-64 overflow-y-auto' : ''
          } rounded-2xl border border-slate-200 bg-white p-4 shadow-soft lg:static lg:h-fit lg:rounded-2xl`}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <Link to="/" className="app-brand text-xl font-bold font-heading text-slate-900">
                Qwixy
              </Link>
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 hover:bg-slate-100 rounded"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <nav className="space-y-2">
              {menu.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `app-nav-link flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content area */}
        <main className="space-y-6 lg:col-span-1">
          {/* Mobile sidebar toggle */}
          <div className="flex items-center justify-between lg:hidden mb-4">
            <div className="flex-1">
              <h1 className="font-heading text-2xl font-bold text-slate-900">{title}</h1>
              <p className="app-page-subtitle mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="ml-4 p-2 hover:bg-slate-200 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Desktop page header */}
          <section className="hidden lg:block app-page-header rounded-2xl border bg-white p-6 shadow-soft">
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
