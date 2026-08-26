import { Spectral } from 'next/font/google'
import { LabShell } from '@/components/lab-qc'

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-lab-display',
  display: 'swap',
})

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <div className={spectral.variable}><LabShell>{children}</LabShell></div>
}
