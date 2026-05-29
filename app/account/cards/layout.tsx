import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Verified Cards',
  description: 'View, share, and manage your saved verified chemistry answers.',
}

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
