import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { absolute: 'Tutorials are being rebuilt | VerChem' },
  description: 'VerChem tutorials are being rebuilt. Explore the available chemistry tools in the meantime.',
};

export default function TutorialsPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12">
        <p className="mb-3 font-mono text-sm font-semibold uppercase tracking-widest text-primary">
          Learning resources
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Tutorials are being rebuilt
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          The previous tutorial system has been retired while we design a clearer learning experience.
          VerChem&apos;s chemistry calculators and reference tools remain available.
        </p>
        <Link
          href="/tools"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Explore chemistry tools
        </Link>
      </section>
    </div>
  );
}
