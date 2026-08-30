'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Editor } from 'ketcher-react';
import 'ketcher-react/dist/index.css';
import { structServiceProvider } from '@/lib/molecule/ketcher-config';
import type { Ketcher } from 'ketcher-core';

export interface KetcherEditorProps {
  initialSmiles?: string;
  onChange?: (smiles: string, mol: string) => void;
  onStructureChange?: (hasStructure: boolean) => void;
  onInit?: (ketcher: Ketcher) => void;
  onReady?: () => void;
  height?: number | string;
}

export default function KetcherEditor({
  initialSmiles,
  onChange,
  onStructureChange,
  onInit,
  onReady,
  height = 600,
}: KetcherEditorProps) {
  const ketcherRef = useRef<Ketcher | null>(null);
  const onChangeRef = useRef(onChange);
  const onStructureChangeRef = useRef(onStructureChange);
  const onInitRef = useRef(onInit);
  const onReadyRef = useRef(onReady);
  const changeHandlerRef = useRef<(() => void) | null>(null);
  const changeVersionRef = useRef(0);
  const mountScrollPositionRef = useRef(
    typeof window === 'undefined'
      ? null
      : { x: window.scrollX, y: window.scrollY }
  );
  const serializationRunningRef = useRef(false);

  // Keep callback refs up to date without triggering re-initialisation
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onStructureChangeRef.current = onStructureChange;
  }, [onStructureChange]);

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
      ketcher.setSettings({ 'smart-layout': true });

      // Ketcher focuses its canvas during initialization. On narrow screens
      // that focus can scroll past the page title and Structure Coach. Restore
      // the position captured when this client-only editor mounted while
      // preserving Ketcher's keyboard focus.
      const mountScrollPosition = mountScrollPositionRef.current;
      if (
        mountScrollPosition &&
        (window.scrollX !== mountScrollPosition.x ||
          window.scrollY !== mountScrollPosition.y)
      ) {
        window.scrollTo(mountScrollPosition.x, mountScrollPosition.y);
      }
      mountScrollPositionRef.current = null;

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

      const serializeLatestChange = async () => {
        if (serializationRunningRef.current) return;
        serializationRunningRef.current = true;

        try {
          // Ketcher Standalone uses one chemistry worker. Coalesce rapid editor
          // events and serialize requests so older exports cannot race the
          // latest structure or overload that worker.
          while (true) {
            const changeVersion = changeVersionRef.current;
            try {
              const smiles = await ketcher.getSmiles();
              if (changeVersion !== changeVersionRef.current) continue;

              const mol = await ketcher.getMolfile();
              if (changeVersion !== changeVersionRef.current) continue;

              onChangeRef.current?.(smiles, mol);
              return;
            } catch {
              // Never leave a stale valid export enabled after an invalid edit.
              if (changeVersion === changeVersionRef.current) {
                onChangeRef.current?.('', '');
                return;
              }
            }
          }
        } finally {
          serializationRunningRef.current = false;
        }
      };

      const handleChange = () => {
        changeVersionRef.current += 1;
        onStructureChangeRef.current?.(!ketcher.editor.struct().isBlank());
        void serializeLatestChange();
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
