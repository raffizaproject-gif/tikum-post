import { useState } from 'react'
import type { Photo } from '@/types'

interface Props {
  photo: Photo
  onOpen: (photo: Photo) => void
  /** Optional tailwind col/row span classes, used for the featured mosaic look */
  spanClassName?: string
  aspectClassName?: string
}

export default function PhotoCard({ photo, onOpen, spanClassName = '', aspectClassName = 'aspect-[4/3]' }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      className={`focus-ring group relative block w-full overflow-hidden rounded-photo bg-line text-left ${aspectClassName} ${spanClassName}`}
      aria-label={`Open photo: ${photo.title}`}
    >
      {!loaded && !errored && <div className="skeleton absolute inset-0" aria-hidden="true" />}

      {errored ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-page text-muted">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 16l4.5-5 3.5 4 3-3.5L20 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <img
          src={photo.image_url}
          alt={photo.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-250 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-sm font-medium text-white line-clamp-1">{photo.title}</p>
        {photo.location && <p className="text-xs text-white/80 line-clamp-1">{photo.location}</p>}
      </div>
    </button>
  )
}
