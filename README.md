# VerChem

VerChem has two parts:

- **VerChem Lab**: controlled standard-preparation records for testing laboratories, covering preparation, independent review, release, and a signed evidence pack.
- **The chemistry workbench**: free, browser-native tools for deterministic calculations, chemical reference data, structure editing and search, and portable signed evidence.

Production: [https://www.verchem.xyz](https://www.verchem.xyz)

## VerChem Lab

`/lab` (sign-in required) organizes work by laboratory organization, with `owner`, `reviewer`, `analyst` and `viewer` roles.

1. **Templates.** A preparation template is versioned. Once approved by someone other than its author, it cannot be changed.
2. **Preparation.** The preparer records the actual measurements against an approved template version and submits the record for review. Until a reviewer acts, the preparer can withdraw it to edit.
3. **Review and release.** A different member, who must hold AIVerID verification level 1 or higher, releases or rejects the record. The server checks the measurements against the template's acceptance limits, and releasing outside them requires a recorded deviation reason. A released record can later be voided with a reason, or superseded by a new record.
4. **Evidence.** Release produces an Ed25519-signed evidence pack (compact JWS, with JSON and PDF downloads). A one-time share link lets someone outside the organization check a released record at `/verify`.

Every action is appended to a hash-chained event log that the database refuses to edit or delete. No AI is involved anywhere in the controlled-record path. VerChem Lab records a preparation and its release approval. It is not an ELN, LIMS or inventory system, and it does not certify or accredit a laboratory.

## Chemistry workbench

- Eight calculator families: equation balancing, stoichiometry, solutions and pH, gas laws, thermodynamics, kinetics, electrochemistry, and electron configuration
- **Solutions & pH** - 11 modes with explicit temperature and activity-model boundaries
- Records for all 118 elements and 1,311 compound pages generated from the canonical dataset
- A browser structure editor with SMILES, MOL, InChI, PNG, and SVG export
- Substructure and similarity search across the verified structure corpus
- Organic chemistry, spectroscopy reference tools, lab safety, solution preparation, nuclear chemistry, and quantum chemistry
- A configurable acid/strong-base titration simulation with explicit model scope
- PWA/offline support for the local workbench

Reference data is cited rather than described as certified. Standard atomic weights are based on the IUPAC 2021 table; fundamental physical constants use the project's declared CODATA 2018 edition where applicable.

## Verifiable chemistry workflow

`/tools/verified-calculation` runs one of the registered deterministic engines without AI or sign-in and creates an Ed25519 compact JWS. New artifacts include:

- exact engine input and output;
- semantic engine release;
- citation and reference editions;
- assumptions and applicability declarations;
- a SHA-256 provenance hash over the deterministic tool calls.

`/verify` performs independent browser-side checks against `/.well-known/verchem-keys.json`:

1. Ed25519 signature authenticity and RFC 7638 key identity
2. provenance-hash integrity
3. replay against the current deterministic engine release
4. presence of applicability declarations

These are separate claims. An authentic historical artifact is not presented as currently verified when the current engine differs or cannot replay it.

AI-assisted Answer Cards are optional. AI writes narrative around deterministic results; it is not the authority for numeric engine fields.

## Local development

Requirements: Node.js 24.14.1 or newer (see `.nvmrc`) and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development script uses polling so the large generated compound/element route tree does not exhaust native file watchers.

## Verification commands

```bash
npm run lint
npm test
npm run build
npm run build:webpack
npm run validate
npm run test:calculations
```

`npm test` runs every `__tests__/*.test.ts` file in its own process (`scripts/run-tests.ts`); `npm test -- lab` runs only files whose name contains `lab`. It covers VerChem Lab record rules and API contracts, calculation engines, units, validation, authentication/session boundaries, public API contracts, structure workflows, offline-cache migration, Answer Card signing/persistence/replay, browser verification, and deterministic artifact issuance.

## Trust-related environment variables

- `CARD_SIGNING_PRIVATE_KEY`: base64-encoded Ed25519 PKCS8 PEM. Required in production; signing fails closed when absent.
- `ANTHROPIC_API_KEY`: optional and used only by the AI-assisted Answer Card route.
- Supabase, AIVerID and `SESSION_SECRET`: required for sign-in, saved items and VerChem Lab. `.env.example` lists every variable; [docs/architecture/DEPLOYMENT.md](docs/architecture/DEPLOYMENT.md) explains each one.

Development and tests use an ephemeral signing key when `CARD_SIGNING_PRIVATE_KEY` is absent. Never treat artifacts issued with that ephemeral key as durable production evidence.

## Access and payments

All current VerChem features are free. `/support` contains optional fixed-price support links; support does not buy an entitlement or subscription. The legacy subscription checkout endpoint is intentionally disabled until a real paid product, provisioning flow, and entitlement contract exist.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript 5
- Tailwind CSS 4
- Ketcher for structure editing
- RDKit WebAssembly for structure operations
- Supabase Postgres, reached only from the server, for accounts and VerChem Lab records ([schema](docs/architecture/DATABASE_SCHEMA.md))
- AIVerID OAuth sign-in with a signed session cookie ([details](docs/architecture/AIVERID_INTEGRATION.md))
- Ed25519 compact JWS and browser Web Crypto verification

## Scientific and privacy boundaries

- Result validity is limited to the signed inputs, units, model scope, and cited conditions.
- Spectroscopy lookup and 3D built-in models must not be interpreted as experimental confirmation.
- A deterministic signed artifact is not automatically proof that a model is appropriate for a real sample.
- Direct signed calculations are not persisted unless the user explicitly saves them.
- AI-assisted questions are sent to the configured model provider; direct deterministic calculations do not use that provider.

## Repository layout

| Path | Contents |
|---|---|
| `app/` | Next.js App Router pages and API routes |
| `components/` | React components |
| `lib/` | Calculation engines, chemical data, signing/verification, Lab records, auth, Supabase access |
| `__tests__/`, `scripts/` | Test suites, validation, release-manifest generation, integration gates |
| `supabase/` | Database migrations and setup runbook ([SETUP.md](supabase/SETUP.md)) |
| `public/` | Static assets, locales, PWA files |
| `docs/` | Design and integration documents — see [docs/README.md](docs/README.md) |
| `capacitor.config.ts` | Mobile shell configuration (the generated `ios/` and `android/` projects are not committed) |
