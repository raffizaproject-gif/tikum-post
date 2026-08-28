# TIKUM — Photo Gallery (Firebase login + Supabase data/storage)

A minimalist, premium, mobile-first photo gallery built with **React + Vite + TypeScript + Tailwind CSS**.

**Firebase's only job in this app is authentication** (sign up / log in / log out). Everything else — user profiles, photo metadata, site settings, and the actual photo files — lives in **Supabase** (Postgres database + Storage). Public visitors can browse the gallery without an account. Registered users can upload and manage their own photos. Admins get a full dashboard to manage users, photos, and site copy.

---

## 1. Project structure

```
tikum-gallery/
├─ src/
│  ├─ components/     # Navbar, Footer, PhotoGrid, PhotoCard, Lightbox, ConfirmModal, route guards...
│  ├─ layouts/         # MainLayout (public site), AdminLayout (admin shell + tabs)
│  ├─ pages/           # Gallery, About, Contact, Login, Register, Dashboard, Profile, admin/*
│  ├─ hooks/           # useAuth, useToast, useSiteSettings
│  ├─ services/        # authService, photoService, profileService, settingsService
│  ├─ lib/
│  │  ├─ firebase.ts   # Firebase Auth ONLY — no Firestore, no Storage, no client Functions
│  │  └─ supabase.ts   # Supabase client (database + storage), authenticated using the Firebase ID token
│  └─ types/           # shared TypeScript types
├─ supabase/
│  └─ schema.sql        # tables, Row Level Security policies, storage bucket + policies
├─ functions/
│  └─ src/index.ts      # deleteUserAccount — the one operation that still needs a server (see §4)
├─ firebase.json
└─ .env.example
```

## 2. How the two services fit together

- **Firebase Auth** — email/password sign-up and login. That's it.
- **Supabase Postgres** — `profiles`, `photos`, `settings` tables, protected by Row Level Security (RLS), doing the same job `firestore.rules` used to do.
- **Supabase Storage** — a `photos` bucket holding the actual image files, also protected by policies.
- The bridge between the two: on every Supabase request, the app hands Supabase the **current Firebase ID token** (see `src/lib/supabase.ts`, the `accessToken` option). Supabase's built-in **Third-Party Auth** feature verifies that token against your Firebase project directly — no second login, no custom backend glue needed. Inside a Postgres policy, `auth.jwt()->>'sub'` is the signed-in user's Firebase UID.

Nothing about permissions is decided by the frontend — every read/write is re-checked by Postgres RLS and Storage policies, exactly like Security Rules did before.

---

## 3. Set up Firebase (login only)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Project settings → General → Your apps** → add a Web app → copy the config values into `.env` (see §5).

You do **not** need to enable Firestore or Storage in this Firebase project.

## 4. Set up Supabase (data + files)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/schema.sql`. This creates the `profiles`, `photos`, `settings` tables, all RLS policies, the `photos` storage bucket, and its policies.
3. **Authentication → Sign In / Providers → Third Party Auth** → **Add provider → Firebase** → paste your Firebase **Project ID**. This is what lets Supabase trust Firebase's login tokens.
4. **Project Settings → API** → copy the Project URL and the `anon` public key into `.env` (see §5).
5. **Project Settings → API** → also copy the `service_role` key — you'll need it once, for the one Cloud Function below. Keep it secret; never put it in the frontend `.env`.

### Why one Cloud Function still exists

Deleting **someone else's** Firebase Auth account (what an admin does in Admin → Users) can only be done with the Firebase Admin SDK — the browser SDK can only ever delete the currently signed-in user. That's a Firebase limitation, not a database choice, so a tiny server-side function (`functions/src/index.ts`) is unavoidable for that one action. It verifies the caller is an admin (via Supabase, using the service role key), deletes the target user's photos/files/profile in Supabase, then deletes their Firebase Auth account. Every other action in the app — including all photo uploads — talks to Supabase directly from the browser.

To deploy it:
```bash
npm install -g firebase-tools && firebase login
cd functions && npm install && cd ..
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
firebase deploy --only functions
```
Copy the printed function URL into `VITE_DELETE_USER_FUNCTION_URL` in `.env`.

---

## 5. Run locally

```bash
npm install
cp .env.example .env
# edit .env with your Firebase Web app config + Supabase URL/anon key
npm run dev
```

Open http://localhost:5173. `/gallery` works immediately with zero photos ("No photos yet"). Register an account to start uploading.

---

## 6. Create your first admin

There is intentionally no button anywhere that lets a user make themselves an admin — the `profiles_self_update` RLS policy in `supabase/schema.sql` blocks a user from changing their own `role`.

1. Register a normal account through the website (`/register`).
2. In the Supabase dashboard → **Table Editor → profiles**, find that row (its `id` is the user's Firebase UID, visible in the Firebase console under Authentication → Users).
3. Edit the `role` column from `user` to `admin` directly in the table editor (dashboard edits use the service role, so RLS doesn't block it).
4. Log out and back in (or refresh) — the account now sees the **Admin** link and can reach `/admin`.

From then on, that admin can promote/demote other users from **Admin → Users**.

---

## 7. Deploying

**Frontend:** any static host works, or Firebase Hosting (already wired up in `firebase.json`):
```bash
npm run build              # outputs to dist/
firebase deploy --only hosting
```
For Vercel/Netlify/etc.: build command `npm run build`, output directory `dist`, and set the `VITE_*` environment variables from your `.env` in the host's dashboard.

**Backend:** re-run `firebase deploy --only functions` any time you change `functions/src/index.ts`. Re-run the SQL in `supabase/schema.sql` (or a migration built from it) any time you change the schema or policies.

---

## 8. Changing website settings

Once you're an admin, go to **Admin → Settings** to edit the site name, hero title/description, about text, contact email, Instagram handle, and footer text — all stored in the single `settings` row in Supabase and reflected across the whole site immediately.

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Blank gallery, console shows a Firebase or Supabase env warning | `.env` is missing values. Restart `npm run dev` after editing `.env` — Vite only reads it at startup. |
| "new row violates row-level security policy" on register | The `profiles_self_insert` policy requires `role = 'user'` and `id` to match the Firebase UID in the token — check Third-Party Auth is configured (§4 step 3) and the token is actually being sent (`src/lib/supabase.ts`). |
| Upload fails with a storage policy error | Confirm the file path starts with `<your-firebase-uid>/...` — the storage policies check the first path segment against `auth.jwt()->>'sub'`. |
| Register fails with "username already taken" even for a fresh username | Someone grabbed it between your check and submit — Postgres' `unique` constraint on `profiles.username` is what actually enforces this. |
| Category filter throws no results though photos exist | Confirm `is_public` is `true` on those rows — the public gallery only shows public photos. |
| Admin can't delete a user | Check `VITE_DELETE_USER_FUNCTION_URL` in `.env` points at your deployed function, and that the function's `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` secrets are set (§4). |
| Search box in Gallery/Admin doesn't filter anything | Not implemented yet by design — see the note at the top of `photoService.ts`. Postgres' `ilike` makes it straightforward to add whenever you want it. |
| Build fails with a path-alias resolution error | Make sure you're using the provided `vite.config.ts` — the `@/` import alias is defined there, not just in `tsconfig.json`. |

---

## 10. Design reference

The gallery layout, typography scale, spacing, and color palette (`#111111` / `#555555` / `#F3F3F3` background / `#FFFFFF` cards / `#EAEAEA` borders) follow an editorial, minimal desert-photography portfolio look: a wide-then-mosaic photo grid, a centered "Based in" location label in the navbar, and a two-column hero (heading left, description right on desktop; stacked on mobile).
