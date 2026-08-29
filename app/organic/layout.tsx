import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Organic Chemistry | VerChem',
    default: 'Organic Chemistry | VerChem',
  },
  description:
    'Interactive organic chemistry tools: functional groups, named reactions, a rule-based transformation guide, and study resources.',
}

export default function OrganicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
