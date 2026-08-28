import { supabase } from '@/lib/supabase'
import { auth } from '@/lib/firebase'
import type { Profile } from '@/types'

// `search` is applied client-side after fetching, same trade-off the
// Firebase version had (fine for a moderate user base).
export async function fetchAllProfilesAdmin(search = ''): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  let profiles = (data ?? []) as Profile[]
  if (search) {
    const needle = search.toLowerCase()
    profiles = profiles.filter(
      (p) =>
        p.username?.toLowerCase().includes(needle) ||
        p.full_name?.toLowerCase().includes(needle) ||
        p.email?.toLowerCase().includes(needle)
    )
  }
  return profiles
}

// Plain Postgres update, protected by the profiles_self_update RLS policy
// in supabase/schema.sql, which only allows changing someone else's role
// when the requester's own profile row already has role = 'admin'.
export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function setUserActive(userId: string, isActive: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

// Deleting *another user's* Firebase Auth credential can only be done
// with the Admin SDK (the client SDK can only delete the currently
// signed-in user) — that one operation still goes through a small Cloud
// Function (functions/src/index.ts). It cascades the delete to that
// user's Supabase profile/photos/storage files too. Everything else in
// this app talks to Supabase directly.
export async function deleteUserProfile(userId: string) {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch(import.meta.env.VITE_DELETE_USER_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? 'Could not delete user.')
  }
}

export async function countPhotosForUser(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return count ?? 0
}
