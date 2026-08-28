import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div ref={ref} className="w-full max-w-sm rounded-card bg-white p-6 shadow-soft">
        <h2 id="confirm-title" className="text-lg font-semibold text-ink">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring min-h-[44px] rounded-full border border-line px-5 text-sm font-medium text-ink transition-colors duration-250 hover:bg-page"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`focus-ring min-h-[44px] rounded-full px-5 text-sm font-medium text-white transition-colors duration-250 disabled:opacity-60 ${
              destructive ? 'bg-ink hover:bg-black' : 'bg-ink hover:bg-black'
            }`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
