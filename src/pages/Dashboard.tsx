import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { deletePhoto, fetchPublicPhotos } from '@/services/photoService'
import type { Photo } from '@/types'
import PhotoGrid from '@/components/PhotoGrid'
import Lightbox from '@/components/Lightbox'
import ConfirmModal from '@/components/ConfirmModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import UploadPhotoForm from './UploadPhotoForm'
import { useToast } from '@/hooks/useToast'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Photo | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { photos: mine } = await fetchPublicPhotos({ onlyUserId: user.id, sort: 'newest', page: 0 })
      setPhotos(mine)
    } catch {
      showToast('Could not load your photos.', 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deletePhoto(pendingDelete)
      setPhotos((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      showToast('Photo deleted.', 'success')
      setActive(null)
    } catch {
      showToast('Could not delete photo.', 'error')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  return (
    <div className="container-page py-10 md:py-16">
      <div className="flex flex-col gap-6 rounded-card border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-page text-lg font-semibold text-ink">
            {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">{profile?.full_name}</p>
            <p className="text-sm text-muted">@{profile?.username} · {profile?.email}</p>
            <p className="mt-1 text-sm text-muted">{photos.length} photo{photos.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="focus-ring min-h-[44px] rounded-full bg-ink px-6 text-sm font-medium text-white transition-opacity duration-250 hover:opacity-90"
        >
          Upload Photo
        </button>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Your gallery</h2>
        <div className="mt-4">
          {loading ? (
            <LoadingSpinner label="Loading your photos..." />
          ) : photos.length === 0 ? (
            <div className="rounded-card border border-line bg-white p-16 text-center">
              <p className="text-lg font-medium text-ink">Your gallery is empty</p>
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="focus-ring mt-4 min-h-[44px] rounded-full bg-ink px-6 text-sm font-medium text-white hover:opacity-90"
              >
                Upload Photo
              </button>
            </div>
          ) : (
            <PhotoGrid photos={photos} onOpen={setActive} />
          )}
        </div>
      </div>

      <Lightbox
        photo={active}
        onClose={() => setActive(null)}
        canDelete
        onDelete={(p) => setPendingDelete(p)}
      />

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this photo?"
        description="This will permanently remove the photo and its file. This cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {showUpload && (
        <UploadPhotoForm
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false)
            load()
          }}
        />
      )}
    </div>
  )
}
