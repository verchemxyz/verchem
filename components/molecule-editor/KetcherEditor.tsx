'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Editor } from 'ketcher-react';
import { structServiceProvider } from '@/lib/molecule/ketcher-config';
import type { Ketcher } from 'ketcher-core';

export interface KetcherEditorProps {
  initialSmiles?: string;
  onChange?: (smiles: string, mol: string) => void;
  onInit?: (ketcher: Ketcher) => void;
  onReady?: () => void;
  height?: number | string;
}

export default function KetcherEditor({
  initialSmiles,
  onChange,
  onInit,
  onReady,
  height = 600,
}: KetcherEditorProps) {
  const ketcherRef = useRef<Ketcher | null>(null);
  const onChangeRef = useRef(onChange);
  const onInitRef = useRef(onInit);
  const onReadyRef = useRef(onReady);
  const changeHandlerRef = useRef<(() => void) | null>(null);

  // Keep callback refs up to date without triggering re-initialisation
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onInitRef.current = onInit;
  }, [onInit]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

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

  useEffect(() => {
    return () => {
      const ketcher = ketcherRef.current;
      const handler = changeHandlerRef.current;
      if (ketcher && handler) {
        ketcher.changeEvent.remove(handler);
      }
    };
  }, []);

  const handleInit = useCallback(
    (ketcher: Ketcher) => {
      ketcherRef.current = ketcher;
      onInitRef.current?.(ketcher);

      const finalizeReady = () => {
        onReadyRef.current?.();
      };

      if (initialSmiles) {
        ketcher
          .setMolecule(initialSmiles)
          .then(finalizeReady)
          .catch((err: unknown) => {
            console.error('Failed to set initial SMILES:', err);
            finalizeReady(); // still ready, user can draw fresh
          });
      } else {
        finalizeReady();
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
      changeHandlerRef.current = handleChange;
    },
    [initialSmiles]
  );

  return (
    <div style={{ height, width: '100%' }}>
      <Editor
        staticResourcesUrl=""
        structServiceProvider={structServiceProvider}
        onInit={handleInit}
        errorHandler={(message: string) => {
          console.error('Ketcher error:', message);
        }}
      />
    </div>
  );
}
