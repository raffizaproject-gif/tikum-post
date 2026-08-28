import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, profile, signOut, isAdmin } = useAuth()
  const { settings } = useSiteSettings()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors duration-250 ${isActive ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between md:h-[72px]">
        <Link to="/" className="text-sm font-semibold tracking-tight text-ink">
          {settings.logo_text}
        </Link>

        <p className="hidden text-xs text-muted md:block">
          Based in: <span className="text-ink">{settings.location}</span>
        </p>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
              <button
                onClick={handleLogout}
                className="focus-ring rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-opacity duration-250 hover:opacity-90"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="focus-ring rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-opacity duration-250 hover:opacity-90"
            >
              Login
            </Link>
          )}
        </nav>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-ink md:hidden"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2.5 5H17.5M2.5 10H17.5M2.5 15H17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `min-h-[44px] border-b border-line py-3 text-base ${isActive ? 'font-medium text-ink' : 'text-muted'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] border-b border-line py-3 text-base text-muted"
                >
                  Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="min-h-[44px] border-b border-line py-3 text-base text-muted"
                  >
                    Admin
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="focus-ring mt-4 min-h-[44px] rounded-full bg-ink text-sm font-medium text-white"
                >
                  Logout ({profile?.username})
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="focus-ring mt-4 flex min-h-[44px] items-center justify-center rounded-full bg-ink text-sm font-medium text-white"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
