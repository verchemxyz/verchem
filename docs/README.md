# VerChem documentation

The code and its tests are the source of truth. These documents explain design intent and history; where a document and the code disagree, the code wins.

## architecture/ — how the system is built

| Document | Covers |
|---|---|
| [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) | Tables, access model and VerChem Lab integrity rules (summary of `supabase/migrations/`). Setup and production safety: [supabase/SETUP.md](../supabase/SETUP.md) |
| [AIVERID_INTEGRATION.md](architecture/AIVERID_INTEGRATION.md) | Sign-in through AIVerID OAuth, the signed session cookie, and where access is enforced |
| [DEPLOYMENT.md](architecture/DEPLOYMENT.md) | CI, how a push to `main` reaches production, build, environment variables, post-deploy checks |
| [I18N_GUIDE.md](architecture/I18N_GUIDE.md) | Interface translation |
| [ACCESSIBILITY.md](architecture/ACCESSIBILITY.md) | Accessibility features |
| [THEME_SYSTEM.md](architecture/THEME_SYSTEM.md) | Light/dark theme |
| [PREFERENCES_SYSTEM.md](architecture/PREFERENCES_SYSTEM.md) | Locally stored user preferences |

## ecosystem/ — VerChem within the Ver* products

| Document | Covers |
|---|---|
| [VERCAL_ECOSYSTEM.md](ecosystem/VERCAL_ECOSYSTEM.md) | Shared sign-in and shared code across Ver* calculator products |
| [VERCAL_INTEGRATION_GUIDE.md](ecosystem/VERCAL_INTEGRATION_GUIDE.md) | Reusing VerChem's shared modules in another Ver* product |
| [PRICING_MODEL.md](ecosystem/PRICING_MODEL.md) | A pricing model that has not been launched. Every VerChem feature is currently free |

## history/ — implementation notes kept for reference

These were written when each feature was first built or planned. They describe that moment rather than the current code.

- [AIVERID_INTEGRATION_NEXTAUTH_PLAN_2025.md](history/AIVERID_INTEGRATION_NEXTAUTH_PLAN_2025.md): the NextAuth-based sign-in plan, never shipped
- [DATABASE_SCHEMA_PLAN_2025-11.md](history/DATABASE_SCHEMA_PLAN_2025-11.md): the 2025 planned schema with `auth.uid()` policies, never used in production
- [DEPLOYMENT_GUIDE_2025-11.md](history/DEPLOYMENT_GUIDE_2025-11.md): the generic 2025 Vercel guide
- [ADVANCED_FEATURES_IMPLEMENTATION.md](history/ADVANCED_FEATURES_IMPLEMENTATION.md)
- [COMPOUND_DATABASE_EXPANSION.md](history/COMPOUND_DATABASE_EXPANSION.md)
- [INPUT_COLOR_FIXES_SUMMARY.md](history/INPUT_COLOR_FIXES_SUMMARY.md)
- [PREFERENCES_SYSTEM_SUMMARY.md](history/PREFERENCES_SYSTEM_SUMMARY.md)
- [ROADMAP_TO_100.md](history/ROADMAP_TO_100.md)
- [SEARCH_SYSTEM_SUMMARY.md](history/SEARCH_SYSTEM_SUMMARY.md)
