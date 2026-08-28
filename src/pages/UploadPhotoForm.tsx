import { FormEvent, useRef, useState } from 'react'
import { uploadPhotos } from '@/services/photoService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

interface Props {
  onUploaded: () => void
  onClose: () => void
}

const MAX_SIZE_MB = 10
const MAX_FILES = 20

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface StagedFile {
  key: string
  file: File
  preview: string
  title: string
  status: FileStatus
  progress: number
  error?: string
}

function titleFromFilename(name: string) {
  return name.replace(/\.[^./]+$/, '').replace(/[-_]+/g, ' ').trim()
}

export default function UploadPhotoForm({ onUploaded, onClose }: Props) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (fileList: FileList | File[] | null) => {
    if (!fileList) return
    setFormError(null)
    const incoming = Array.from(fileList)
    const rejected: string[] = []

    const accepted: StagedFile[] = []
    for (const f of incoming) {
      if (staged.length + accepted.length >= MAX_FILES) {
        rejected.push(`${f.name} (max ${MAX_FILES} photos per upload)`)
        continue
      }
      if (!f.type.startsWith('image/')) {
        rejected.push(`${f.name} (not an image)`)
        continue
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        rejected.push(`${f.name} (larger than ${MAX_SIZE_MB}MB)`)
        continue
      }
      accepted.push({
        key: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
        file: f,
        preview: URL.createObjectURL(f),
        title: titleFromFilename(f.name),
        status: 'pending',
        progress: 0,
      })
    }

    if (accepted.length) setStaged((prev) => [...prev, ...accepted])
    if (rejected.length) setFormError(`Skipped: ${rejected.join(', ')}`)
  }

  const removeFile = (key: string) => {
    setStaged((prev) => {
      const target = prev.find((s) => s.key === key)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((s) => s.key !== key)
    })
  }

  const updateTitle = (key: string, title: string) => {
    setStaged((prev) => prev.map((s) => (s.key === key ? { ...s, title } : s)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (staged.length === 0) {
      setFormError('Please select at least one photo to upload.')
      return
    }
    if (staged.some((s) => !s.title.trim())) {
      setFormError('Every photo needs a title.')
      return
    }
    if (!user) return

    setSubmitting(true)
    setFormError(null)
    setStaged((prev) => prev.map((s) => ({ ...s, status: 'uploading', progress: 0 })))

    const results = await uploadPhotos({
      items: staged.map((s) => ({ file: s.file, title: s.title.trim() })),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      userId: user.id,
      onItemProgress: (index, percent) => {
        setStaged((prev) =>
          prev.map((s, i) => (i === index ? { ...s, progress: percent } : s))
        )
      },
    })

    setStaged((prev) =>
      prev.map((s, i) => ({
        ...s,
        status: results[i].error ? 'error' : 'done',
        error: results[i].error ?? undefined,
      }))
    )

    const succeeded = results.filter((r) => !r.error).length
    const failed = results.length - succeeded

    if (succeeded > 0) {
      showToast(
        failed > 0
          ? `${succeeded} photo${succeeded === 1 ? '' : 's'} uploaded, ${failed} failed.`
          : `${succeeded} photo${succeeded === 1 ? '' : 's'} uploaded.`,
        failed > 0 ? 'error' : 'success'
      )
    }
    if (failed > 0 && succeeded === 0) {
      showToast('Upload failed.', 'error')
    }

    setSubmitting(false)

    if (failed === 0) {
      onUploaded()
    }
    // If some failed, leave the modal open so the person can see which
    // ones need retrying instead of silently losing that information.
  }

  const retryFailed = async () => {
    const toRetry = staged.filter((s) => s.status === 'error')
    if (toRetry.length === 0 || !user) return
    setSubmitting(true)
    setStaged((prev) =>
      prev.map((s) => (s.status === 'error' ? { ...s, status: 'uploading', progress: 0 } : s))
    )

    const results = await uploadPhotos({
      items: toRetry.map((s) => ({ file: s.file, title: s.title.trim() })),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      userId: user.id,
      onItemProgress: (index, percent) => {
        const key = toRetry[index].key
        setStaged((prev) => prev.map((s) => (s.key === key ? { ...s, progress: percent } : s)))
      },
    })

    setStaged((prev) =>
      prev.map((s) => {
        const retryIndex = toRetry.findIndex((r) => r.key === s.key)
        if (retryIndex === -1) return s
        const result = results[retryIndex]
        return { ...s, status: result.error ? 'error' : 'done', error: result.error ?? undefined }
      })
    )

    const stillFailing = results.some((r) => r.error)
    setSubmitting(false)
    if (!stillFailing) onUploaded()
  }

  const doneCount = staged.filter((s) => s.status === 'done').length
  const errorCount = staged.filter((s) => s.status === 'error').length

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Upload photos"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Upload photos</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {formError && (
            <div role="alert" className="rounded-xl border border-line px-4 py-3 text-sm text-ink">
              {formError}
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              addFiles(e.dataTransfer.files)
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-250 ${
              dragOver ? 'border-ink bg-page' : 'border-line'
            }`}
          >
            <p className="text-sm text-muted">
              Drag & drop up to {MAX_FILES} images here, or
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                if (inputRef.current) inputRef.current.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring min-h-[44px] rounded-full border border-line px-5 text-sm font-medium text-ink hover:bg-page"
            >
              Choose photos
            </button>
          </div>

          {staged.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                {staged.length} photo{staged.length === 1 ? '' : 's'} selected
                {(doneCount > 0 || errorCount > 0) && (
                  <> · {doneCount} uploaded{errorCount > 0 ? `, ${errorCount} failed` : ''}</>
                )}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {staged.map((s) => (
                  <div key={s.key} className="flex gap-3 rounded-xl border border-line p-3">
                    <img
                      src={s.preview}
                      alt=""
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        value={s.title}
                        onChange={(e) => updateTitle(s.key, e.target.value)}
                        disabled={submitting}
                        aria-label={`Title for ${s.file.name}`}
                        className="focus-ring w-full min-w-0 rounded-lg border border-line px-2 py-1.5 text-sm text-ink"
                        style={{ fontSize: 16 }}
                      />
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        {s.status === 'pending' && <span className="text-muted">Ready</span>}
                        {s.status === 'uploading' && (
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-page">
                            <div
                              className="h-full rounded-full bg-ink transition-all duration-200"
                              style={{ width: `${s.progress}%` }}
                            />
                          </div>
                        )}
                        {s.status === 'done' && <span className="text-ink">Uploaded ✓</span>}
                        {s.status === 'error' && (
                          <span className="text-ink">{s.error || 'Failed'}</span>
                        )}
                      </div>
                    </div>
                    {s.status !== 'uploading' && (
                      <button
                        type="button"
                        onClick={() => removeFile(s.key)}
                        disabled={submitting}
                        aria-label={`Remove ${s.file.name}`}
                        className="focus-ring h-8 w-8 flex-shrink-0 self-start rounded-full text-muted hover:text-ink"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted">
            Description, category, and location below are applied to every photo in this batch.
          </p>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm text-muted">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={submitting}
              className="focus-ring w-full rounded-xl border border-line px-4 py-3 text-ink"
              style={{ fontSize: 16 }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm text-muted">Category</label>
              <input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                className="focus-ring min-h-[44px] w-full rounded-xl border border-line px-4 text-ink"
                style={{ fontSize: 16 }}
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-1.5 block text-sm text-muted">Location</label>
              <input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={submitting}
                className="focus-ring min-h-[44px] w-full rounded-xl border border-line px-4 text-ink"
                style={{ fontSize: 16 }}
              />
            </div>
          </div>

          {errorCount > 0 && !submitting ? (
            <button
              type="button"
              onClick={retryFailed}
              className="focus-ring min-h-[44px] w-full rounded-full bg-ink text-sm font-medium text-white transition-opacity duration-250 hover:opacity-90"
            >
              Retry {errorCount} failed photo{errorCount === 1 ? '' : 's'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || staged.length === 0}
              className="focus-ring min-h-[44px] w-full rounded-full bg-ink text-sm font-medium text-white transition-opacity duration-250 hover:opacity-90 disabled:opacity-60"
            >
              {submitting
                ? `Uploading... (${doneCount}/${staged.length})`
                : `Upload ${staged.length || ''} photo${staged.length === 1 ? '' : 's'}`}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
