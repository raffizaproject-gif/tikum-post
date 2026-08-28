import { supabase, PHOTOS_BUCKET } from '@/lib/supabase'
import type { GalleryFilters, Photo } from '@/types'

const PAGE_SIZE = 12

// crypto.randomUUID() only exists in "secure contexts" (HTTPS, or
// localhost) — it's undefined when the app is opened over plain http://
// on a local network IP (e.g. testing on a phone via Wi-Fi). This
// fallback works everywhere, including plain HTTP.
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface FetchPhotosOptions extends Partial<GalleryFilters> {
  page?: number
  onlyUserId?: string
}

// NOTE ON SEARCH: not implemented yet. The search inputs exist in the UI
// but are currently inert. With Postgres, real substring search is easy
// to add back with `ilike` (`.ilike('title', `%${term}%`)`) whenever
// you want it.

export async function fetchPublicPhotos({
  page = 0,
  category = null,
  sort = 'newest',
  onlyUserId,
}: FetchPhotosOptions) {
  let query = supabase.from('photos').select('*')

  if (onlyUserId) {
    query = query.eq('user_id', onlyUserId)
  } else {
    query = query.eq('is_public', true)
  }
  if (category) query = query.eq('category', category)

  query = query
    .order('created_at', { ascending: sort === 'oldest' })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) // fetch one extra to detect hasMore

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const hasMore = rows.length > PAGE_SIZE
  const photos = (hasMore ? rows.slice(0, PAGE_SIZE) : rows) as Photo[]
  return { photos, hasMore }
}

export async function fetchCategories(): Promise<string[]> {
  // Fine at small scale; at real scale, maintain a dedicated categories
  // table updated by a trigger instead of scanning every public photo.
  const { data, error } = await supabase
    .from('photos')
    .select('category')
    .eq('is_public', true)
  if (error) throw new Error(error.message)

  const set = new Set<string>()
  ;(data ?? []).forEach((row: { category: string | null }) => {
    if (row.category) set.add(row.category)
  })
  return Array.from(set).sort()
}

export interface UploadPhotoInput {
  file: File
  title: string
  description: string
  category: string
  location: string
  userId: string
  onProgress?: (percent: number) => void
}

async function uploadSinglePhoto({
  file,
  title,
  description,
  category,
  location,
  userId,
  onProgress,
  ownerUsername,
  ownerAvatar,
}: UploadPhotoInput & { ownerUsername?: string; ownerAvatar: string | null }): Promise<Photo> {
  const ext = file.name.split('.').pop() || 'jpg'
  const storagePath = `${userId}/${generateId()}.${ext}`

  // Supabase JS storage upload doesn't stream progress the way Firebase's
  // resumable upload did, so we report a simple start/finish signal
  // instead of granular percentages.
  onProgress?.(0)
  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(storagePath, file, { cacheControl: '3600', upsert: false })
  if (uploadError) throw new Error(uploadError.message)
  onProgress?.(100)

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(storagePath)

  const now = new Date().toISOString()
  const payload = {
    user_id: userId,
    title,
    description,
    category,
    location,
    image_url: publicUrl,
    storage_path: storagePath,
    is_public: true,
    created_at: now,
    updated_at: now,
    owner_username: ownerUsername ?? null,
    owner_avatar: ownerAvatar,
  }

  const { data, error } = await supabase.from('photos').insert(payload).select().single()
  if (error) {
    // The file made it to storage but the row insert failed — clean up
    // the orphaned object instead of leaving unreferenced storage around.
    await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath]).catch(() => {})
    throw new Error(error.message)
  }
  return data as Photo
}

async function lookupOwnerFields(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  return {
    ownerUsername: data?.username as string | undefined,
    ownerAvatar: (data?.avatar_url ?? null) as string | null,
  }
}

export async function uploadPhoto(input: UploadPhotoInput): Promise<Photo> {
  const owner = await lookupOwnerFields(input.userId)
  return uploadSinglePhoto({ ...input, ...owner })
}

export interface UploadPhotosItem {
  file: File
  title: string
}

export interface UploadPhotosInput {
  items: UploadPhotosItem[]
  description: string
  category: string
  location: string
  userId: string
  onItemProgress?: (index: number, percent: number) => void
}

export interface UploadPhotosResult {
  photo: Photo | null
  error: string | null
}

export async function uploadPhotos({
  items,
  description,
  category,
  location,
  userId,
  onItemProgress,
}: UploadPhotosInput): Promise<UploadPhotosResult[]> {
  const owner = await lookupOwnerFields(userId)

  return Promise.all(
    items.map(async (item, index) => {
      try {
        const photo = await uploadSinglePhoto({
          file: item.file,
          title: item.title,
          description,
          category,
          location,
          userId,
          onProgress: (percent) => onItemProgress?.(index, percent),
          ...owner,
        })
        return { photo, error: null }
      } catch (err: any) {
        return { photo: null, error: err?.message ?? 'Upload failed.' }
      }
    })
  )
}

export async function deletePhoto(photo: Photo) {
  const { error: storageError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .remove([photo.storage_path])
  if (storageError) throw new Error(storageError.message)

  const { error } = await supabase.from('photos').delete().eq('id', photo.id)
  if (error) throw new Error(error.message)
}

export async function updatePhoto(id: string, patch: Partial<Photo>) {
  const { data, error } = await supabase
    .from('photos')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Photo
}

// Admin-only: fetch every photo regardless of is_public. Row Level
// Security enforces the admin check server-side; this call simply omits
// the client-side is_public filter.
export async function fetchAllPhotosAdmin({ search = '' }: FetchPhotosOptions) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)

  let photos = (data ?? []) as Photo[]
  if (search) {
    const needle = search.toLowerCase()
    photos = photos.filter(
      (p) =>
        p.title?.toLowerCase().includes(needle) || p.category?.toLowerCase().includes(needle)
    )
  }
  return { photos, total: photos.length }
}