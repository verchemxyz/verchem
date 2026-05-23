import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Structure Editor',
  description:
    'Draw and edit chemical structures with Ketcher. Export to SMILES, MOL, InChI, PNG, and SVG.',
};

export default function DrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
