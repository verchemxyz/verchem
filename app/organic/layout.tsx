import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Organic Chemistry | VerChem',
    default: 'Organic Chemistry | VerChem',
  },
  description:
    'Interactive organic chemistry tools: functional groups, named reactions, reaction predictor, and study resources. Free for students and educators.',
}

export default function OrganicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
