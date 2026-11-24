/**
 * Where the website points visitors to the VerChem app in the stores, and the
 * links it uses. The app is a one-time purchase that works offline on phone
 * and tablet; the website's free tools advertise it, while the Lab product,
 * verification, account and legal pages stay free of it.
 *
 * Every page route must be listed as shown or hidden. A route that is neither
 * renders nothing, and `__tests__/app-promo.test.ts` fails until it is listed,
 * so a new page cannot pick up (or miss) the block by accident.
 */

export const APP_STORE_APP_URL = 'https://apps.apple.com/app/id6759859542'
export const GOOGLE_PLAY_PACKAGE = 'com.aivisibilityrights.verchem'

/** Checked first: these never show the block, even under a shown prefix. */
export const APP_PROMO_HIDDEN_ROUTES = [
  '/',
  '/lab',
  '/account',
  '/verify',
  '/verified',
  '/tools/verified-answer',
  '/tools/verified-calculation',
  '/support',
  '/supporters',
  '/privacy',
  '/terms',
  '/preferences',
  '/search',
  '/tutorials',
  // Legacy URL: next.config.ts redirects it to /draw before the page renders.
  '/molecule-builder',
] as const

export const APP_PROMO_SHOWN_ROUTES = [
  '/3d-viewer',
  '/calculators',
  '/challenge',
  '/compounds',
  '/draw',
  '/electrochemistry',
  '/electron-config',
  '/elements',
  '/equation-balancer',
  '/gas-laws',
  '/kinetics',
  '/lewis',
  '/organic',
  '/periodic-table',
  '/practice',
  '/solutions',
  '/spectroscopy',
  '/stoichiometry',
  '/thermodynamics',
  '/tools',
  '/unit-converter',
  '/virtual-lab',
  '/vsepr',
] as const

export type AppPromoPlacement = 'show' | 'hide' | 'unclassified'

function matchesRoute(pathname: string, route: string): boolean {
  if (route === '/') return pathname === '/'
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function appPromoPlacement(pathname: string | null | undefined): AppPromoPlacement {
  if (!pathname) return 'unclassified'
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (APP_PROMO_HIDDEN_ROUTES.some((route) => matchesRoute(path, route))) return 'hide'
  if (APP_PROMO_SHOWN_ROUTES.some((route) => matchesRoute(path, route))) return 'show'
  return 'unclassified'
}

/** First path segment, used as the campaign label: `/tools/molar-mass` → `tools`. */
export function appPromoCampaign(pathname: string): string {
  const segment = pathname.split('/').find(Boolean) ?? 'home'
  return segment.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30) || 'home'
}

/**
 * App Store link with a campaign tag. App Store Connect only attributes `ct`
 * when a provider token (`pt`) is present; none is set yet, so the tag is kept
 * for when one is added.
 */
export function appStoreHref(campaign: string): string {
  const url = new URL(APP_STORE_APP_URL)
  url.searchParams.set('ct', `web-${campaign}`)
  return url.toString()
}

/** Google Play link; Play Console reports the utm_* values in `referrer`. */
export function googlePlayHref(campaign: string): string {
  const url = new URL('https://play.google.com/store/apps/details')
  url.searchParams.set('id', GOOGLE_PLAY_PACKAGE)
  const referrer = new URLSearchParams({
    utm_source: 'verchem.xyz',
    utm_medium: 'web',
    utm_campaign: 'tools_block',
    utm_content: campaign,
  })
  url.searchParams.set('referrer', referrer.toString())
  return url.toString()
}

export const APP_PROMO_LANGUAGES = ['en', 'th', 'zh', 'es', 'de', 'fr', 'ja'] as const
export type AppPromoLanguage = (typeof APP_PROMO_LANGUAGES)[number]

export function appPromoLanguage(language: string | undefined): AppPromoLanguage {
  const base = (language ?? 'en').split('-')[0].toLowerCase()
  return (APP_PROMO_LANGUAGES as readonly string[]).includes(base) ? (base as AppPromoLanguage) : 'en'
}

type Badge = { src: string; width: number; height: number }

/**
 * Official localized badges, unmodified apart from trimming the transparent
 * margin from the Google Play PNGs so both badges render at the same height.
 * Sizes are the files' own dimensions.
 */
export const APP_STORE_BADGES: Record<AppPromoLanguage, Badge> = {
  en: { src: '/badges/app-store/en.svg', width: 120, height: 40 },
  th: { src: '/badges/app-store/th.svg', width: 120, height: 40 },
  zh: { src: '/badges/app-store/zh.svg', width: 109, height: 40 },
  es: { src: '/badges/app-store/es.svg', width: 120, height: 40 },
  de: { src: '/badges/app-store/de.svg', width: 120, height: 40 },
  fr: { src: '/badges/app-store/fr.svg', width: 127, height: 40 },
  ja: { src: '/badges/app-store/ja.svg', width: 109, height: 40 },
}

export const GOOGLE_PLAY_BADGES: Record<AppPromoLanguage, Badge> = {
  en: { src: '/badges/google-play/en.png', width: 564, height: 168 },
  th: { src: '/badges/google-play/th.png', width: 646, height: 192 },
  zh: { src: '/badges/google-play/zh.png', width: 646, height: 192 },
  es: { src: '/badges/google-play/es.png', width: 646, height: 192 },
  de: { src: '/badges/google-play/de.png', width: 646, height: 192 },
  fr: { src: '/badges/google-play/fr.png', width: 646, height: 192 },
  ja: { src: '/badges/google-play/ja.png', width: 646, height: 192 },
}
