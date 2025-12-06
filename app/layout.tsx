import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import { AccessibilityProvider } from "@/lib/accessibility/context";
import { SkipLinks } from "@/components/accessibility/skip-links";
import { EnhancedNavigation } from "@/components/accessibility/enhanced-navigation";
import { KeyboardShortcutsDialog } from "@/components/accessibility/keyboard-shortcuts-dialog";
import { TutorialProvider } from "@/lib/tutorials/context";
import { TutorialOverlay } from "@/components/tutorials/tutorial-overlay";
import { HelpButton } from "@/components/tutorials/help-button";
import { HelpSidebar } from "@/components/tutorials/help-sidebar";
import { Providers } from "./providers";
import { AiTutorProvider, AiTutorButton, AiTutorChat } from "@/components/ai-tutor";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import "./globals.css";
import "./accessibility.css";
import "./tutorials.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://verchem.xyz'),
  title: {
    default: "VerChem - World-Class Chemistry Platform",
    template: "%s | VerChem"
  },
  description: "Professional chemistry calculators and interactive tools. Equation balancer, stoichiometry, pH calculator, gas laws, periodic table, 3D molecular viewer, and more. Free and accessible.",
  keywords: [
    "chemistry calculator",
    "equation balancer",
    "stoichiometry calculator",
    "pH calculator",
    "gas laws calculator",
    "periodic table",
    "molecular mass calculator",
    "molarity calculator",
    "chemistry tools",
    "chemistry education",
    "3D molecule viewer",
    "Lewis structures",
    "VSEPR geometry",
    "accessible chemistry",
    "WCAG compliant"
  ],
  authors: [{ name: "VerChem Team" }],
  creator: "VerChem",
  publisher: "VerChem",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://verchem.xyz',
    siteName: 'VerChem',
    title: 'VerChem - World-Class Chemistry Platform',
    description: 'Professional chemistry calculators and interactive tools. Free, accessible, and production-grade.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Chemistry Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VerChem - Chemistry Platform',
    description: 'Professional chemistry calculators and interactive tools. Free and accessible.',
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#1f2937" }
    ]
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Accessibility meta tags */}
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="verchem-theme"
          enableSystem={true}
        >
          <AccessibilityProvider>
            <TutorialProvider>
              <Providers>
                <AiTutorProvider>
                {/* Skip links for keyboard navigation */}
                <SkipLinks />
                
                {/* Main navigation with accessibility features */}
                <EnhancedNavigation />
                
                {/* Tutorial system components */}
                <TutorialOverlay />
                <HelpButton />
                <HelpSidebar />
                
                {/* Main content area with skip link target */}
                <main 
                  id="main-content"
                  className="min-h-screen bg-gray-50 dark:bg-gray-900"
                  role="main"
                  aria-label="Main content"
                  tabIndex={-1}
                >
                  {children}
                </main>
                
                {/* Footer with skip link target */}
                <footer 
                  id="footer"
                  className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                  role="contentinfo"
                  aria-label="Footer"
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-600 dark:text-gray-400">
                      <p className="mb-2">
                        VerChem - World-class chemistry calculators and interactive tools
                      </p>
                      <p className="text-sm">
                        Built with accessibility in mind. Press <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+/</kbd> to view keyboard shortcuts.
                      </p>
                      <p className="text-sm mt-1">
                        Need help? Click the <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">?</kbd> button for tutorials and assistance.
                      </p>
                    </div>
                  </div>
                </footer>
                
                {/* Global keyboard shortcuts dialog */}
                <KeyboardShortcutsDialog />

                {/* AI Chemistry Tutor */}
                <AiTutorButton />
                <AiTutorChat />

                {/* Login Required Modal - Shows when accessing protected routes */}
                <LoginRequiredModal />
                </AiTutorProvider>
              </Providers>
            </TutorialProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
