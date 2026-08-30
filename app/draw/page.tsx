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
import { runKetcherMutation } from '@/lib/molecule/ketcher-async';
import SaveMoleculeModal, {
  type SaveMoleculeData,
} from '@/components/molecule-editor/SaveMoleculeModal';
import StructureCoach from '@/components/molecule-editor/StructureCoach';
import { CalcShell, Button } from '@/components/lab';
import {
  normalizeStructureCheckError,
  runKetcherStructureCheck,
} from '@/lib/molecule/structure-check';
import {
  combineStructureCoachAnalysis,
  type RDKitStructureCheckOutcome,
  type StructureCoachIssue,
  type StructureCoachStatus,
} from '@/lib/molecule/structure-coach';
import { loadRDKit } from '@/lib/rdkit/client';
import { validateStructureCandidatesWithRDKit } from '@/lib/rdkit/structure-validation';

const KetcherEditor = dynamic(
  () => import('@/components/molecule-editor/KetcherEditor'),
  { ssr: false }
);

export default function DrawPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ketcher, setKetcher] = useState<Ketcher | null>(null);
  const [smiles, setSmiles] = useState('');
  const [hasStructure, setHasStructure] = useState(false);
  const [structureRevision, setStructureRevision] = useState(0);
  const [coachStatus, setCoachStatus] = useState<StructureCoachStatus>('empty');
  const [coachIssues, setCoachIssues] = useState<readonly StructureCoachIssue[]>([]);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [autoCheck, setAutoCheck] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalKey, setSaveModalKey] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const loadedShareKeyRef = useRef<string | null>(null);
  const shareLoadRequestRef = useRef(0);
  const shareMutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const hasStructureRef = useRef(false);
  const structureRevisionRef = useRef(0);
  const checkRequestRef = useRef(0);
  const tidyRequestRef = useRef(0);
  const autoCheckTimerRef = useRef<number | null>(null);
  const exportInFlightRef = useRef(false);

  const handleInit = useCallback((ketcherInstance: Ketcher) => {
    setKetcher(ketcherInstance);
  }, []);

  const handleChange = useCallback((newSmiles: string, _newMol: string) => {
    setSmiles(newSmiles);
  }, []);

  const handleStructureChange = useCallback((nextHasStructure: boolean) => {
    hasStructureRef.current = nextHasStructure;
    const nextRevision = structureRevisionRef.current + 1;
    structureRevisionRef.current = nextRevision;
    checkRequestRef.current += 1;

    setHasStructure(nextHasStructure);
    setStructureRevision(nextRevision);
    setIsChecking(false);
    setCoachIssues([]);
    setCoachError(null);
    setExportError(null);
    setCoachStatus(nextHasStructure ? 'dirty' : 'empty');

    if (!nextHasStructure) setSmiles('');
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+S → open save modal
  const handleSaveClick = useCallback(async () => {
    if (!hasStructureRef.current) return;
    const requestedRevision = structureRevisionRef.current;

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
    if (
      !hasStructureRef.current ||
      requestedRevision !== structureRevisionRef.current
    ) {
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

    const requestId = shareLoadRequestRef.current + 1;
    shareLoadRequestRef.current = requestId;
    const { smiles: urlSmiles, molId, error } = parseShareParams(searchParams);
    if (error) {
      loadedShareKeyRef.current = null;
      setIsLoadingShared(false);
      setShareError(error);
      return;
    }

    const key = urlSmiles ? `smiles:${urlSmiles}` : molId ? `molid:${molId}` : null;
    if (!key) {
      loadedShareKeyRef.current = null;
      setIsLoadingShared(false);
      setShareError(null);
      return;
    }

    // Guard against duplicate loads of the same share
    if (loadedShareKeyRef.current === key) return;
    loadedShareKeyRef.current = key;
    const controller = new AbortController();
    const isCurrentRequest = () =>
      !controller.signal.aborted && requestId === shareLoadRequestRef.current;

    setIsLoadingShared(true);
    setShareError(null);

    const loadSharedStructure = async () => {
      try {
        let source: string;
        if (urlSmiles) {
          source = urlSmiles;
        } else {
          const res = await fetch(`/api/molecules/${molId}`, {
            signal: controller.signal,
          });
          if (res.status === 404) throw new Error('Molecule not found or not public');
          if (!res.ok) throw new Error('Failed to load molecule');
          const data: unknown = await res.json();
          if (typeof data !== 'object' || data === null) {
            throw new Error('Molecule data is invalid');
          }
          const record = data as Record<string, unknown>;
          const molBlock = typeof record.mol_block === 'string' ? record.mol_block : null;
          const savedSmiles = typeof record.smiles === 'string' ? record.smiles : null;
          source = molBlock || savedSmiles || '';
          if (!source) throw new Error('Molecule data is invalid');
        }

        if (!isCurrentRequest()) return;

        // Serialize programmatic canvas replacements. Ketcher cannot cancel an
        // in-flight setMolecule call, so the newest URL load must run last.
        const mutation = shareMutationQueueRef.current
          .catch(() => undefined)
          .then(async () => {
            if (!isCurrentRequest()) return;
            await runKetcherMutation(ketcher, () => ketcher.setMolecule(source));
          });
        shareMutationQueueRef.current = mutation;
        await mutation;

        if (!isCurrentRequest()) return;
      } catch (err: unknown) {
        if (!isCurrentRequest()) return;
        loadedShareKeyRef.current = null;
        const fallback = urlSmiles ? 'Failed to load SMILES' : 'Failed to load molecule';
        setShareError(err instanceof Error ? `${fallback}: ${err.message}` : fallback);
      } finally {
        if (isCurrentRequest()) setIsLoadingShared(false);
      }
    };

    void loadSharedStructure();

    return () => {
      controller.abort();
      if (requestId === shareLoadRequestRef.current) {
        shareLoadRequestRef.current += 1;
        if (loadedShareKeyRef.current === key) loadedShareKeyRef.current = null;
      }
    };
  }, [ketcher, searchParams]);

  const runStructureAnalysis = useCallback(async () => {
    if (!ketcher || !hasStructureRef.current) return null;

    if (autoCheckTimerRef.current !== null) {
      window.clearTimeout(autoCheckTimerRef.current);
      autoCheckTimerRef.current = null;
    }

    const checkedRevision = structureRevisionRef.current;
    const requestId = checkRequestRef.current + 1;
    checkRequestRef.current = requestId;
    setIsChecking(true);
    setCoachError(null);
    setCoachStatus('checking');

    try {
      let ket: string | null = null;
      let ketError: unknown = null;
      try {
        ket = await ketcher.getKet();
      } catch (error: unknown) {
        ketError = error;
      }

      let rdkitSmiles: string | null = null;
      try {
        // Ketcher's normalized SMILES is the most reliable interchange format
        // for RDKit's independent parse/sanitize pass. Indigo still receives
        // lossless KET so query/stereo/editor-specific features are preserved.
        rdkitSmiles = await ketcher.getSmiles();
      } catch {
        // Indigo can still return useful findings when RDKit input export fails.
      }

      let rdkitMolfile: string | null = null;
      try {
        // MOL v2000 is a compatibility fallback for structures whose valid
        // normalized SMILES is interpreted differently by a browser WASM build.
        rdkitMolfile = await ketcher.getMolfile('v2000');
      } catch {
        // The SMILES candidate can still complete the independent check.
      }

      const indigoPromise = ket
        ? runKetcherStructureCheck(ketcher.structService, ket)
        : Promise.resolve(normalizeStructureCheckError(ketError));

      const rdkitPromise: Promise<RDKitStructureCheckOutcome> = (async () => {
        const rdkitCandidates = [rdkitSmiles, rdkitMolfile].filter(
          (candidate): candidate is string => Boolean(candidate)
        );
        if (rdkitCandidates.length === 0) {
          return {
            result: null,
            error: 'RDKit could not complete the structural check.',
          };
        }

        try {
          const rdkit = await loadRDKit();
          return {
            result: validateStructureCandidatesWithRDKit(rdkit, rdkitCandidates),
            error: null,
          };
        } catch {
          return {
            result: null,
            error: 'RDKit could not complete the structural check.',
          };
        }
      })();

      const [indigoReport, rdkitOutcome] = await Promise.all([
        indigoPromise,
        rdkitPromise,
      ]);

      if (
        requestId !== checkRequestRef.current ||
        checkedRevision !== structureRevisionRef.current
      ) {
        return null;
      }

      const analysis = combineStructureCoachAnalysis(indigoReport, rdkitOutcome);
      setCoachIssues(analysis.issues);
      setCoachError(analysis.actionError);
      setCoachStatus(analysis.status);
      return analysis;
    } finally {
      if (
        requestId === checkRequestRef.current &&
        checkedRevision === structureRevisionRef.current
      ) {
        setIsChecking(false);
      }
    }
  }, [ketcher]);

  useEffect(() => {
    if (!autoCheck || !ketcher || !hasStructure || isLoadingShared || isTidying) {
      return;
    }

    autoCheckTimerRef.current = window.setTimeout(() => {
      autoCheckTimerRef.current = null;
      void runStructureAnalysis();
    }, 700);

    return () => {
      if (autoCheckTimerRef.current !== null) {
        window.clearTimeout(autoCheckTimerRef.current);
        autoCheckTimerRef.current = null;
      }
    };
  }, [
    autoCheck,
    hasStructure,
    isLoadingShared,
    isTidying,
    ketcher,
    runStructureAnalysis,
    structureRevision,
  ]);

  const handleTidyLayout = useCallback(async () => {
    if (!ketcher || !hasStructureRef.current) return;

    const requestId = tidyRequestRef.current + 1;
    tidyRequestRef.current = requestId;
    const startingRevision = structureRevisionRef.current;
    setIsTidying(true);
    setCoachError(null);

    try {
      await runKetcherMutation(ketcher, () => ketcher.layout());
      if (requestId !== tidyRequestRef.current) return;

      // Ketcher normally emits a change event after layout. Keep the coach
      // correct even if an upstream version omits that event.
      if (structureRevisionRef.current === startingRevision) {
        handleStructureChange(true);
      }
      if (!autoCheck) await runStructureAnalysis();
    } catch {
      if (requestId === tidyRequestRef.current) {
        setCoachStatus('dirty');
        setCoachError(
          'Ketcher could not tidy this layout. Review the drawing and try again.'
        );
      }
    } finally {
      if (requestId === tidyRequestRef.current) setIsTidying(false);
    }
  }, [autoCheck, handleStructureChange, ketcher, runStructureAnalysis]);

  const runExport = async <T,>(
    format: string,
    prepare: () => Promise<T>,
    download: (value: T) => void
  ) => {
    if (exportInFlightRef.current || !hasStructureRef.current) return;
    const exportRevision = structureRevisionRef.current;
    exportInFlightRef.current = true;
    setIsExporting(true);
    setExportError(null);
    try {
      const value = await prepare();
      if (
        !hasStructureRef.current ||
        exportRevision !== structureRevisionRef.current
      ) {
        setExportError(`Could not export ${format} because the drawing changed. Try again.`);
        return;
      }
      download(value);
    } catch {
      setExportError(
        `Could not export ${format}. Review the Structure Coach findings and the current drawing.`
      );
    } finally {
      exportInFlightRef.current = false;
      setIsExporting(false);
    }
  };

  const handleExportSmiles = () => {
    if (!ketcher) return;
    void runExport('SMILES', () => ketcher.getSmiles(), (value) => {
      downloadText(value, 'structure.smiles');
    });
  };

  const handleExportMol = () => {
    if (!ketcher) return;
    void runExport('MOL v2000', () => ketcher.getMolfile('v2000'), (value) => {
      downloadText(value, 'structure.mol');
    });
  };

  const handleExportInchi = () => {
    if (!ketcher) return;
    void runExport('InChI', () => ketcher.getInchi(), (value) => {
      downloadText(value, 'structure.inchi');
    });
  };

  const handleExportPng = () => {
    if (!ketcher) return;
    void runExport('PNG', async () => {
      const molfile = await ketcher.getMolfile();
      return ketcher.generateImage(molfile, {
        outputFormat: 'png',
        backgroundColor: '#ffffff',
      });
    }, (blob) => {
      downloadPng(blob, 'structure.png');
    });
  };

  const handleExportSvg = () => {
    if (!ketcher) return;
    void runExport('SVG', async () => {
      const molfile = await ketcher.getMolfile();
      const blob = await ketcher.generateImage(molfile, {
        outputFormat: 'svg',
        backgroundColor: '#ffffff',
      });
      return blob.text();
    }, (text) => {
      downloadSvg(text, 'structure.svg');
    });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Export structure
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Export structure"
            aria-busy={isExporting}
          >
            <Button
              variant="secondary"
              onClick={handleExportSmiles}
              disabled={!ketcher || !hasStructure || isExporting}
              aria-label="Download structure as SMILES"
              className="px-3 sm:px-4 py-2 text-sm"
            >
              SMILES
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportMol}
              disabled={!ketcher || !hasStructure || isExporting}
              aria-label="Download structure as MOL v2000"
              className="px-3 sm:px-4 py-2 text-sm"
            >
              MOL v2000
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportInchi}
              disabled={!ketcher || !hasStructure || isExporting}
              aria-label="Download structure as InChI"
              className="px-3 sm:px-4 py-2 text-sm"
            >
              InChI
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportPng}
              disabled={!ketcher || !hasStructure || isExporting}
              aria-label="Download structure as PNG image"
              className="px-3 sm:px-4 py-2 text-sm"
            >
              PNG
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportSvg}
              disabled={!ketcher || !hasStructure || isExporting}
              aria-label="Download structure as SVG image"
              className="px-3 sm:px-4 py-2 text-sm"
            >
              SVG
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSaveClick}
          disabled={!ketcher || !hasStructure}
          aria-label="Save structure to library (Ctrl+S)"
          className="px-3 sm:px-4 py-2 text-sm sm:shrink-0"
        >
          Save to Library
        </Button>
      </div>

      {!hasStructure && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Draw or paste a structure in the editor to enable export and saving.
        </p>
      )}

      <StructureCoach
        status={coachStatus}
        issues={coachIssues}
        autoCheck={autoCheck}
        isChecking={isChecking}
        isTidying={isTidying}
        disabled={!ketcher || !hasStructure || isLoadingShared}
        actionError={coachError}
        onCheck={() => {
          void runStructureAnalysis();
        }}
        onTidy={() => {
          void handleTidyLayout();
        }}
        onAutoCheckChange={setAutoCheck}
      />

      <div
        className="relative border border-border rounded-lg overflow-hidden bg-card"
        aria-busy={isLoadingShared || isTidying}
      >
        {isLoadingShared && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
          >
            <div
              aria-hidden="true"
              className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"
            />
            <span className="sr-only">Loading shared structure…</span>
          </div>
        )}
        <div className="h-[calc(100vh-280px)] min-h-[400px] sm:h-[600px]">
          <KetcherEditor
            height="100%"
            onInit={handleInit}
            onChange={handleChange}
            onStructureChange={handleStructureChange}
          />
        </div>
      </div>

      {shareError && (
        <div
          role="alert"
          className="p-3 bg-destructive/10 border border-destructive/40 rounded-md flex items-start gap-3"
        >
          <svg aria-hidden="true" className="w-5 h-5 text-destructive-strong flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-destructive-strong">{shareError}</p>
          </div>
          <button
            type="button"
            onClick={() => setShareError(null)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-destructive-strong hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {exportError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"
        >
          <svg
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive-strong"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="min-w-0 flex-1 break-words text-sm text-destructive-strong">
            {exportError}
          </p>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-destructive-strong transition-opacity hover:opacity-70"
            aria-label="Dismiss export error"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
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
