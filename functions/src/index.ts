import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { createClient } from '@supabase/supabase-js'

initializeApp()
const auth = getAuth()

const supabaseUrl = defineSecret('SUPABASE_URL')
const supabaseServiceRoleKey = defineSecret('SUPABASE_SERVICE_ROLE_KEY')

// =========================================================
// deleteUserAccount — the ONE operation in this whole app that still
// needs a server outside the browser.
//
// Firebase's client SDK can only ever delete the *currently signed-in*
// user's own Auth credential — deleting someone ELSE's account (what an
// admin does from Admin → Users) is only possible with the Admin SDK,
// which can't run in the browser. There's no way around this that
// doesn't involve a server, regardless of which database/storage you use
// for the rest of the app.
//
// This function verifies the caller's Firebase ID token, checks (via
// Supabase, with the service role key — bypasses RLS) that the caller is
// an admin, then deletes the target user's Supabase photos, their
// Storage files, their profile row, and finally their Firebase Auth
// account. Deploy with:
//   firebase functions:secrets:set SUPABASE_URL
//   firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
//   firebase deploy --only functions
// =========================================================
export const deleteUserAccount = onRequest(
  { secrets: [supabaseUrl, supabaseServiceRoleKey], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed.' })
      return
    }

    const authHeader = req.headers.authorization ?? ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) {
      res.status(401).json({ error: 'Sign in required.' })
      return
    }

    let callerUid: string
    try {
      callerUid = (await auth.verifyIdToken(idToken)).uid
    } catch {
      res.status(401).json({ error: 'Sign in required.' })
      return
    }

    const { userId } = req.body ?? {}
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required.' })
      return
    }

    const supabase = createClient(supabaseUrl.value(), supabaseServiceRoleKey.value())

    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', callerUid)
      .maybeSingle()
    if (caller?.role !== 'admin') {
      res.status(403).json({ error: 'Admin only.' })
      return
    }

    const { data: photos } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('user_id', userId)

    const paths = (photos ?? []).map((p) => p.storage_path).filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from('photos').remove(paths)
    }
    await supabase.from('photos').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)

    await auth.deleteUser(userId).catch(() => {
      // Profile/photos are already gone even if the auth record was already removed.
    })

    res.status(200).json({ success: true })
  }
)
