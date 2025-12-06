import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chemistry Challenge - Test Your Chemistry Knowledge | VerChem',
  description: 'Challenge yourself with chemistry problems! Solve equations, calculate molar mass, and test your chemistry knowledge. Daily challenges with leaderboards.',
  keywords: [
    'chemistry challenge',
    'chemistry quiz',
    'chemistry test',
    'chemistry problems',
    'chemistry practice',
    'chemistry game',
    'balance equation challenge',
    'chemistry competition',
    'chemistry daily challenge',
    'chemistry trivia',
  ],
  openGraph: {
    title: 'Chemistry Challenge - Test Your Chemistry Knowledge',
    description: 'Daily chemistry challenges. Compete with others and climb the leaderboard!',
    type: 'website',
    url: 'https://verchem.xyz/challenge',
    images: [
      {
        url: '/og-challenge.png',
        width: 1200,
        height: 630,
        alt: 'VerChem Chemistry Challenge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chemistry Challenge - Test Your Chemistry Knowledge',
    description: 'Daily chemistry challenges. How high can you score?',
  },
  alternates: {
    canonical: 'https://verchem.xyz/challenge',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
