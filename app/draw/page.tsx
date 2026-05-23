'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Ketcher } from 'ketcher-core';
import {
  downloadText,
  downloadPng,
  downloadSvg,
} from '@/lib/molecule/format-conversion';
import SaveMoleculeModal, {
  type SaveMoleculeData,
} from '@/components/molecule-editor/SaveMoleculeModal';

const KetcherEditor = dynamic(
  () => import('@/components/molecule-editor/KetcherEditor'),
  { ssr: false }
);

export default function DrawPage() {
  const router = useRouter();
  const [ketcher, setKetcher] = useState<Ketcher | null>(null);
  const [smiles, setSmiles] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalKey, setSaveModalKey] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleInit = useCallback((ketcherInstance: Ketcher) => {
    setKetcher(ketcherInstance);
  }, []);

  const handleChange = useCallback((newSmiles: string, _newMol: string) => {
    setSmiles(newSmiles);
  }, []);

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

  const handleSaveClick = async () => {
    // Check session before opening modal
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
      // Optionally show a toast here — using simple alert for Day 3-4
      // Day 6 will add proper toast/i18n
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
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            SMILES
          </button>
          <button
            onClick={handleExportMol}
            disabled={!ketcher}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            MOL v2000
          </button>
          <button
            onClick={handleExportInchi}
            disabled={!ketcher}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            InChI
          </button>
          <button
            onClick={handleExportPng}
            disabled={!ketcher}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            PNG
          </button>
          <button
            onClick={handleExportSvg}
            disabled={!ketcher}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            SVG
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!ketcher}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save to Library
          </button>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <KetcherEditor
            height={600}
            onInit={handleInit}
            onChange={handleChange}
          />
        </div>

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
