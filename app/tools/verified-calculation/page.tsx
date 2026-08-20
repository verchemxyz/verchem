import type { Metadata } from 'next'
import { CalcShell } from '@/components/lab'
import VerifiedCalculationWorkbench from '@/components/answer-cards/VerifiedCalculationWorkbench'
import { getVerifiedToolCatalog } from '@/lib/answer-cards/catalog'

export const metadata: Metadata = {
  title: { absolute: 'Signed Deterministic Calculation | VerChem' },
  description:
    'Run a deterministic chemistry engine and create an Ed25519-signed, replayable evidence artifact without AI or sign-in.',
}

export default function VerifiedCalculationPage() {
  return (
    <CalcShell
      eyebrow="Compute · Sign · Replay"
      title="Signed Deterministic Calculation"
      subtitle="Choose one of VerChem’s deterministic chemistry engines, enter declared inputs, and issue portable evidence that anyone can verify in their browser. No AI or sign-in required."
      backHref="/tools"
      backLabel="All tools"
      maxWidth="6xl"
    >
      <VerifiedCalculationWorkbench tools={getVerifiedToolCatalog()} />
    </CalcShell>
  )
}
