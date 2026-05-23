import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Molecules',
  description: 'View and manage your saved chemical structures.',
};

export default function MoleculesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
