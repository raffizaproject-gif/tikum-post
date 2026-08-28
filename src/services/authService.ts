import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'

export interface RegisterInput {
  fullName: string
  username: string
  email: string
  password: string
}

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/

// UX hint only — the real uniqueness guarantee is the `unique` constraint
// on profiles.username in Postgres (see supabase/schema.sql), which is
// checked again below at insert time regardless of what this returns.
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .limit(1)
  if (error) return true
  return (data?.length ?? 0) === 0
}

// Firebase's only job here is creating the login credential. Everything
// about the user's profile — including guaranteeing role starts as
// 'user' and the username is actually unique — is enforced by Postgres
// (unique constraint + the profiles_self_insert RLS policy in
// supabase/schema.sql), not by trusting the client.
export async function registerUser({ fullName, username, email, password }: RegisterInput) {
  if (!fullName.trim()) throw new Error('Full name is required.')
  if (!USERNAME_RE.test(username)) {
    throw new Error('3-20 characters: letters, numbers, underscore, or dot.')
  }
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')

  let uid: string
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    uid = cred.user.uid
  } catch (err: any) {
    if (err?.code === 'auth/email-already-exists' || err?.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists.')
    }
    throw new Error('Could not create account. Please try again.')
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('profiles').insert({
    id: uid,
    username,
    full_name: fullName,
    email,
    avatar_url: null,
    role: 'user',
    is_active: true,
    created_at: now,
    updated_at: now,
  })

  if (error) {
    // Auth account was created but the profile row failed (e.g. username
    // taken by a last-moment race) — sign back out so the app doesn't
    // treat this as a logged-in-but-profile-less user.
    await signOut(auth).catch(() => {})
    if (error.code === '23505') throw new Error('This username is already taken.')
    throw new Error('Could not finish creating your account. Please try again.')
  }

  return { uid }
}

export async function loginUser(identifier: string, password: string) {
  let email = identifier

  // Allow logging in with a username by resolving it to an email first.
  if (!identifier.includes('@')) {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .limit(1)
      .maybeSingle()
    if (error || !data) throw new Error('Invalid username/email or password.')
    email = data.email as string
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred
  } catch {
    throw new Error('Invalid username/email or password.')
  }
}

export async function logoutUser() {
  await signOut(auth)
}
