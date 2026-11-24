'use client'

import { useId } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/lab/Card'
import {
  APP_STORE_BADGES,
  GOOGLE_PLAY_BADGES,
  appPromoCampaign,
  appPromoLanguage,
  appPromoPlacement,
  appStoreHref,
  googlePlayHref,
} from '@/lib/app-promo'

const BADGE_LINK =
  'inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/**
 * A quiet card at the end of a free tool page that points to the VerChem app
 * in the stores. It states only what the app does today (offline, phone and
 * tablet, one-time purchase): no price, which the stores show, and no tool
 * counts or levels. Where it appears is decided by `lib/app-promo.ts`.
 */
export function AppPromo() {
  const pathname = usePathname()
  const { t, i18n } = useTranslation('common')
  const headingId = useId()

  if (appPromoPlacement(pathname) !== 'show') return null

  const language = appPromoLanguage(i18n.resolvedLanguage ?? i18n.language)
  const campaign = appPromoCampaign(pathname)
  const appStoreBadge = APP_STORE_BADGES[language]
  const googlePlayBadge = GOOGLE_PLAY_BADGES[language]

  return (
    <aside aria-labelledby={headingId} className="pt-4">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {t('appPromo.eyebrow')}
            </p>
            <h2 id={headingId} className="mt-1 text-base font-semibold text-foreground tracking-tight">
              {t('appPromo.title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t('appPromo.body')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a href={appStoreHref(campaign)} className={BADGE_LINK}>
              <Image
                src={appStoreBadge.src}
                alt={t('appPromo.appStoreAlt')}
                width={appStoreBadge.width}
                height={appStoreBadge.height}
                className="h-10 w-auto"
                unoptimized
              />
            </a>
            <a href={googlePlayHref(campaign)} className={BADGE_LINK}>
              <Image
                src={googlePlayBadge.src}
                alt={t('appPromo.googlePlayAlt')}
                width={googlePlayBadge.width}
                height={googlePlayBadge.height}
                className="h-10 w-auto"
                unoptimized
              />
            </a>
          </div>
        </div>
      </Card>
      {/* Trademark credit lines are legal text, not interface copy, so they stay in English. */}
      <p lang="en" className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries and
        regions. App Store is a service mark of Apple Inc. Google Play and the Google Play logo are trademarks of
        Google LLC.
      </p>
    </aside>
  )
}
