import { createContext, useCallback, useContext, useState, ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; kind: ToastKind }

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, kind }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[90vw] sm:max-w-sm"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl px-4 py-3 text-sm shadow-soft border ${
              t.kind === 'success'
                ? 'bg-white border-line text-ink'
                : t.kind === 'error'
                ? 'bg-ink text-white border-ink'
                : 'bg-white border-line text-ink'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
