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
import { CalcShell, Button } from '@/components/lab';

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
      if (!((e.metaKey || e.ctrlKey) && e.key === 's')) return;

      // Skip if save modal already open — avoid remount that wipes typed state
      if (isSaveModalOpen) return;

      // Skip when user is typing in a form field or content-editable region
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (target.isContentEditable) return;
      }

      e.preventDefault();
      handleSaveClick();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSaveClick, isSaveModalOpen]);

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
    <CalcShell
      eyebrow="Cheminformatics · 2D editor"
      title="Structure Editor"
      subtitle="Draw a structure or paste a SMILES string, then export it or save it to your library."
      backHref="/tools"
      backLabel="All tools"
      maxWidth="7xl"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={handleExportSmiles}
          disabled={!ketcher}
          aria-label="Export as SMILES"
          className="px-3 sm:px-4 py-2 text-sm"
        >
          SMILES
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportMol}
          disabled={!ketcher}
          aria-label="Export as MOL v2000"
          className="px-3 sm:px-4 py-2 text-sm"
        >
          MOL v2000
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportInchi}
          disabled={!ketcher}
          aria-label="Export as InChI"
          className="px-3 sm:px-4 py-2 text-sm"
        >
          InChI
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportPng}
          disabled={!ketcher}
          aria-label="Export as PNG image"
          className="px-3 sm:px-4 py-2 text-sm"
        >
          PNG
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportSvg}
          disabled={!ketcher}
          aria-label="Export as SVG image"
          className="px-3 sm:px-4 py-2 text-sm"
        >
          SVG
        </Button>
        <Button
          onClick={handleSaveClick}
          disabled={!ketcher}
          aria-label="Save structure to library (Ctrl+S)"
          className="px-3 sm:px-4 py-2 text-sm"
        >
          Save to Library
        </Button>
      </div>

      <div className="relative border border-border rounded-lg overflow-hidden bg-card">
        {isLoadingShared && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
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
          className="p-3 bg-destructive/10 border border-destructive/40 rounded-md flex items-start gap-3"
        >
          <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-destructive">{shareError}</p>
          </div>
          <button
            onClick={() => setShareError(null)}
            className="text-destructive hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {smiles && (
        <div className="p-3 bg-muted border border-border rounded-md">
          <p className="text-sm font-mono break-all text-foreground">
            <strong>SMILES:</strong> {smiles}
          </p>
        </div>
      )}

      <SaveMoleculeModal
        key={saveModalKey}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
        isLoading={saveLoading}
        error={saveError}
      />
    </CalcShell>
  );
}
