import { ExternalLink, Laptop, LayoutDashboard, LogOut, Package, ReceiptText, Users, Wifi } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

const navigation = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Active Sessions', path: '/admin/sessions', icon: Laptop },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Packages', path: '/admin/packages', icon: Package },
  { label: 'Payments', path: '/admin/payments', icon: ReceiptText },
]

function AdminLayout() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('wifi_portal_user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('wifi_portal_token')
    localStorage.removeItem('wifi_portal_user')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900 lg:flex">
      <aside className="border-b border-slate-200 bg-[#0f3d2e] text-white lg:flex lg:w-64 lg:flex-col lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5 text-sm font-semibold tracking-[0.14em] uppercase lg:px-7 lg:py-7">
          <span className="grid size-10 place-items-center rounded-xl bg-[#d8f6a0] text-[#0f3d2e]">
            <Wifi size={20} />
          </span>{' '}
          WaveNet
        </div>
        <div className="px-5 pb-4 text-xs font-semibold tracking-[0.14em] text-white/40 uppercase lg:px-7">
          Administration
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 pb-5 lg:block lg:px-4 lg:pb-0">
          {navigation.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition lg:mb-1 ${
                  isActive
                    ? 'bg-[#d8f6a0] text-[#0f3d2e]'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`
              }
              end={end}
              key={path}
              to={path}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-white/10 px-4 py-4 lg:mt-auto lg:block">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white/90 transition hover:bg-white/20"
          >
            <ExternalLink size={15} /> Customer Portal View
          </Link>
          <div className="mt-3 flex items-center justify-between px-2 text-xs text-white/60">
            <span>{user.full_name || 'Admin'}</span>
            <button
              className="text-white/70 hover:text-white"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 py-4 backdrop-blur sm:px-8">
          <div>
            <p className="text-sm font-semibold text-slate-950">Admin workspace</p>
            <p className="text-xs text-slate-400">Manage your WiFi portal & packages</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ExternalLink size={14} /> Customer View
            </Link>
            <button
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              onClick={handleLogout}
            >
              <LogOut size={17} /> Exit
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
