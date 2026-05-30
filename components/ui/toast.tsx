'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = { id, message, type, duration }

    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 200)
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  }

  const accents = {
    success: 'border-l-success text-success',
    error: 'border-l-destructive text-destructive',
    warning: 'border-l-warning text-warning',
    info: 'border-l-info text-info'
  }

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 rounded-lg border border-border border-l-4 px-4 py-3
        bg-popover text-popover-foreground shadow-lg transition-all duration-200
        ${accents[toast.type]}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <span className={accents[toast.type]}>{icons[toast.type]}</span>
      <p className="text-sm font-medium text-foreground">{toast.message}</p>
      <button
        onClick={handleRemove}
        className="ml-2 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    toast: {
      success: (message: string, duration?: number) =>
        context.addToast(message, 'success', duration),
      error: (message: string, duration?: number) =>
        context.addToast(message, 'error', duration),
      warning: (message: string, duration?: number) =>
        context.addToast(message, 'warning', duration),
      info: (message: string, duration?: number) =>
        context.addToast(message, 'info', duration),
    }
  }
}