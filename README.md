# VerChem

VerChem is a browser-native chemistry workbench for deterministic calculations, chemical reference data, structure editing/search, and portable signed evidence.

Production: [https://verchem.xyz](https://verchem.xyz)

## What is included

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

The main test command covers calculation engines, units, validation, authentication/session boundaries, public API contracts, structure workflows, offline-cache migration, Answer Card signing/persistence/replay, browser verification, and deterministic artifact issuance.

## Trust-related environment variables

- `CARD_SIGNING_PRIVATE_KEY`: base64-encoded Ed25519 PKCS8 PEM. Required in production; signing fails closed when absent.
- `ANTHROPIC_API_KEY`: optional and used only by the AI-assisted Answer Card route.
- Supabase and AIVerID variables: required only for account-backed save/share workflows.

Development and tests use an ephemeral signing key when `CARD_SIGNING_PRIVATE_KEY` is absent. Never treat artifacts issued with that ephemeral key as durable production evidence.

## Access and payments

All current VerChem features are free. `/support` contains optional fixed-price support links; support does not buy an entitlement or subscription. The legacy subscription checkout endpoint is intentionally disabled until a real paid product, provisioning flow, and entitlement contract exist.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript 5
- Tailwind CSS 4
- Ketcher for structure editing
- RDKit WebAssembly for structure operations
- Supabase for opt-in account storage
- Ed25519 compact JWS and browser Web Crypto verification

## Scientific and privacy boundaries

- Result validity is limited to the signed inputs, units, model scope, and cited conditions.
- Spectroscopy lookup and 3D built-in models must not be interpreted as experimental confirmation.
- A deterministic signed artifact is not automatically proof that a model is appropriate for a real sample.
- Direct signed calculations are not persisted unless the user explicitly saves them.
- AI-assisted questions are sent to the configured model provider; direct deterministic calculations do not use that provider.

Project-specific engineering and verification requirements are documented in [CLAUDE.md](./CLAUDE.md).
