import { useEffect } from 'react'
import type { Photo } from '@/types'

interface Props {
  photo: Photo | null
  onClose: () => void
  canDelete?: boolean
  onDelete?: (photo: Photo) => void
}

export default function Lightbox({ photo, onClose, canDelete, onDelete }: Props) {
  useEffect(() => {
    if (!photo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [photo, onClose])

  if (!photo) return null

  const date = new Date(photo.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-card bg-white shadow-soft md:flex-row" style={{ maxHeight: '90vh' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors duration-250 hover:bg-black/70"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex max-h-[55vh] items-center justify-center bg-page md:max-h-[90vh] md:flex-1">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="max-h-[55vh] w-full object-contain md:max-h-[90vh]"
            style={{ maxWidth: '95vw' }}
          />
        </div>

        <div className="flex w-full flex-col gap-3 overflow-y-auto p-6 md:w-80">
          <h2 className="text-xl font-semibold text-ink">{photo.title}</h2>
          {photo.description && <p className="text-sm text-muted">{photo.description}</p>}

          <dl className="mt-2 space-y-2 text-sm">
            {photo.owner_username && (
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">By</dt>
                <dd className="text-ink">{photo.owner_username}</dd>
              </div>
            )}
            {photo.location && (
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Location</dt>
                <dd className="text-ink">{photo.location}</dd>
              </div>
            )}
            {photo.category && (
              <div className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">Category</dt>
                <dd className="text-ink">{photo.category}</dd>
              </div>
            )}
            <div className="flex justify-between pb-2">
              <dt className="text-muted">Uploaded</dt>
              <dd className="text-ink">{date}</dd>
            </div>
          </dl>

          {canDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(photo)}
              className="focus-ring mt-2 min-h-[44px] rounded-full border border-line text-sm font-medium text-ink transition-colors duration-250 hover:bg-page"
            >
              Delete photo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
