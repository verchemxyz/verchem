import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

const home = readSource('app/page.tsx')
const layout = readSource('app/layout.tsx')
const pwaManifest = readSource('app/manifest.ts')
const labHero = readSource('components/home/LabQcSection.tsx')
const i18n = readSource('i18n.ts')
const languageProvider = readSource('components/i18n/LanguageProvider.tsx')
const login = readSource('components/oauth-login-button.tsx')
const navigation = readSource('components/accessibility/enhanced-navigation.tsx')
const themeToggle = readSource('components/theme-toggle.tsx')

assert.equal((home.match(/<h1\b/g) ?? []).length, 0, 'the secondary workbench section must not introduce another h1')
assert.equal((labHero.match(/<h1\b/g) ?? []).length, 1, 'the landing page must expose exactly one primary heading')
assert.match(labHero, /function EvidenceFlowVisual/)
assert.match(labHero, /0\.1000 mol\/L/)
assert.match(labHero, /0\.1002 mol\/L/)
assert.ok(Math.abs(((0.1002 - 0.1000) / 0.1000) * 100 - 0.2) < 1e-12)

assert.match(themeToggle, /const activeTheme = theme === 'system' \? resolvedTheme : theme/)
assert.match(themeToggle, /setTheme\(activeTheme === 'dark' \? 'light' : 'dark'\)/)
assert.doesNotMatch(themeToggle, /const themes: Array<'light' \| 'dark' \| 'system'>/)
assert.match(i18n, /lng: 'en'/)
assert.doesNotMatch(i18n, /LanguageDetector/)
assert.match(languageProvider, /useState\('en'\)/)
assert.match(languageProvider, /localStorage\.getItem\('verchem-language'\)/)

const compactReturn = login.indexOf('if (compact) return button')
const accountTagline = login.indexOf('One account for all Ver* apps')
assert.ok(compactReturn >= 0 && accountTagline > compactReturn, 'compact navbar login must omit the modal tagline')
assert.match(navigation, /<AuthButton \/>/)
assert.match(navigation, /<AccessibilityMenu compact \/>/)
assert.match(navigation, /className="xl:hidden/)
assert.doesNotMatch(layout, /href="\/manifest\.json"/)
assert.match(layout, /href="\/apple-touch-icon\.png"/)
assert.doesNotMatch(layout, /href="\/icons\/icon-192x192\.png"/)
assert.match(layout, /process\.env\.VERCEL === '1'/)
assert.match(pwaManifest, /src: '\/icon-192\.png'/)
assert.match(pwaManifest, /src: '\/icon-512\.png'/)

console.log('Landing shell contract: responsive auth, binary theme, and evidence hero verified')
