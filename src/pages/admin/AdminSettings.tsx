import { FormEvent, useEffect, useState } from 'react'
import { fetchSiteSettings, updateSiteSettings } from '@/services/settingsService'
import type { SiteSettings } from '@/types'
import { useToast } from '@/hooks/useToast'
import LoadingSpinner from '@/components/LoadingSpinner'

type FormState = Omit<SiteSettings, 'id' | 'updated_at'>

export default function AdminSettings() {
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSiteSettings()
      .then((data) => {
        if (data) {
          const { id, updated_at, ...rest } = data
          setForm(rest)
        }
      })
      .catch(() => showToast('Could not load settings.', 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form || saving) return
    setSaving(true)
    try {
      await updateSiteSettings(form)
      showToast('Settings saved.', 'success')
    } catch {
      showToast('Could not save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading settings..." />
  if (!form)
    return (
      <p className="text-sm text-muted">
        No settings row found. Run the seed insert in <code>supabase/schema.sql</code> first.
      </p>
    )

  const fields: { key: keyof FormState; label: string; textarea?: boolean }[] = [
    { key: 'site_name', label: 'Website name' },
    { key: 'logo_text', label: 'Logo / text logo' },
    { key: 'location', label: 'Location' },
    { key: 'hero_title', label: 'Hero title' },
    { key: 'hero_description', label: 'Hero description', textarea: true },
    { key: 'about_text', label: 'About text', textarea: true },
    { key: 'contact_email', label: 'Contact email' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'footer_text', label: 'Footer text' },
  ]

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-card border border-line bg-white p-6">
      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className="mb-1.5 block text-sm text-muted">{f.label}</label>
          {f.textarea ? (
            <textarea
              id={f.key}
              value={(form[f.key] as string) ?? ''}
              onChange={update(f.key)}
              rows={3}
              className="focus-ring w-full rounded-xl border border-line px-4 py-3 text-ink"
              style={{ fontSize: 16 }}
            />
          ) : (
            <input
              id={f.key}
              value={(form[f.key] as string) ?? ''}
              onChange={update(f.key)}
              className="focus-ring min-h-[44px] w-full rounded-xl border border-line px-4 text-ink"
              style={{ fontSize: 16 }}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="focus-ring min-h-[44px] rounded-full bg-ink px-6 text-sm font-medium text-white transition-opacity duration-250 hover:opacity-90 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
