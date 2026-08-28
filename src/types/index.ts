export type Role = 'user' | 'admin'

export interface Profile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url: string | null
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string
  storage_path: string
  category: string | null
  location: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  // joined data (optional, populated client-side)
  owner_username?: string
  owner_avatar?: string | null
}

export interface SiteSettings {
  id: number
  site_name: string
  logo_text: string
  location: string
  hero_title: string
  hero_description: string
  about_text: string
  contact_email: string
  instagram: string | null
  footer_text: string
  updated_at: string
}

export type SortOrder = 'newest' | 'oldest'

export interface GalleryFilters {
  search: string
  category: string | null
  sort: SortOrder
}
