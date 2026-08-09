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

// Install prompt component
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after user has spent some time on the site
      setTimeout(() => {
        // Only show if not already dismissed
        const dismissed = localStorage.getItem('verchem_install_dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 60000); // 1 minute
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('verchem_install_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">Install VerChem</p>
          <p className="text-sm text-muted-foreground mt-1">
            Install our app for quick access and offline support.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="text-muted-foreground hover:text-foreground"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleInstall}
          className="flex-1 px-4 py-2 bg-primary-500 text-primary-foreground rounded-md font-medium hover:bg-primary-600 transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
