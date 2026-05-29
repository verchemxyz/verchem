import Link from "next/link";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { VerificationSpectrum } from "@/components/VerificationSpectrum";

// Real SHA-256 hex (64 chars) — a valid-shaped demo signature for the hero.
const DEMO_SIGNATURE = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export default function Home() {
  const sigPrefix = DEMO_SIGNATURE.slice(0, 4);
  const sigSuffix = DEMO_SIGNATURE.slice(-4);
  const sigDisplay = `vc_hmac_sha256 ${sigPrefix}…${sigSuffix}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — Signed Evidence Panel */}
      <section className="relative border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Headline */}
          <div className="text-center animate-reveal">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
              Verified Chemistry Workbench
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Deterministic engines calculate. AI explains only the signed result.
            </p>
          </div>

          {/* Signed Result Card — Audit Receipt */}
          <div className="mt-12 max-w-md mx-auto animate-reveal animate-reveal-delay-1">
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              {/* Spectrum strip */}
              <div className="px-5 pt-4 pb-1">
                <VerificationSpectrum
                  hash={DEMO_SIGNATURE}
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
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Result</span>
                    <span className="font-mono text-foreground">98.072 g/mol</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Arithmetic</span>
                    <span className="font-mono text-muted-foreground text-right text-xs sm:text-sm">
                      2×1.008 + 32.06 + 4×15.999
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Sum</span>
                    <span className="font-mono text-foreground">= 98.072</span>
                  </div>
                </div>

                {/* Source line — amber accent dot, muted text for WCAG AA */}
                <div className="mt-3 flex items-center gap-2 border-l-2 border-warning pl-2">
                  <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                    Source: IUPAC 2021 · Engine: molar-mass@verchem
                  </span>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-border" />

                {/* Signature + verified */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {sigDisplay}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Verify your own result link */}
            <div className="mt-3 text-center">
              <Link
                href="/tools/verified-answer"
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
              { label: "Sign", desc: "HMAC-SHA256 seal", num: "02" },
              { label: "Explain", desc: "AI around the numbers", num: "03" },
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

      {/* Tools Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Tools
          </h2>
          <p className="mt-2 text-muted-foreground">
            Deterministic engines, validated against NIST and IUPAC standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard
            href="/periodic-table"
            title="Periodic Table"
            description="All 118 elements with NIST-validated atomic weights, electron configurations, and spectral data."
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
            title="3D Molecular Viewer"
            description="Interactive 3D visualization with CPK coloring, rotation controls, and VSEPR geometry."
            icon={<CubeIcon />}
          />
          <ToolCard
            href="/molecule-builder"
            title="Molecule Builder"
            description="Drag-and-drop atoms with real-time stability validation and 3D preview."
            icon={<WrenchIcon />}
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
            description="Generate Lewis dot structures with formal charge analysis and resonance forms."
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

      {/* Why Verified */}
      <section className="border-t border-border bg-calibration-grid">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Why verified?
            </h2>
            <p className="mt-2 text-muted-foreground max-w-xl">
              AI can hallucinate. VerChem signs every answer so you can audit the chain of trust.
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
                <h3 className="font-semibold text-foreground">HMAC signs</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each result is sealed with an HMAC-SHA256 signature bound to the calculation inputs, engine version, and timestamp. Tamper-evident by design.
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
                AI only narrates around the signed numbers — it never generates the result itself. If the explanation drifts, the signature still validates the math.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "118", label: "Elements (NIST)" },
              { value: "24+", label: "Deterministic tools" },
              { value: "50+", label: "Compounds" },
              { value: "0", label: "Hallucinated results" },
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
                Deterministic chemistry workbench. HMAC-signed results, NIST-validated data.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Chemistry</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/periodic-table" className="hover:text-primary-500 transition-colors">Periodic Table</Link></li>
                <li><Link href="/organic" className="hover:text-primary-500 transition-colors">Organic Chemistry</Link></li>
                <li><Link href="/molecule-builder" className="hover:text-primary-500 transition-colors">Molecule Builder</Link></li>
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

function WrenchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
