'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Ketcher } from 'ketcher-core';

const KetcherEditor = dynamic(
  () => import('@/components/molecule-editor/KetcherEditor'),
  { ssr: false }
);

interface MoleculeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSmiles?: string;
  onApply: (smiles: string) => void;
}

export default function MoleculeInputModal({
  isOpen,
  onClose,
  initialSmiles,
  onApply,
}: MoleculeInputModalProps) {
  const [ketcher, setKetcher] = useState<Ketcher | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Reset state when modal closes (prevents stale ketcher/isReady on reopen)
  useEffect(() => {
    if (!isOpen) {
      setKetcher(null);
      setIsReady(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleInit = useCallback((ketcherInstance: Ketcher) => {
    setKetcher(ketcherInstance);
  }, []);

  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const handleApply = async () => {
    if (!ketcher) return;
    setIsLoading(true);
    try {
      const smiles = await ketcher.getSmiles();
      onApply(smiles);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid structure';
      alert(`Failed to get SMILES: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Focus trap + Escape handler
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draw-modal-title"
        className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col animate-in fade-in zoom-in duration-200 h-[80vh] max-h-[calc(100vh-2rem)] min-h-[400px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="draw-modal-title" className="text-lg font-bold text-foreground">
            Draw Structure
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-hidden">
          <KetcherEditor
            initialSmiles={initialSmiles}
            onInit={handleInit}
            onReady={handleReady}
            height="100%"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isLoading || !ketcher || !isReady}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-primary-foreground hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Applying...' : !isReady ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
