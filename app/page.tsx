import Link from "next/link";
import { Spectral } from "next/font/google";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { VerificationSpectrum } from "@/components/VerificationSpectrum";
import { LabQcSection } from "@/components/home/LabQcSection";
import { COMPOUND_STATISTICS } from "@/lib/data/compounds";
import { signCard } from "@/lib/answer-cards/signature";
import { getActiveSigningKey } from "@/lib/answer-cards/signing-key";
import { createHomeDemoPayload } from "@/lib/answer-cards/demo-card";

const STRUCTURE_WORKFLOW = [
  { href: "/draw", label: "Draw", description: "Create a structure", number: "01" },
  {
    href: "/tools/substructure-search",
    label: "Search",
    description: "Match verified records",
    number: "02",
  },
  {
    href: "/tools/verified-calculation",
    label: "Verify",
    description: "Issue signed evidence",
    number: "03",
  },
] as const;

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-lab-display",
  display: "swap",
});

export default async function Home() {
  // Build-time/server rendering runs the REAL pipeline: live engine, live
  // auditor, fail-closed Ed25519 key module — every number shown below comes
  // from the signed payload. Development reuses the ephemeral key fallback.
  const demoPayload = createHomeDemoPayload(new Date().toISOString());
  const demoJws = await signCard(demoPayload);
  const { kid } = getActiveSigningKey();
  const kidDisplay = `${kid.slice(0, 8)}…${kid.slice(-6)}`;
  const sigDisplay = `JWS · EdDSA/Ed25519 · kid ${kidDisplay}`;
  const demoToolCall = demoPayload.tool_calls[0]!;
  const demoMolarMass = (demoToolCall.result.value as { molar_mass: number }).molar_mass;

  const chemistryToolsHero = (
    <section className="relative border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Headline */}
          <div className="text-center animate-reveal">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
              Verified Chemistry Workbench
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Deterministic calculators stay fast and local. Verified Answer Cards add signed, replayable evidence when you need it.
            </p>
          </div>

          {/* Signed Result Card — Audit Receipt */}
          <div className="mt-12 max-w-md mx-auto animate-reveal animate-reveal-delay-1">
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              {/* Spectrum strip */}
              <div className="px-5 pt-4 pb-1">
                <VerificationSpectrum
                  hash={demoJws}
                  height={28}
                  barWidth={2}
                  gap={1}
                />
              </div>

              <div className="px-5 py-4">
                {/* Audit receipt rows */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Compound</span>
                    <span className="font-bold text-foreground font-sans">H₂SO₄</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Provenance</span>
                    <span className="max-w-[13rem] truncate text-right font-mono text-xs text-muted-foreground">
                      {demoPayload.provenance?.artifact_hash}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Result</span>
                    <span className="font-mono text-foreground">{demoMolarMass} g/mol</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Engine</span>
                    <span className="font-mono text-muted-foreground text-right text-xs sm:text-sm">
                      {demoToolCall.engine}@{demoToolCall.engine_version}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Prose audit</span>
                    <span className="font-mono text-foreground">
                      {demoPayload.audit.clean ? "clean" : "flagged"} · {demoPayload.audit.unmatched.length} unmatched
                    </span>
                  </div>
                </div>

                {/* Source line — amber accent dot, muted text for WCAG AA */}
                <div className="mt-3 flex items-center gap-2 border-l-2 border-warning pl-2">
                  <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                    Source: {demoToolCall.citation}
                  </span>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-border" />

                {/* Signature + verified */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {sigDisplay}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-strong">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                </div>

                <details className="mt-3 border-t border-border pt-3">
                  <summary className="cursor-pointer text-xs font-medium text-primary-600 hover:text-primary-500">
                    Inspect the signed compact JWS
                  </summary>
                  <code className="mt-2 block max-h-24 overflow-auto break-all rounded bg-muted p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {demoJws}
                  </code>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    <Link href="/verify" className="text-primary-600 hover:text-primary-500">
                      Verify independently in your browser
                    </Link>
                    <a href="/.well-known/verchem-keys.json" className="text-primary-600 hover:text-primary-500">
                      Inspect the published public key set
                    </a>
                  </div>
                </details>
              </div>
            </div>

            {/* Verify your own result link */}
            <div className="mt-3 text-center">
              <Link
                href="/tools/verified-calculation"
                className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors"
              >
                Verify your own result
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Trust Strip: Compute → Sign → Explain */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-reveal animate-reveal-delay-2">
            {[
              { label: "Compute", desc: "Deterministic engine", num: "01" },
              { label: "Sign", desc: "Ed25519 JWS · public key", num: "02" },
              { label: "Verify", desc: "Browser replay · AI optional", num: "03" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">{step.num}</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
                {i < 2 && (
                  <svg className="hidden md:block w-4 h-4 text-muted-foreground ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Structure workflow: Draw → Search → Verify */}
          <nav
            aria-label="Draw, search, and verify workflow"
            className="mt-8 max-w-3xl mx-auto rounded-lg border border-border bg-card px-4 py-3 animate-reveal animate-reveal-delay-2"
          >
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Structure workflow
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              {STRUCTURE_WORKFLOW.map((step, index) => (
                <div key={step.href} className="contents">
                  <Link
                    href={step.href}
                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {step.number}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground transition-colors group-hover:text-primary-500">
                        {step.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {step.description}
                      </span>
                    </span>
                  </Link>
                  {index < STRUCTURE_WORKFLOW.length - 1 && (
                    <svg
                      className="mx-auto h-4 w-4 shrink-0 rotate-90 text-muted-foreground sm:mx-1 sm:rotate-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-reveal animate-reveal-delay-3">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary-500 text-primary-foreground font-medium hover:bg-primary-600 transition-colors"
            >
              Open Workbench
            </Link>
            <Link
              href="/periodic-table"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors"
            >
              Browse Elements
            </Link>
          </div>

          {/* Search */}
          <div className="mt-12 max-w-xl mx-auto animate-reveal animate-reveal-delay-4">
            <GlobalSearchBar
              placeholder="Search compounds, elements, calculators..."
              className="mb-0"
            />
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-sm">
              {["H₂O", "C₆H₁₂O₆", "stoichiometry", "pKa"].map((q) => (
                <Link
                  key={q}
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="font-mono text-xs text-muted-foreground hover:text-primary-500 transition-colors"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Lab-QC front door — static copy; the authenticated workspace stays at /lab. */}
      <div className={spectral.variable}>
        <LabQcSection />
      </div>

      {/* Tools Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Tools
          </h2>
          <p className="mt-2 text-muted-foreground">
            Deterministic engines with published references and explicit model assumptions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FeaturedToolCard
            href="/draw"
            marker="01 · Draw"
            title="Structure Editor"
            description="Draw or paste SMILES, export SMILES · MOL · InChI · PNG · SVG, and save structures to My Molecules with AIVerID."
            details={["Open formats", "Personal library", "Browser-native"]}
            icon={<StructureIcon />}
          />
          <FeaturedToolCard
            href="/tools/substructure-search"
            marker="02 · Search"
            title="Substructure Search"
            description="Run SMILES/SMARTS substructure queries or Tanimoto similarity across 209 verified structures."
            details={["SMILES / SMARTS", "Tanimoto", "209 structures"]}
            icon={<StructureSearchIcon />}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard
            href="/periodic-table"
            title="Periodic Table"
            description="All 118 elements; standard atomic weights based on IUPAC 2021, with selected properties citing NIST and CRC references."
            icon={<BeakerIcon />}
          />
          <ToolCard
            href="/calculators"
            title="Calculators"
            description="pH, stoichiometry, gas laws, thermodynamics, molarity, and more with step-by-step solutions."
            icon={<CalculatorIcon />}
          />
          <ToolCard
            href="/3d-viewer"
            title="3D Molecule Demo"
            description="Rotate and inspect 31 built-in molecule models with CPK coloring. This curated demo does not accept user files."
            icon={<CubeIcon />}
          />
          <ToolCard
            href="/organic"
            title="Organic Chemistry"
            description="22 functional groups, 40 named reactions with mechanisms, and reaction predictor."
            icon={<FlaskIcon />}
          />
          <ToolCard
            href="/spectroscopy"
            title="Spectroscopy"
            description="IR interpreter, NMR analyzer (¹H & ¹³C), and mass spectrometry tools."
            icon={<WaveIcon />}
          />
          <ToolCard
            href="/equation-balancer"
            title="Equation Balancer"
            description="Balance chemical equations with systematic matrix reduction and verification."
            icon={<ScaleIcon />}
          />
          <ToolCard
            href="/lewis"
            title="Lewis Structures"
            description="Generate Lewis dot structures with valence-electron accounting and formal charge analysis."
            icon={<AtomIcon />}
          />
          <ToolCard
            href="/tools"
            title="All Tools"
            description="Explore the full workbench: nuclear chemistry, lab safety, electron configuration, and more."
            icon={<GridIcon />}
          />
        </div>
      </section>

      {chemistryToolsHero}

      {/* Why Verified */}
      <section className="border-t border-border bg-calibration-grid">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Why verified?
            </h2>
            <p className="mt-2 text-muted-foreground max-w-xl">
              AI can hallucinate. A VerChem Verified Answer Card records and signs the engine evidence so you can audit the chain of trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary-500 text-primary-foreground text-xs font-bold">
                  1
                </span>
                <h3 className="font-semibold text-foreground">Engine computes</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every number is produced by a deterministic algorithm — no stochastic LLM sampling. The same input always yields the same output.
              </p>
            </div>

            <div className="border border-border rounded-lg bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary-500 text-primary-foreground text-xs font-bold">
                  2
                </span>
                <h3 className="font-semibold text-foreground">Ed25519 JWS signs</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each Verified Answer Card is signed as an Ed25519 compact JWS covering its calculation inputs, engine release, result, explanation, and timestamp. Anyone can verify it independently against VerChem&apos;s published public key instead of trusting a server-reported validity result. Standard calculator panels are not signed.
              </p>
            </div>

            <div className="border border-border rounded-lg bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary-500 text-primary-foreground text-xs font-bold">
                  3
                </span>
                <h3 className="font-semibold text-foreground">AI explains</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                On a Verified Answer Card, AI only narrates around the signed numbers — it never generates the result itself. Any later edit to the signed engine result or explanation breaks the signature.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "118", label: "Elements (NIST)" },
              { value: "24+", label: "Deterministic tools" },
              { value: COMPOUND_STATISTICS.totalCompounds.toLocaleString("en-US"), label: "Compounds" },
              { value: "61", label: "Signed engines" },
            ].map((stat) => (
              <div key={stat.label} className="border border-border rounded-lg bg-card p-4 text-center">
                <div className="text-2xl font-bold text-foreground font-sans">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer content on homepage */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 flex items-center justify-center rounded border border-border bg-card font-mono text-[10px] font-bold text-foreground">
                  VC
                </div>
                <span className="font-bold text-foreground">VerChem</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Deterministic chemistry workbench with optional Ed25519 JWS-signed Verified Answer Cards that anyone can check against our published public keys.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Chemistry</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/periodic-table" className="hover:text-primary-500 transition-colors">Periodic Table</Link></li>
                <li><Link href="/organic" className="hover:text-primary-500 transition-colors">Organic Chemistry</Link></li>
                <li><Link href="/draw" className="hover:text-primary-500 transition-colors">Structure Editor</Link></li>
                <li><Link href="/calculators" className="hover:text-primary-500 transition-colors">Calculators</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/spectroscopy" className="hover:text-primary-500 transition-colors">Spectroscopy</Link></li>
                <li><Link href="/tools/lab-safety" className="hover:text-primary-500 transition-colors">Lab Safety</Link></li>
                <li><Link href="/tools/nuclear" className="hover:text-primary-500 transition-colors">Nuclear Chemistry</Link></li>
                <li><Link href="/tools" className="hover:text-primary-500 transition-colors">All Tools</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary-500 transition-colors">Terms of Service</Link></li>
                <li><Link href="/support" className="hover:text-primary-500 transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 VerChem. All rights reserved.</p>
            <p className="mt-1">Part of the Ver* Ecosystem by Job Prukpatarakul</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Simple icon components — no external deps, no emoji */
function FeaturedToolCard({
  href,
  marker,
  title,
  description,
  details,
  icon,
}: {
  href: string;
  marker: string;
  title: string;
  description: string;
  details: readonly string[];
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block h-full">
      <div className="relative h-full overflow-hidden rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary-500/50">
        <div className="absolute inset-x-0 top-0 h-px bg-primary-500" />
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {marker}
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
            {icon}
          </span>
        </div>
        <h3 className="mt-5 text-lg font-semibold text-foreground transition-colors group-hover:text-primary-500">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-5 border-t border-border pt-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {details.join(" · ")}
        </div>
        <div className="mt-3 text-sm font-medium text-primary-600">
          Open tool <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}

function ToolCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <div className="h-full border border-border rounded-lg bg-card p-5 transition-colors hover:border-primary-500/50">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-md bg-muted flex items-center justify-center text-foreground">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary-500 transition-colors">
              {title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function BeakerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function StructureIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 5l5-3 5 3v6l-5 3-5-3V5zM12 14v6m-3 1h6M7 5l5 3 5-3M12 8v6" />
      <circle cx="7" cy="5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StructureSearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="10" cy="10" r="6" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 14.5L20 20M7.5 8.5l2.5-1.5 2.5 1.5v3L10 13l-2.5-1.5v-3z" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
