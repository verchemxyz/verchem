# VerChem — Deployment

Production is **https://www.verchem.xyz** (the apex `verchem.xyz` redirects to `www`). It is hosted on Vercel and connected to this GitHub repository. The 2025 generic Vercel guide is kept at [history/DEPLOYMENT_GUIDE_2025-11.md](../history/DEPLOYMENT_GUIDE_2025-11.md).

## How a change reaches production

1. Pull requests and pushes to `main` run **CI** (`.github/workflows/ci.yml`, Node 24.14.1): `npm run lint` → `npm run test:calculations` → `npm test` → `npm run validate` → `npm run build:webpack`.
2. **A push to `main` is a production deploy.** Vercel builds the pushed commit and promotes it to the production domain. There is no separate release step, so merge only what is ready to go live.
3. If a change needs a database change, apply the migration **before** pushing the code (see [supabase/SETUP.md](../../supabase/SETUP.md)).

Rollback: in the Vercel dashboard, promote the previous production deployment (instant), then fix forward with a new commit.

## Build

- Node.js `24.14.1` or newer (`.nvmrc`, `package.json` `engines`). Keep the Vercel project's Node.js setting on the same major version.
- `prebuild` runs `scripts/build-release-manifest.ts`, which hashes the deterministic engine sources (`lib/calculations`, `lib/lab`, `lib/answer-cards/tools`, …) into `lib/answer-cards/release-manifest.generated.json` (gitignored). Signed calculation cards cite that manifest, so a change to an engine file changes the engine release that `/verify` replays against.
- `npm run build` uses Turbopack, the Next.js 16 default. `npm run build:webpack` is the build CI checks. Run both before risky changes to the build configuration.
- Security headers, including the Content-Security-Policy, are set in `next.config.ts` (`headers()`). Pages that load workers or WebAssembly (RDKit, Ketcher) depend on that CSP: test `/draw` after changing it.

## Environment variables (Vercel → Settings → Environment Variables)

Names and placeholders are in `.env.example`. Set them for Production and Preview.

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Account features and VerChem Lab |
| `NEXT_PUBLIC_AIVERID_AUTH_URL`, `NEXT_PUBLIC_AIVERID_TOKEN_URL`, `NEXT_PUBLIC_AIVERID_USERINFO_URL`, `NEXT_PUBLIC_AIVERID_CLIENT_ID`, `AIVERID_CLIENT_SECRET` | Sign-in ([AIVERID_INTEGRATION.md](AIVERID_INTEGRATION.md)) |
| `SESSION_SECRET` | Session cookies. Required in production, where sessions fail closed without it. Changing it signs everyone out |
| `CARD_SIGNING_PRIVATE_KEY` | Ed25519 signing for calculation cards and Lab evidence packs. Required in production, where signing fails closed without it. The public key is published at `/.well-known/verchem-keys.json`. **Replacing this key changes the key id**: keep the old public key verifiable before rotating |
| `ANTHROPIC_API_KEY` | Optional. Only the AI-assisted Answer Card route uses it, and without it that route reports itself unavailable |

Changing a variable takes effect on the next deployment: redeploy after editing.

## After deploying

- `https://www.verchem.xyz/` returns 200 and `https://verchem.xyz/` redirects to it.
- `/.well-known/verchem-keys.json` returns the signing public key.
- Sign in, then open `/lab` and `/account/molecules`.
- On production, never run the Lab integration gates (`npm run gate:lab*`): Lab history is append-only.
