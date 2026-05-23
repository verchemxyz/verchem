'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Ketcher } from 'ketcher-core';
import {
  downloadText,
  downloadPng,
  downloadSvg,
} from '@/lib/molecule/format-conversion';
import { parseShareParams } from '@/lib/molecule/share-url';
import SaveMoleculeModal, {
  type SaveMoleculeData,
} from '@/components/molecule-editor/SaveMoleculeModal';

const KetcherEditor = dynamic(
  () => import('@/components/molecule-editor/KetcherEditor'),
  { ssr: false }
);

export default function DrawPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ketcher, setKetcher] = useState<Ketcher | null>(null);
  const [smiles, setSmiles] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalKey, setSaveModalKey] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const loadedShareKeyRef = useRef<string | null>(null);

  const handleInit = useCallback((ketcherInstance: Ketcher) => {
    setKetcher(ketcherInstance);
  }, []);

  const handleChange = useCallback((newSmiles: string, _newMol: string) => {
    setSmiles(newSmiles);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+S → open save modal
  const handleSaveClick = useCallback(async () => {
    try {
      const res = await fetch('/api/session');
      if (!res.ok) {
        router.push('/draw?login_required=1');
        return;
      }
    } catch {
      router.push('/draw?login_required=1');
      return;
    }
    setSaveError(null);
    setSaveModalKey((k) => k + 1);
    setIsSaveModalOpen(true);
  }, [router]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSaveClick]);

  // Preload structure from URL params (?smiles= or ?mol_id=)
  useEffect(() => {
    if (!ketcher) return;

    const { smiles: urlSmiles, molId, error } = parseShareParams(searchParams);
    if (error) {
      setShareError(error);
      return;
    }

    const key = urlSmiles ? `smiles:${urlSmiles}` : molId ? `molid:${molId}` : null;
    if (!key) return;

    // Guard against duplicate loads of the same share
    if (loadedShareKeyRef.current === key) return;
    loadedShareKeyRef.current = key;

    if (urlSmiles) {
      ketcher
        .setMolecule(urlSmiles)
        .catch((err: unknown) => {
          setShareError(
            `Failed to load SMILES: ${err instanceof Error ? err.message : 'invalid structure'}`
          );
        });
      return;
    }

    if (molId) {
      const controller = new AbortController();
      setIsLoadingShared(true);
      setShareError(null);
      fetch(`/api/molecules/${molId}`, { signal: controller.signal })
        .then(async (res) => {
          if (res.status === 404) throw new Error('Molecule not found or not public');
          if (!res.ok) throw new Error('Failed to load molecule');
          const data = await res.json();
          // Prefer mol_block (more accurate) over smiles
          if (data.mol_block) {
            return ketcher.setMolecule(data.mol_block);
          }
          return ketcher.setMolecule(data.smiles);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setShareError(err instanceof Error ? err.message : 'Failed to load molecule');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingShared(false);
        });

      return () => controller.abort();
    }
  }, [ketcher, searchParams]);

  const handleExportSmiles = async () => {
    if (!ketcher) return;
    const s = await ketcher.getSmiles();
    downloadText(s, 'structure.smiles');
  };

  const handleExportMol = async () => {
    if (!ketcher) return;
    const m = await ketcher.getMolfile('v2000');
    downloadText(m, 'structure.mol');
  };

  const handleExportInchi = async () => {
    if (!ketcher) return;
    const i = await ketcher.getInchi();
    downloadText(i, 'structure.inchi');
  };

  const handleExportPng = async () => {
    if (!ketcher) return;
    const molfile = await ketcher.getMolfile();
    const blob = await ketcher.generateImage(molfile, {
      outputFormat: 'png',
      backgroundColor: '#ffffff',
    });
    downloadPng(blob, 'structure.png');
  };

  const handleExportSvg = async () => {
    if (!ketcher) return;
    const molfile = await ketcher.getMolfile();
    const blob = await ketcher.generateImage(molfile, {
      outputFormat: 'svg',
      backgroundColor: '#ffffff',
    });
    const text = await blob.text();
    downloadSvg(text, 'structure.svg');
  };

  const handleSave = async (data: SaveMoleculeData) => {
    if (!ketcher) return;
    setSaveLoading(true);
    setSaveError(null);

    try {
      const currentSmiles = await ketcher.getSmiles();
      const molBlock = await ketcher.getMolfile('v2000');
      let inchi: string | undefined;
      let inchiKey: string | undefined;
      try {
        inchi = await ketcher.getInchi();
      } catch {
        // InChI may not be available for all structures
      }
      try {
        inchiKey = await ketcher.getInChIKey();
      } catch {
        // InChIKey may not be available
      }

      const res = await fetch('/api/molecules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          smiles: currentSmiles,
          mol_block: molBlock,
          inchi: inchi || undefined,
          inchi_key: inchiKey || undefined,
          tags: data.tags,
          notes: data.notes,
          is_public: data.is_public,
        }),
      });

      if (res.status === 401) {
        setIsSaveModalOpen(false);
        router.push('/draw?login_required=1');
        return;
      }

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setSaveError(payload.error || 'Failed to save molecule');
        return;
      }

      setIsSaveModalOpen(false);
      alert('Molecule saved to library!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save molecule';
      setSaveError(message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          Structure Editor
        </h1>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleExportSmiles}
            disabled={!ketcher}
            aria-label="Export as SMILES"
            className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            SMILES
          </button>
          <button
            onClick={handleExportMol}
            disabled={!ketcher}
            aria-label="Export as MOL v2000"
            className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            MOL v2000
          </button>
          <button
            onClick={handleExportInchi}
            disabled={!ketcher}
            aria-label="Export as InChI"
            className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            InChI
          </button>
          <button
            onClick={handleExportPng}
            disabled={!ketcher}
            aria-label="Export as PNG image"
            className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            PNG
          </button>
          <button
            onClick={handleExportSvg}
            disabled={!ketcher}
            aria-label="Export as SVG image"
            className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            SVG
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!ketcher}
            aria-label="Save structure to library (Ctrl+S)"
            className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save to Library
          </button>
        </div>

        <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
          {isLoadingShared && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
              <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}
          <div className="h-[calc(100vh-280px)] min-h-[400px] sm:h-[600px]">
            <KetcherEditor
              height="100%"
              onInit={handleInit}
              onChange={handleChange}
            />
          </div>
        </div>

        {shareError && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
          >
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{shareError}</p>
            </div>
            <button
              onClick={() => setShareError(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {smiles && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-mono break-all text-foreground">
              <strong>SMILES:</strong> {smiles}
            </p>
          </div>
        )}
      </div>

      <SaveMoleculeModal
        key={saveModalKey}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
        isLoading={saveLoading}
        error={saveError}
      />
    </div>
  );
}
