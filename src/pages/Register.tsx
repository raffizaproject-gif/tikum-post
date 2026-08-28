import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '@/services/authService'
import { useToast } from '@/hooks/useToast'

interface FormState {
  fullName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

const initial: FormState = { fullName: '', username: '', email: '', password: '', confirmPassword: '' }

export default function Register() {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.username.trim()) next.username = 'Username is required.'
    else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username.trim()))
      next.username = '3-20 characters: letters, numbers, underscore, or dot.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError(null)
    if (!validate()) return
    setLoading(true)
    try {
      await registerUser({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      showToast('Account created! Please log in.', 'success')
      navigate('/login')
    } catch (err: any) {
      setFormError(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields: { key: keyof FormState; label: string; type: string; autoComplete: string }[] = [
    { key: 'fullName', label: 'Full Name', type: 'text', autoComplete: 'name' },
    { key: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
    { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', autoComplete: 'new-password' },
  ]

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm">
        <h1 className="heading-hero text-2xl text-ink">Create an account</h1>
        <p className="mt-2 text-sm text-muted">Join to upload and manage your own photos.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          {formError && (
            <div role="alert" className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
              {formError}
            </div>
          )}

          {fields.map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="mb-1.5 block text-sm text-muted">{f.label}</label>
              <input
                id={f.key}
                type={f.type}
                autoComplete={f.autoComplete}
                value={form[f.key]}
                onChange={update(f.key)}
                aria-invalid={!!errors[f.key]}
                aria-describedby={errors[f.key] ? `${f.key}-error` : undefined}
                className="focus-ring min-h-[44px] w-full rounded-xl border border-line bg-white px-4 text-ink"
                style={{ fontSize: 16 }}
              />
              {errors[f.key] && (
                <p id={`${f.key}-error`} className="mt-1 text-xs text-ink">{errors[f.key]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring min-h-[44px] w-full rounded-full bg-ink text-sm font-medium text-white transition-opacity duration-250 hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="focus-ring text-ink underline underline-offset-2">Log in</Link>
        </p>
      </div>
    </div>
  )
}
