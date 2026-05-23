'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MoleculeInputModal = dynamic(
  () => import('@/components/molecule-editor/MoleculeInputModal'),
  { ssr: false }
);

export interface MoleculeInputProps {
  value: string;
  onChange: (smiles: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function MoleculeInput({
  value,
  onChange,
  placeholder = 'Enter SMILES or click Draw',
  label,
  className = '',
}: MoleculeInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleApply = (smiles: string) => {
    onChange(smiles);
    setIsModalOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={2000}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          Draw
        </button>
      </div>

      <MoleculeInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSmiles={value}
        onApply={handleApply}
      />
    </div>
  );
}
