import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Signed Cards',
  description: 'View, share, and manage saved chemistry answers with signature and replay status.',
}

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
