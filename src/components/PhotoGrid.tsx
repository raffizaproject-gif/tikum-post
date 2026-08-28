import type { Photo } from '@/types'
import PhotoCard from './PhotoCard'

interface Props {
  photos: Photo[]
  onOpen: (photo: Photo) => void
}

/**
 * Stable editorial mosaic grid.
 *
 * Every cell has a fixed aspect ratio + rounded corners + object-fit: cover,
 * so image size is known before the image finishes loading (no layout shift).
 * Spans are derived deterministically from index (a fixed repeating pattern),
 * never randomly, so the layout never "jumps" between renders and never
 * overlaps — CSS Grid handles placement, nothing is absolutely positioned.
 */
// Full literal class strings (not built at runtime) so Tailwind's JIT scanner
// can find every responsive variant it needs to generate.
const PATTERN = [
  { col: 'md:col-span-2', aspect: 'aspect-square md:aspect-[16/10]' }, // wide hero-left
  { col: 'md:col-span-2', aspect: 'aspect-square md:aspect-[16/10]' }, // wide hero-right
  { col: 'md:col-span-1', aspect: 'aspect-square md:aspect-[4/5]' }, // portrait
  { col: 'md:col-span-1', aspect: 'aspect-square md:aspect-[3/4]' }, // taller mid portrait
  { col: 'md:col-span-1', aspect: 'aspect-square md:aspect-[4/5]' }, // portrait
]

export default function PhotoGrid({ photos, onOpen }: Props) {
  if (photos.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5">
      {photos.map((photo, i) => {
        const pattern = PATTERN[i % PATTERN.length]
        return (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onOpen={onOpen}
            spanClassName={pattern.col}
            aspectClassName={pattern.aspect}
          />
        )
      })}
    </div>
  )
}
