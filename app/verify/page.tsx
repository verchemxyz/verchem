import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CalcShell } from '@/components/lab'
import VerifierWorkbench from '@/components/answer-cards/VerifierWorkbench'

export const metadata: Metadata = {
  title: { absolute: 'Independent Artifact Verifier | VerChem' },
  description:
    'Verify a VerChem compact JWS locally in your browser: Ed25519 authenticity, provenance hash, current engine replay, and applicability declarations.',
}

export default function VerifyPage() {
  return (
    <CalcShell
      eyebrow="Independent browser verification"
      title="Verify a VerChem Artifact"
      subtitle="Authenticate the signer, check provenance integrity, replay the current deterministic engine, and inspect scientific applicability as separate claims."
      backHref="/tools/verified-calculation"
      backLabel="Create a signed calculation"
      maxWidth="5xl"
    >
      <Suspense fallback={<p className="text-muted-foreground">Loading independent verifier…</p>}>
        <VerifierWorkbench />
      </Suspense>
    </CalcShell>
  )
}
