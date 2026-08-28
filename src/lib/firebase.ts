import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// =========================================================
// Firebase is used ONLY for authentication (sign up / log in / log out)
// in this app. There is no Firestore, no Firebase Storage, and no Cloud
// Functions on the client side anymore — all data (profiles, photos,
// settings) and all file uploads go through Supabase instead.
// See src/lib/supabase.ts for that half, and supabase/schema.sql for the
// database + storage setup.
// =========================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fail loudly in dev rather than silently pretending auth works.
  // eslint-disable-next-line no-console
  console.error(
    'Missing Firebase environment variables. Copy .env.example to .env and fill in ' +
      'the VITE_FIREBASE_* values from your Firebase project settings.'
  )
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
