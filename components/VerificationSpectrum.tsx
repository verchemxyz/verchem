"use client";

import React, { useMemo } from "react";

interface VerificationSpectrumProps {
  hash: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
}

/**
 * Deterministic IR/NMR-style tick/peak strip derived from a hash string.
 * Each pair of hex chars maps to a bar height, producing a unique,
 * reproducible spectrum visualization that ties "signature" to chemistry.
 */
export function VerificationSpectrum({
  hash,
  height = 24,
  barWidth = 2,
  gap = 1,
  className = "",
}: VerificationSpectrumProps) {
  const bars = useMemo(() => {
    const normalized = hash.replace(/[^0-9a-fA-F]/g, "");
    const pairs: number[] = [];
    for (let i = 0; i < normalized.length; i += 2) {
      const hexPair = normalized.slice(i, i + 2);
      if (hexPair.length === 2) {
        const value = parseInt(hexPair, 16);
        // Map 0-255 to 10%-100% height
        pairs.push(10 + (value / 255) * 90);
      }
    }
    return pairs;
  }, [hash]);

  if (bars.length === 0) return null;

  return (
    <div
      className={`flex items-end ${className}`}
      style={{ height, gap }}
      aria-hidden="true"
      role="img"
      aria-label="Verification signature spectrum"
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className="bg-success rounded-sm"
          style={{
            width: barWidth,
            height: `${h}%`,
            marginRight: gap,
            opacity: 0.6 + (h / 100) * 0.4,
          }}
        />
      ))}
    </div>
  );
}
