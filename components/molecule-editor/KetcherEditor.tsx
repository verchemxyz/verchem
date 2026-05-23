'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Editor } from 'ketcher-react';
import { StandaloneStructServiceProvider } from 'ketcher-standalone';
import type { Ketcher } from 'ketcher-core';

export interface KetcherEditorProps {
  initialSmiles?: string;
  onChange?: (smiles: string, mol: string) => void;
  onInit?: (ketcher: Ketcher) => void;
  height?: number | string;
  toolbar?: 'full' | 'minimal';
  showSaveButton?: boolean;
}

export default function KetcherEditor({
  initialSmiles,
  onChange,
  onInit,
  height = 600,
  toolbar = 'full',
  showSaveButton = false,
}: KetcherEditorProps) {
  const ketcherRef = useRef<Ketcher | null>(null);
  const onChangeRef = useRef(onChange);
  const onInitRef = useRef(onInit);

  // Keep callback refs up to date without triggering re-initialisation
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onInitRef.current = onInit;
  }, [onInit]);

  // Update canvas when initialSmiles prop changes after mount
  useEffect(() => {
    if (ketcherRef.current && initialSmiles !== undefined) {
      ketcherRef.current
        .setMolecule(initialSmiles)
        .catch((err: unknown) => {
          console.error('Failed to set SMILES:', err);
        });
    }
  }, [initialSmiles]);

  const handleInit = useCallback(
    (ketcher: Ketcher) => {
      ketcherRef.current = ketcher;
      onInitRef.current?.(ketcher);

      if (initialSmiles) {
        ketcher
          .setMolecule(initialSmiles)
          .catch((err: unknown) => {
            console.error('Failed to set initial SMILES:', err);
          });
      }

      const handleChange = async () => {
        try {
          const smiles = await ketcher.getSmiles();
          const mol = await ketcher.getMolfile();
          onChangeRef.current?.(smiles, mol);
        } catch {
          // Empty canvas or invalid structure — ignore
        }
      };

      ketcher.changeEvent.add(handleChange);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialSmiles]
  );

  return (
    <div style={{ height, width: '100%' }}>
      <Editor
        staticResourcesUrl=""
        structServiceProvider={new StandaloneStructServiceProvider()}
        onInit={handleInit}
        errorHandler={(message: string) => {
          console.error('Ketcher error:', message);
        }}
      />
    </div>
  );
}
