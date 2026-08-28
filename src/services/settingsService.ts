import { supabase } from '@/lib/supabase'
import type { SiteSettings } from '@/types'

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
  if (error || !data) return null
  return data as SiteSettings
}

export async function updateSiteSettings(patch: Partial<SiteSettings>) {
  const { id, ...rest } = patch as SiteSettings
  const payload = { ...rest, updated_at: new Date().toISOString() }
  const { data, error } = await supabase
    .from('settings')
    .update(payload)
    .eq('id', 1)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as SiteSettings
}
