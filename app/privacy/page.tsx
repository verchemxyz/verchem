import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — VerChem',
  description:
    'How VerChem collects, uses, and protects your information across its chemistry tools, accounts, and AI Verified Answer Cards.',
  alternates: { canonical: 'https://verchem.xyz/privacy' },
}

// TODO(พี่จ๊อบ): confirm the operating legal entity name + governing-law
// jurisdiction (see "Contact" and the Terms). Everything else below describes
// the app's actual data practices verified against the codebase.
const EFFECTIVE_DATE = 'May 27, 2026'
const CONTACT_EMAIL = 'verchem.xyz@gmail.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-secondary-700 dark:text-secondary-300 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="border-b border-header-border bg-header-bg backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              VerChem
            </span>
          </Link>
          <Link
            href="/"
            className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
          >
            ← Back to VerChem
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Effective {EFFECTIVE_DATE}</p>

        <Section title="Overview">
          <p>
            VerChem (“we”, “us”) provides free chemistry education tools — calculators,
            a periodic table, organic and spectroscopy references, a structure editor,
            and AI Verified Answer Cards. This policy explains what information we
            collect, how we use it, and the choices you have. We do not sell your
            personal information.
          </p>
        </Section>

        <Section title="Information we collect">
          <p>
            <strong>Account information.</strong> Sign-in is handled by AIVerID
            (OAuth). When you log in we receive a stable account identifier and your
            email address from AIVerID. We never see or store your password — AIVerID
            manages authentication, and your session is held in a signed (HMAC-SHA256),
            httpOnly cookie.
          </p>
          <p>
            <strong>Content you create.</strong> Items you choose to save — drawn
            molecules, saved calculations, favorites, and preferences — are stored in
            our database (Supabase) and linked to your account identifier.
          </p>
          <p>
            <strong>AI Verified Answer Cards.</strong> When you ask a question, the text
            of your question is sent to our AI provider (Anthropic) to interpret it and
            select a calculation. The numeric results themselves are produced by our own
            deterministic engines on our servers and cryptographically signed. Do not
            include sensitive personal information in question text.
          </p>
          <p>
            <strong>Donations.</strong> Voluntary donations are processed by Stripe
            through hosted payment links. Payment card details are entered on Stripe’s
            systems — we never receive or store your card number.
          </p>
          <p>
            <strong>Technical data.</strong> We use privacy-conscious, aggregate
            analytics (Vercel Analytics and Speed Insights) to understand usage and
            performance. We store your interface preferences and language choice in your
            browser’s local storage.
          </p>
        </Section>

        <Section title="How we use information">
          <ul className="list-disc pl-6 space-y-1">
            <li>To authenticate you and keep you signed in.</li>
            <li>To save and display the content you create (molecules, calculations, preferences).</li>
            <li>To generate AI Verified Answer Cards in response to your questions.</li>
            <li>To process donations you choose to make.</li>
            <li>To operate, secure, and improve the service.</li>
          </ul>
        </Section>

        <Section title="Service providers">
          <p>We share data only with processors that help us run VerChem:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>AIVerID</strong> — authentication / single sign-on.</li>
            <li><strong>Supabase</strong> — database storage for your saved content.</li>
            <li><strong>Anthropic</strong> — interpreting Answer Card questions.</li>
            <li><strong>Stripe</strong> — donation payment processing.</li>
            <li><strong>Vercel</strong> — hosting and aggregate analytics.</li>
          </ul>
          <p>We do not sell personal information or share it for advertising.</p>
        </Section>

        <Section title="Cookies & local storage">
          <p>
            We use a signed session cookie strictly for authentication (it is httpOnly
            and uses SameSite protection). We use your browser’s local storage to
            remember preferences such as theme and language. We do not use advertising
            or cross-site tracking cookies.
          </p>
        </Section>

        <Section title="Data retention & deletion">
          <p>
            Content you create remains until you delete it (for example, removing a
            molecule from your library) or until you ask us to close your account. To
            request deletion of your account data, contact us at the address below.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Sessions are signed with HMAC-SHA256, database access is restricted with
            row-level security and server-side keys, and mutations are protected against
            cross-site request forgery. No system is perfectly secure, but we work to
            protect your information.
          </p>
        </Section>

        <Section title="Children & students">
          <p>
            VerChem is an educational tool intended for students and professionals. If
            you are below the age of consent in your country, please use VerChem with the
            involvement of a parent, guardian, or educator. We do not knowingly collect
            more personal information than is needed to provide the service.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on where you live, you may have the right to access, correct, or
            delete your personal information, or to object to certain processing. Contact
            us to exercise these rights.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes will be
            reflected by updating the effective date above.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about privacy? Email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="text-sm text-muted-foreground border-t border-border pt-6">
          See also our{' '}
          <Link href="/terms" className="text-primary-600 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
