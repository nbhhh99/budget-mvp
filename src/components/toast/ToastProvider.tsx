import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastOptions } from './context'
import './toast.css'

interface ToastState extends ToastOptions {
  id: number
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const dismiss = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setToast(null)
  }, [])

  const showToast = useCallback((options: ToastOptions) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    const id = ++idRef.current
    setToast({ id, ...options })
    timerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, options.durationMs ?? 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <span className="toast__message">{toast.message}</span>
          {toast.actionLabel && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                toast.onAction?.()
                dismiss()
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  )
}
