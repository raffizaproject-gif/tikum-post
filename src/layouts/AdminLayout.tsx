import { NavLink, Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'

const tabs = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/photos', label: 'Photos' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Navbar />
      <div className="container-page py-8 md:py-12">
        <h1 className="heading-hero text-2xl md:text-3xl">Admin</h1>
        <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `focus-ring min-h-[44px] shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-250 ${
                  isActive ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink border border-line'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
