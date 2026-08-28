import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in ' +
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from your Supabase project settings.'
  )
}

// =========================================================
// Firebase does ONE job in this app: sign-in / sign-up (Firebase Auth).
// Everything else — profiles, photos, settings, and the actual image
// files — lives in Supabase (Postgres + Storage), not Firebase.
//
// To let Supabase's Row Level Security see *who* is calling (without a
// second login), we hand Supabase the current Firebase ID token on every
// request via the `accessToken` option below. This is Supabase's native
// "Third-Party Auth" integration for Firebase — no custom backend needed.
//
// One-time setup required in the Supabase dashboard:
//   Authentication → Sign In / Providers → Third Party Auth → Add provider → Firebase
//   → paste your Firebase Project ID.
// Once that's connected, `auth.jwt()->>'sub'` inside a Postgres RLS policy
// equals the signed-in user's Firebase UID. See supabase/schema.sql.
// =========================================================
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    const user = auth.currentUser
    if (!user) return null
    return await user.getIdToken()
  },
})

export const PHOTOS_BUCKET = 'photos'
