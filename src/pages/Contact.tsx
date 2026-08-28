import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function Contact() {
  const { settings } = useSiteSettings()
  return (
    <div className="container-page py-14 md:py-20">
      <span className="inline-block rounded-full bg-page px-3 py-1 text-xs font-medium text-muted">Contact</span>
      <h1 className="heading-hero mt-4 text-ink">Get in touch</h1>
      <div className="mt-8 max-w-md rounded-card border border-line bg-white p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-1">
              <a href={`mailto:${settings.contact_email}`} className="focus-ring text-ink underline underline-offset-2">
                {settings.contact_email}
              </a>
            </dd>
          </div>
          {settings.instagram && (
            <div>
              <dt className="text-muted">Instagram</dt>
              <dd className="mt-1 text-ink">{settings.instagram}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">Based in</dt>
            <dd className="mt-1 text-ink">{settings.location}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
