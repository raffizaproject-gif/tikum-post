import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginUser } from '@/services/authService'
import { useToast } from '@/hooks/useToast'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation() as any
  const { showToast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      await loginUser(identifier.trim(), password)
      showToast('Welcome back!', 'success')
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm">
        <h1 className="heading-hero text-2xl text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Log in to manage your photos.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          {error && (
            <div role="alert" className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="identifier" className="mb-1.5 block text-sm text-muted">Email or Username</label>
            <input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="focus-ring min-h-[44px] w-full rounded-xl border border-line bg-white px-4 text-ink"
              style={{ fontSize: 16 }}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-muted">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring min-h-[44px] w-full rounded-xl border border-line bg-white px-4 text-ink"
              style={{ fontSize: 16 }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring min-h-[44px] w-full rounded-full bg-ink text-sm font-medium text-white transition-opacity duration-250 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="focus-ring text-ink underline underline-offset-2">Register</Link>
        </p>
      </div>
    </div>
  )
}
