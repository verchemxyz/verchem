'use client';

import { useId, useState } from 'react';
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
  const inputId = useId();

  const handleApply = (smiles: string) => {
    onChange(smiles);
    setIsModalOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label ? undefined : placeholder}
          maxLength={2000}
          className="flex-1 px-3 py-2 rounded-lg border border-input-border bg-input text-foreground font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors whitespace-nowrap"
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
