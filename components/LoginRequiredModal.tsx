'use client'

import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import OAuthLoginButton to avoid SSR issues
const OAuthLoginButton = dynamic(() => import('./oauth-login-button'), {
  ssr: false,
  loading: () => (
    <button disabled className="w-full btn-premium text-lg py-4">
      Loading...
    </button>
  ),
})

/**
 * Login Required Modal
 *
 * Shows when user tries to access protected route without logging in.
 * Triggered by middleware adding ?login_required=1 to URL.
 *
 * Features:
 * - Free First Strategy messaging
 * - Early Bird benefit explanation
 * - AIVerID OAuth login button
 * - Redirect back to original page after login
 */

// Inner component that uses useSearchParams
function LoginRequiredModalInner() {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  // ACCESSIBILITY: Focus trap refs (Dec 2025 - 4-AI Audit)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Check login required from URL params
  const loginRequired = searchParams.get('login_required')
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    if (loginRequired === '1' && !isOpen) {
      // Defer setState to avoid synchronous setState in effect
      const id = setTimeout(() => {
        setIsOpen(true)
        setRedirectPath(redirect)
      }, 0)
      return () => clearTimeout(id)
    }
  }, [loginRequired, redirect, isOpen])

  // Close handler - defined BEFORE useEffect that uses it
  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Remove query params from URL without reload
    const url = new URL(window.location.href)
    url.searchParams.delete('login_required')
    url.searchParams.delete('redirect')
    window.history.replaceState({}, '', url.pathname)
  }, [])

  // ACCESSIBILITY: Focus trap implementation
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement
      // Focus the close button when modal opens
      closeButtonRef.current?.focus()

      // Trap focus inside modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose()
          return
        }

        if (e.key !== 'Tab') return

        const modal = modalRef.current
        if (!modal) return

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus()
    }
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - ACCESSIBILITY: role="dialog" + aria attributes */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 id="login-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to Continue
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {redirectPath && (
              <span className="block text-sm text-primary-600 font-medium mb-2">
                Accessing: {redirectPath}
              </span>
            )}
            All features are <span className="text-primary-600 font-semibold">100% FREE</span> for AIVerID members!
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎁</span>
            <span className="font-bold text-gray-900 dark:text-white">Early Bird Benefits</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>All 14 chemistry tools - <strong>FREE forever</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Save calculations & preferences</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Early Bird price when we add premium features</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>One account for ALL Ver* products</span>
            </li>
          </ul>
        </div>

        {/* Login Button */}
        <OAuthLoginButton />

        {/* Footer note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-primary-600 hover:underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

// Wrapper component with Suspense boundary for useSearchParams
export default function LoginRequiredModal() {
  return (
    <Suspense fallback={null}>
      <LoginRequiredModalInner />
    </Suspense>
  )
}
