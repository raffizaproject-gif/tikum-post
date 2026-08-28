import { useEffect, useState } from 'react'
import { fetchSiteSettings } from '@/services/settingsService'
import type { SiteSettings } from '@/types'

const FALLBACK: SiteSettings = {
  id: 1,
  site_name: 'TIKUM',
  logo_text: 'TIKUM',
  location: 'AlUla Region',
  hero_title: 'Photo Gallery',
  hero_description: 'Captured moments from our desert trips and scenic routes.',
  about_text:
    'TIKUM is a photography journal documenting desert landscapes, quiet trails, and the light of AlUla.',
  contact_email: 'hello@tikum.studio',
  instagram: '@tikum.studio',
  footer_text: 'TIKUM — captured moments, made to last.',
  updated_at: new Date().toISOString(),
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchSiteSettings()
      .then((data) => {
        if (mounted && data) setSettings(data)
      })
      .catch(() => {
        // Keep FALLBACK if settings row/table isn't reachable yet.
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  return { settings, setSettings, loading }
}
