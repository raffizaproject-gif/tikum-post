import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function About() {
  const { settings } = useSiteSettings()
  return (
    <div className="container-page py-14 md:py-20">
      <span className="inline-block rounded-full bg-page px-3 py-1 text-xs font-medium text-muted">About</span>
      <h1 className="heading-hero mt-4 max-w-2xl text-ink">About {settings.site_name}</h1>
      <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted">
        {settings.about_text}
      </p>
    </div>
  )
}
