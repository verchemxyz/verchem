'use client';

import React, { useState } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  Heart,
  BookmarkPlus,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface ResultCardProps {
  title: string;
  children: React.ReactNode;
  metadata?: {
    calculationType?: string;
    timestamp?: Date;
    accuracy?: number;
  };
  showActions?: boolean;
  isPremium?: boolean;
  className?: string;
}

/**
 * Universal Result Card Component
 *
 * Features:
 * - Save calculation (premium, mock for now)
 * - Favorite (premium, mock for now)
 * - Export PDF/PNG (premium, mock for now)
 * - Copy to clipboard
 * - Share link (premium, mock for now)
 * - Citation info
 *
 * @example
 * <ResultCard
 *   title="pH Calculation Result"
 *   metadata={{ calculationType: 'pH', timestamp: new Date() }}
 *   showActions={true}
 * >
 *   <PHResult value={2.0} />
 * </ResultCard>
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
  const [saved, setSaved] = useState(false);
  const [favorited, setFavorited] = useState(false);

  // Mock handlers (will be replaced with API calls later)
  const handleCopy = async () => {
    // In real implementation, this would copy the result data
    // For now, just show the feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Mock: Copy result text
    const resultText = title; // Simplified for mock
    await navigator.clipboard.writeText(resultText);
  };

  const handleSave = () => {
    if (!isPremium) {
      // Show upgrade prompt
      alert('Premium feature! Upgrade to save calculations.');
      return;
    }
    // Mock save
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFavorite = () => {
    if (!isPremium) {
      alert('Premium feature! Upgrade to favorite calculations.');
      return;
    }
    setFavorited(!favorited);
  };

  const handleExportPDF = () => {
    if (!isPremium) {
      alert('Premium feature! Upgrade to export PDF.');
      return;
    }
    // Mock export
    alert('PDF export coming soon!');
  };

  const handleExportPNG = () => {
    if (!isPremium) {
      alert('Premium feature! Upgrade to export images.');
      return;
    }
    // Mock export
    alert('PNG export coming soon!');
  };

  const handleShare = () => {
    if (!isPremium) {
      alert('Premium feature! Upgrade to share calculations.');
      return;
    }
    // Mock share
    const shareUrl = `https://verchem.xyz/calc/mock123`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Share link copied: ${shareUrl}`);
  };

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

          {/* Premium badge */}
          {isPremium && (
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
              PRO
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">{children}</div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                transition-all duration-200
                ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              title="Copy to clipboard"
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

            {/* Save */}
            <button
              onClick={handleSave}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                transition-all duration-200
                ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${!isPremium && 'opacity-60'}
              `}
              title={isPremium ? 'Save calculation' : 'Premium feature'}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Saved!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Save</span>
                  {!isPremium && (
                    <span className="text-xs bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded">
                      PRO
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Favorite */}
            <button
              onClick={handleFavorite}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                transition-all duration-200
                ${
                  favorited
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${!isPremium && 'opacity-60'}
              `}
              title={isPremium ? 'Add to favorites' : 'Premium feature'}
            >
              <Heart
                className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`}
              />
              {!isPremium && (
                <span className="text-xs bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded">
                  PRO
                </span>
              )}
            </button>

            {/* Export dropdown */}
            <div className="relative group">
              <button
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  border border-gray-300 dark:border-gray-600
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  transition-all duration-200
                  ${!isPremium && 'opacity-60'}
                `}
                title={isPremium ? 'Export options' : 'Premium feature'}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
                {!isPremium && (
                  <span className="text-xs bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                )}
              </button>

              {/* Dropdown menu */}
              <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={handleExportPDF}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 rounded-t-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Export PDF</span>
                </button>
                <button
                  onClick={handleExportPNG}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 rounded-b-lg transition-colors border-t border-gray-100 dark:border-gray-700"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Export PNG</span>
                </button>
              </div>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                border border-gray-300 dark:border-gray-600
                hover:bg-gray-50 dark:hover:bg-gray-700
                transition-all duration-200
                ${!isPremium && 'opacity-60'}
              `}
              title={isPremium ? 'Share calculation' : 'Premium feature'}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
              {!isPremium && (
                <span className="text-xs bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded">
                  PRO
                </span>
              )}
            </button>
          </div>

          {/* Accuracy indicator */}
          {metadata?.accuracy && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
      )}
    </div>
  );
}
