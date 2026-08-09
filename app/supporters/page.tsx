import Link from 'next/link';
import { CalcShell, Card, SectionTitle } from '@/components/lab';
import { COMPOUND_STATISTICS } from '@/lib/data/compounds';

// There is no supporter ledger yet. Donations go through fixed-price Stripe
// Payment Links, which are not wired to any database here, so this page has no
// real names or totals to show — and it will not invent any. When a consented
// opt-in record exists, this page reads from it.

export default function SupportersPage() {
  return (
    <CalcShell
      eyebrow="Wall of gratitude"
      title="Our supporters"
      subtitle="VerChem is free for everyone. Some people chip in anyway."
      backHref="/"
      backLabel="Home"
      maxWidth="5xl"
      action={
        <Link
          href="/support"
          className="inline-flex items-center justify-center rounded-md bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          Support us
        </Link>
      }
    >
      <Card className="p-8">
        <SectionTitle className="mb-3">No public list yet</SectionTitle>
        <p className="text-muted-foreground leading-relaxed">
          We don&apos;t keep a supporter ledger. Contributions run through Stripe and
          aren&apos;t linked to any account here, so there are no names or totals we
          could publish honestly — and we&apos;d rather show nothing than show
          numbers nobody can check.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-4">
          If we ever publish this page for real, it will list only people who
          explicitly asked to be named, and the totals will come from actual
          records rather than a hand-written file.
        </p>
      </Card>

      <Card className="p-8">
        <SectionTitle className="mb-3">What your support pays for</SectionTitle>
        <ul className="space-y-3 text-muted-foreground">
          <li>Keeping 118 elements and {COMPOUND_STATISTICS.totalCompounds.toLocaleString('en-US')} compounds aligned with current NIST/IUPAC editions.</li>
          <li>Validating the calculation engines and documenting what each one assumes.</li>
          <li>Hosting, storage, and the compute behind structure search and signed results.</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-6">
          Support unlocks nothing — every feature is already free for everyone.
        </p>
      </Card>

      <Card className="p-10 text-center">
        <SectionTitle className="mb-4">Want to chip in?</SectionTitle>
        <p className="text-muted-foreground mb-8">
          Entirely optional, and it changes nothing about what you can use.
        </p>
        <Link
          href="/support"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 px-8 py-4 min-h-[44px] font-bold text-primary-foreground hover:bg-primary-600 transition-colors"
        >
          <span>Go to support page</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </Card>
    </CalcShell>
  );
}
