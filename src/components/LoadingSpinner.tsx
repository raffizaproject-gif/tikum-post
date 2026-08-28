interface Props {
  label?: string
}

export default function LoadingSpinner({ label = 'Loading...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status" aria-live="polite">
      <div
        className="h-6 w-6 rounded-full border-2 border-line border-t-ink animate-spin"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
