'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Ketcher } from 'ketcher-core';
import {
  downloadText,
  downloadPng,
  downloadSvg,
} from '@/lib/molecule/format-conversion';

const KetcherEditor = dynamic(
  () => import('@/components/molecule-editor/KetcherEditor'),
  { ssr: false }
);

export default function DrawPage() {
  const [ketcher, setKetcher] = useState<Ketcher | null>(null);
  const [smiles, setSmiles] = useState('');

  const handleInit = useCallback((ketcherInstance: Ketcher) => {
    setKetcher(ketcherInstance);
  }, []);;

  const handleChange = useCallback((newSmiles: string, _newMol: string) => {
    setSmiles(newSmiles);
  }, [])

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
    </div>
  );
}
