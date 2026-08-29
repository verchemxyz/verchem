import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const identityBadge = readFileSync(
  resolve(process.cwd(), 'components/lab-qc/VerificationLevelBadge.tsx'),
  'utf8'
)

// AIVerID's identity-tier names (Basic/Verified/Approved/Certified) are a
// mandatory, ecosystem-wide standard (~/.ai-memory/AIVERID_IDENTITY_STANDARD.md)
// shared by every Ver* project — VerChem must not invent its own names for
// them. The namespace-separation guarantee this test enforces is narrower:
// the identity badge must stay legible as identity (via its own standard
// vocabulary + an explicit disambiguating note) and must never borrow the
// new scientific-evidence vocabulary (V0–V4, "Validated computation", etc).
assert.match(identityBadge, /'Verified'/)
assert.match(identityBadge, /'Approved'/)
assert.match(identityBadge, /'Certified'/)
assert.match(identityBadge, /not a scientific-validity classification/)
assert.doesNotMatch(identityBadge, /\bV[0-4]\b|Validated computation|Scientific truth/)

console.log('Identity and scientific evidence badge namespaces stay separate')
