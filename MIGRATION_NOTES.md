# Migration notes: Firebase (Firestore/Storage) → Supabase, Firebase kept for login only

This repo previously used Firebase for everything (Auth, Firestore, Storage, Cloud Functions).
It now uses **Firebase only for Auth**; all data and file storage moved to **Supabase**
(Postgres + Storage). See `README.md` §2–4 for the full setup and how the two services
are bridged (Supabase's native Firebase Third-Party Auth support, via `src/lib/supabase.ts`).

## What changed

| Before (Firebase) | Now |
|---|---|
| `profiles` / `photos` / `settings` Firestore collections | `profiles` / `photos` / `settings` Postgres tables (`supabase/schema.sql`) |
| Firebase Storage (`photos/<uid>/<file>`) | Supabase Storage bucket `photos` (same `<uid>/<file>` path convention) |
| `firestore.rules` / `storage.rules` | Postgres Row Level Security + Storage policies (`supabase/schema.sql`) |
| `registerUser` Cloud Function (transactional username uniqueness) | Plain Postgres `unique` constraint on `profiles.username` — no function needed |
| `deleteUserAccount` Cloud Function | Still exists (`functions/src/index.ts`), now deleting from Supabase instead of Firestore — kept because deleting *another user's* Firebase Auth account requires the Admin SDK, a Firebase-side limitation that applies regardless of which database the rest of the app uses |

Everything else — the free-text search gap, no-cheap-counts-at-scale, cursor-based pagination — carries over unchanged from the original Supabase→Firebase migration; see the git history of this file if you need the original Postgres-vs-Firestore comparison.
