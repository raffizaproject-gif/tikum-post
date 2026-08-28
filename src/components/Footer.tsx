import { Link } from 'react-router-dom'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function Footer() {
  const { settings } = useSiteSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line bg-white">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{settings.site_name}</p>
          <p className="mt-1 text-xs text-muted">
            © {year} {settings.site_name}. {settings.footer_text}
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-muted">
          <a href={`mailto:${settings.contact_email}`} className="focus-ring hover:text-ink">
            {settings.contact_email}
          </a>
          {settings.instagram && (
            <span className="hover:text-ink">{settings.instagram}</span>
          )}
          <Link to="/contact" className="focus-ring hover:text-ink">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
