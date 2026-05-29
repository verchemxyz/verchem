'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { exportElement, printElement } from '@/lib/export';

interface ResultCardProps {
  title: string;
  children: React.ReactNode;
  metadata?: {
    calculationType?: string;
    timestamp?: Date;
    accuracy?: number;
  };
  showActions?: boolean;
  /** Cosmetic "PRO" tag in the header only — does NOT gate any action (FREE FIRST). */
  isPremium?: boolean;
  className?: string;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'verchem-result'
  );
}

/**
 * Universal Result Card Component
 *
 * Actions (all FREE for everyone — FREE FIRST):
 * - Copy result text to clipboard
 * - Export PDF (native print → "Save as PDF": crisp, selectable, oklch-safe)
 * - Export PNG (html2canvas-pro raster image)
 */
export function ResultCard({
  title,
  children,
  metadata,
  showActions = true,
  isPremium = false,
  className = '',
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<null | 'png'>(null);
  const [error, setError] = useState<string | null>(null);
  // Only the header + content are captured for export — never the actions bar.
  const exportRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    const text = exportRef.current?.innerText?.trim() || title;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }, [title]);

  const handleExportPDF = useCallback(() => {
    setError(null);
    const ok = printElement(exportRef.current, { title });
    if (!ok) setError('Please allow pop-ups to export as PDF.');
  }, [title]);

  const handleExportPNG = useCallback(async () => {
    if (!exportRef.current) return;
    setError(null);
    setExporting('png');
    try {
      await exportElement(exportRef.current, {
        format: 'png',
        quality: 'high',
        filename: slugify(title),
      });
    } catch {
      setError('Image export failed. Try the PDF option instead.');
    } finally {
      setExporting(null);
    }
  }, [title]);

  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        border-2 border-gray-200 dark:border-gray-700
        rounded-xl shadow-lg
        overflow-hidden
        transition-all duration-300
        hover:shadow-xl
        ${className}
      `}
    >
      {/* Captured-for-export region: header + content */}
      <div ref={exportRef}>
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
              {metadata?.calculationType && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {metadata.calculationType}
                  {metadata.timestamp && (
                    <span className="ml-2">
                      • {metadata.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              )}
            </div>

            {isPremium && (
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                PRO
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">{children}</div>

        {/* Accuracy indicator (part of the exported artifact) */}
        {metadata?.accuracy && (
          <div className="px-6 pb-4 -mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Scientific Accuracy:
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {(metadata.accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metadata.accuracy * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions (never exported) */}
      {showActions && (
        <div className="no-print px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Copy result to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm font-medium">Copy</span>
                </>
              )}
            </button>

            {/* Export PDF (native print) */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              title="Export as PDF (Save as PDF in the print dialog)"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">PDF</span>
            </button>

            {/* Export PNG (image) */}
            <button
              onClick={handleExportPNG}
              disabled={exporting === 'png'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-60"
              title="Export as PNG image"
            >
              {exporting === 'png' ? (
                <>
                  <Download className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Exporting…</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">PNG</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
