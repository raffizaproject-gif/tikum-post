import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

// A slimmed-down user shape (`id` instead of Firebase's `uid`) so the rest
// of the app didn't need to change when the underlying data layer did.
export interface AppUser {
  id: string
  email: string | null
}

interface AuthContextValue {
  user: AppUser | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      channel?.unsubscribe()

      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser({ id: firebaseUser.uid, email: firebaseUser.email })

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', firebaseUser.uid)
        .maybeSingle()
      setProfile((data as Profile) ?? null)
      setLoading(false)

      // Live subscription so an admin toggling this user's role/active
      // status is reflected immediately without a re-login.
      channel = supabase
        .channel(`profile-${firebaseUser.uid}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${firebaseUser.uid}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setProfile(null)
            } else {
              setProfile(payload.new as Profile)
            }
          }
        )
        .subscribe()
    })

    return () => {
      unsubAuth()
      channel?.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    setProfile((data as Profile) ?? null)
  }

  const handleSignOut = async () => {
    await signOut(auth)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        refreshProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
