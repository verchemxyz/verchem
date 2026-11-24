'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  controllerChanged,
  updateRecovery,
  updateRequested,
  type UpdateLifecycleState,
} from '@/lib/pwa/update-lifecycle';

const UPDATE_RECOVERY_DELAY_MS = 4_000;

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const registrationRef = useRef<globalThis.ServiceWorkerRegistration | null>(null);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lifecycleRef = useRef<UpdateLifecycleState>({
    hadController: false,
    updateAvailable: false,
    applying: false,
  });

  const applyLifecycleState = useCallback((state: UpdateLifecycleState) => {
    lifecycleRef.current = state;
    setUpdateAvailable(state.updateAvailable);
    setIsApplyingUpdate(state.applying);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let disposed = false;
    let reloading = false;
    lifecycleRef.current = {
      ...lifecycleRef.current,
      hadController: navigator.serviceWorker.controller !== null,
    };

    const handleControllerChange = () => {
      const transition = controllerChanged(lifecycleRef.current);
      applyLifecycleState(transition.state);
      if (recoveryTimerRef.current !== null) {
        clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
      if (transition.reload && !reloading) {
        reloading = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        if (disposed) return;
        registrationRef.current = registration;
        console.log('[PWA] Service Worker registered:', registration.scope);

        const showUpdate = () => {
          if (disposed) return;
          applyLifecycleState({
            ...lifecycleRef.current,
            updateAvailable: true,
            applying: false,
          });
        };

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('[PWA] New version available!');
              showUpdate();
            }
          });
        });

        // Check for waiting service worker on load
        if (registration.waiting) {
          showUpdate();
        }
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Register on load
    const handleLoad = () => {
      void registerSW();
    };

    if (document.readyState === 'complete') {
      void registerSW();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      disposed = true;
      registrationRef.current = null;
      if (recoveryTimerRef.current !== null) {
        clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
      window.removeEventListener('load', handleLoad);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [applyLifecycleState]);

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = registrationRef.current ??
        await navigator.serviceWorker.getRegistration('/');
      const liveWaitingWorker = registration?.waiting?.state === 'installed'
        ? registration.waiting
        : null;
      const transition = updateRequested(
        lifecycleRef.current,
        liveWaitingWorker !== null
      );
      applyLifecycleState(transition.state);

      if (transition.reload) {
        window.location.reload();
        return;
      }
      if (!transition.postSkipWaiting || !liveWaitingWorker) return;

      liveWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
      if (recoveryTimerRef.current !== null) {
        clearTimeout(recoveryTimerRef.current);
      }
      recoveryTimerRef.current = setTimeout(() => {
        void (async () => {
          let stillWaiting = false;
          try {
            const latest = await navigator.serviceWorker.getRegistration('/');
            stillWaiting = latest?.waiting?.state === 'installed';
          } catch (error) {
            console.error('[PWA] Could not inspect update state:', error);
          }
          const recovery = updateRecovery(lifecycleRef.current, stillWaiting);
          applyLifecycleState(recovery.state);
          if (recovery.reload) window.location.reload();
          recoveryTimerRef.current = null;
        })();
      }, UPDATE_RECOVERY_DELAY_MS);
    } catch (error) {
      console.error('[PWA] Could not apply service-worker update:', error);
      const recovery = updateRecovery(lifecycleRef.current, false);
      applyLifecycleState(recovery.state);
      if (recovery.reload) window.location.reload();
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium">Update Available</p>
          <p className="text-sm text-muted-foreground mt-1">
            A new version of VerChem is available with improvements and bug fixes.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => void handleUpdate()}
          disabled={isApplyingUpdate}
          className="flex-1 px-4 py-2 bg-primary-500 text-primary-foreground rounded-md font-medium hover:bg-primary-600 transition-colors disabled:cursor-wait disabled:opacity-60"
        >
          {isApplyingUpdate ? 'Updating…' : 'Update Now'}
        </button>
        <button
          onClick={() => applyLifecycleState({
            ...lifecycleRef.current,
            updateAvailable: false,
            applying: false,
          })}
          className="px-4 py-2 bg-card border border-border text-foreground rounded-md hover:bg-muted transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}

/**
 * The website does not ask visitors to install it: the offline VerChem app is
 * sold through the app stores, and the website should not compete with it by
 * promoting its own install (owner decision 2026-11-24).
 *
 * Calling preventDefault() on `beforeinstallprompt` also keeps Chromium's own
 * install banner from appearing. The service worker and offline cache are
 * unchanged, and the browser menu can still install the site for anyone who
 * looks for it.
 */
export function SuppressInstallBanner() {
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return null;
}
