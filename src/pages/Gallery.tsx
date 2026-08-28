import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCategories, fetchPublicPhotos } from '@/services/photoService'
import type { GalleryFilters, Photo, SortOrder } from '@/types'
import PhotoGrid from '@/components/PhotoGrid'
import Lightbox from '@/components/Lightbox'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function Gallery() {
  const { settings } = useSiteSettings()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<Photo | null>(null)

  const [filters, setFilters] = useState<GalleryFilters>({ search: '', category: null, sort: 'newest' })
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (nextPage: number, f: GalleryFilters, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true)
    setError(null)
    try {
      const { photos: newPhotos, hasMore: more } = await fetchPublicPhotos({
        page: nextPage,
        search: f.search,
        category: f.category,
        sort: f.sort,
      })
      setPhotos((prev) => (append ? [...prev, ...newPhotos] : newPhotos))
      setHasMore(more)
      setPage(nextPage)
    } catch (e: any) {
      setError(e.message ?? 'Could not load the gallery. Please try again.')
    } finally {
      append ? setLoadingMore(false) : setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    load(0, filters, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }))
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  return (
    <div className="container-page py-10 md:py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-block rounded-full bg-page px-3 py-1 text-xs font-medium text-muted">
            Our Stories
          </span>
          <h1 className="heading-hero mt-4 text-ink">{settings.hero_title}</h1>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted md:text-right">
          {settings.hero_description}
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, category, location..."
            aria-label="Search photos"
            className="focus-ring min-h-[44px] w-full rounded-full border border-line bg-white px-5 text-sm text-ink placeholder:text-muted"
            style={{ fontSize: 16 }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by category"
            value={filters.category ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || null }))}
            className="focus-ring min-h-[44px] rounded-full border border-line bg-white px-4 text-sm text-ink"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Sort order"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortOrder }))}
            className="focus-ring min-h-[44px] rounded-full border border-line bg-white px-4 text-sm text-ink"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <LoadingSpinner label="Loading photos..." />
        ) : error ? (
          <div className="rounded-card border border-line bg-white p-10 text-center text-sm text-muted">
            {error}
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-card border border-line bg-white p-16 text-center">
            <p className="text-lg font-medium text-ink">No photos yet</p>
            <p className="mt-1 text-sm text-muted">Try a different search or check back soon.</p>
          </div>
        ) : (
          <>
            <PhotoGrid photos={photos} onOpen={setActive} />
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => load(page + 1, filters, true)}
                  disabled={loadingMore}
                  className="focus-ring min-h-[44px] rounded-full border border-line bg-white px-6 text-sm font-medium text-ink transition-colors duration-250 hover:bg-page disabled:opacity-60"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Lightbox photo={active} onClose={() => setActive(null)} />
    </div>
  )
}
