/**
 * The store-app card: which pages show it, what the links carry, and that
 * every language has its text and badges.
 */
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import {
  APP_PROMO_LANGUAGES,
  APP_STORE_BADGES,
  GOOGLE_PLAY_BADGES,
  appPromoCampaign,
  appPromoLanguage,
  appPromoPlacement,
  appStoreHref,
  googlePlayHref,
} from '../lib/app-promo'

const root = resolve(process.cwd())
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

// --- Every page route is classified --------------------------------------

function pageFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return pageFiles(path)
    return entry === 'page.tsx' ? [path] : []
  })
}

const pages = pageFiles(resolve(root, 'app')).map((file) => {
  const dir = relative(resolve(root, 'app'), file).replace(/\/?page\.tsx$/, '')
  const route = `/${dir}`.replace(/\[[^\]]+\]/g, 'sample')
  return { file, route: route === '/' ? '/' : route.replace(/\/$/, '') }
})

assert.ok(pages.length > 50, `expected the full route tree, found ${pages.length} pages`)

const unclassified = pages.filter(({ route }) => appPromoPlacement(route) === 'unclassified')
assert.deepEqual(
  unclassified.map(({ route }) => route),
  [],
  'every page must be listed as shown or hidden in lib/app-promo.ts',
)

// --- Never on the Lab, verification, account or legal pages --------------

for (const route of [
  '/',
  '/lab',
  '/lab/sample/records/sample',
  '/account',
  '/account/cards/sample',
  '/verify',
  '/verified/sample',
  '/tools/verified-answer',
  '/tools/verified-calculation',
  '/support',
  '/supporters',
  '/privacy',
  '/terms',
  '/preferences',
]) {
  assert.equal(appPromoPlacement(route), 'hide', `${route} must not show the app card`)
}

for (const route of [
  '/tools',
  '/tools/molar-mass',
  '/tools/ph-calculator',
  '/calculators',
  '/periodic-table',
  '/compounds',
  '/compounds/water',
  '/elements/Fe',
  '/draw',
  '/organic/reactions/sample',
]) {
  assert.equal(appPromoPlacement(route), 'show', `${route} should show the app card`)
}

// Prefixes match whole segments only; unknown paths (including 404s) render nothing.
assert.equal(appPromoPlacement('/labs'), 'unclassified')
assert.equal(appPromoPlacement('/toolshed'), 'unclassified')
assert.equal(appPromoPlacement('/tools/'), 'show')
assert.equal(appPromoPlacement(null), 'unclassified')

// --- Shown pages actually render the card ---------------------------------

const calcShell = read('components/lab/CalcShell.tsx')
assert.match(calcShell, /<AppPromo \/>/, 'CalcShell must end its column with the app card')
assert.doesNotMatch(calcShell, /<main\b/, 'the root layout owns the only <main> landmark')

function rendersCard(file: string, seen = new Set<string>()): boolean {
  if (seen.has(file)) return false
  seen.add(file)
  const source = readFileSync(file, 'utf8')
  if (/\bCalcShell\b|<AppPromo \/>/.test(source)) return true
  const reexport = source.match(/export \{ default \} from '@\/app\/(.+)\/page'/)
  return reexport ? rendersCard(resolve(root, 'app', reexport[1], 'page.tsx'), seen) : false
}

const shownWithoutCard = pages
  .filter(({ route }) => appPromoPlacement(route) === 'show')
  .filter(({ file }) => !rendersCard(file))
  .map(({ route }) => route)
assert.deepEqual(shownWithoutCard, [], 'shown routes must render the card through CalcShell or <AppPromo />')

// No page may nest a second <main> inside the layout's.
const nestedMain = pageFiles(resolve(root, 'app'))
  .filter((file) => /<main\b/.test(readFileSync(file, 'utf8')))
  .map((file) => relative(root, file))
assert.deepEqual(nestedMain, [], 'pages render inside the root layout <main>')

// --- Links -----------------------------------------------------------------

assert.equal(appPromoCampaign('/tools/molar-mass'), 'tools')
assert.equal(appPromoCampaign('/periodic-table'), 'periodic-table')
assert.equal(appPromoCampaign('/'), 'home')

assert.equal(appStoreHref('tools'), 'https://apps.apple.com/app/id6759859542?ct=web-tools')

const play = new URL(googlePlayHref('periodic-table'))
assert.equal(play.origin + play.pathname, 'https://play.google.com/store/apps/details')
assert.equal(play.searchParams.get('id'), 'com.aivisibilityrights.verchem')
const referrer = new URLSearchParams(play.searchParams.get('referrer') ?? '')
assert.equal(referrer.get('utm_source'), 'verchem.xyz')
assert.equal(referrer.get('utm_medium'), 'web')
assert.equal(referrer.get('utm_campaign'), 'tools_block')
assert.equal(referrer.get('utm_content'), 'periodic-table')

// --- Text and badges in every language -------------------------------------

assert.equal(appPromoLanguage('th-TH'), 'th')
assert.equal(appPromoLanguage('pt'), 'en')
assert.equal(appPromoLanguage(undefined), 'en')

const i18nSource = read('i18n.ts')
const KEYS = ['eyebrow', 'title', 'body', 'appStoreAlt', 'googlePlayAlt']
for (const language of APP_PROMO_LANGUAGES) {
  assert.match(i18nSource, new RegExp(`public/locales/${language}/common\\.json`), `${language} is a site language`)

  const common = JSON.parse(read(`public/locales/${language}/common.json`)) as {
    appPromo?: Record<string, string>
  }
  const copy = common.appPromo
  assert.ok(copy, `${language}: appPromo strings missing`)
  for (const key of KEYS) {
    assert.ok(typeof copy[key] === 'string' && copy[key].trim().length > 0, `${language}: appPromo.${key} missing`)
  }
  // Prices change in the stores and the web's paid plans are a separate product.
  const text = Object.values(copy).join(' ')
  assert.doesNotMatch(text, /[$€£¥฿]|\d+[.,]\d{2}/, `${language}: the card must not print a price`)
  assert.doesNotMatch(text, /subscri|abonn|suscrip|サブスク|订阅|สมัครสมาชิก/i, `${language}: no subscription wording`)
  // Tool counts and levels change with the merged app release.
  assert.doesNotMatch(text, /\d/, `${language}: no counts in the card text`)

  for (const badge of [APP_STORE_BADGES[language], GOOGLE_PLAY_BADGES[language]]) {
    assert.ok(existsSync(resolve(root, 'public', `.${badge.src}`)), `${language}: missing ${badge.src}`)
  }
}

console.log(`App promo: ${pages.length} routes classified, links and ${APP_PROMO_LANGUAGES.length} languages verified`)
