import { useEffect, useState } from 'react'
import { deletePhoto, fetchAllPhotosAdmin, updatePhoto } from '@/services/photoService'
import type { Photo } from '@/types'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/hooks/useToast'

export default function AdminPhotos() {
  const { showToast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<Photo | null>(null)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const { photos: data } = await fetchAllPhotosAdmin({ search: q, page: 0 })
      setPhotos(data)
    } catch {
      showToast('Could not load photos.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const togglePublic = async (p: Photo) => {
    try {
      await updatePhoto(p.id, { is_public: !p.is_public })
      setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_public: !x.is_public } : x)))
    } catch {
      showToast('Could not update photo.', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deletePhoto(pendingDelete)
      setPhotos((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      showToast('Photo deleted.', 'success')
    } catch {
      showToast('Could not delete photo.', 'error')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search photos by title or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="focus-ring min-h-[44px] w-full max-w-sm rounded-full border border-line bg-white px-5 text-sm text-ink"
        style={{ fontSize: 16 }}
      />

      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-card border border-line bg-white">
              <div className="aspect-[4/3] w-full overflow-hidden bg-page">
                <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-4">
                <p className="font-medium text-ink line-clamp-1">{p.title}</p>
                <p className="text-xs text-muted">@{p.owner_username} · {p.category || 'Uncategorized'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => togglePublic(p)} className="focus-ring min-h-[44px] rounded-full border border-line px-3 text-xs font-medium hover:bg-page">
                    {p.is_public ? 'Make private' : 'Make public'}
                  </button>
                  <button onClick={() => setPendingDelete(p)} className="focus-ring min-h-[44px] rounded-full border border-line px-3 text-xs font-medium hover:bg-page">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {photos.length === 0 && <p className="text-sm text-muted">No photos found.</p>}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this photo?"
        description="This removes the database record and the stored file."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
