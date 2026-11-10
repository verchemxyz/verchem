# VerChem — Sign-in with AIVerID

VerChem has no passwords and does not use Supabase Auth or NextAuth. Members sign in through AIVerID, the shared identity provider for the Ver* platforms, using the OAuth 2.0 authorization-code flow. VerChem then keeps its own signed session cookie.

The earlier NextAuth-based plan (2025) was never shipped. It is kept at [history/AIVERID_INTEGRATION_NEXTAUTH_PLAN_2025.md](../history/AIVERID_INTEGRATION_NEXTAUTH_PLAN_2025.md).

## Flow

1. **`/oauth/start`** (`app/oauth/start/route.ts`) creates a random `state`, stores it in an `oauth_state` cookie together with the post-login path (`oauth_redirect`), and redirects to `NEXT_PUBLIC_AIVERID_AUTH_URL` with `scope=profile email` and `redirect_uri = <origin>/oauth/callback`.
2. **`/oauth/callback`** (`app/oauth/callback/route.ts`):
   - rejects a missing or mismatched `state` (CSRF);
   - exchanges the code at `NEXT_PUBLIC_AIVERID_TOKEN_URL` using `AIVERID_CLIENT_SECRET`;
   - reads the profile from `NEXT_PUBLIC_AIVERID_USERINFO_URL`;
   - resolves the member identifier in Identity Standard order (`aiverid`, then `sub`; the hub's `id` is accepted only as a legacy alias) and keeps it **opaque**;
   - creates the `users` row on first sign-in (Supabase, service role);
   - sets the session cookies and redirects to the stored path.
3. **`/api/auth/session`** returns the current session for the UI.
4. **`/api/auth/logout`** revokes the AIVerID access and refresh tokens (best effort, 3 s timeout) and always clears the cookies.

## Session cookies

Defined in `lib/auth/cookie-config.ts`. Set and clear go through the same helpers, so domain, path and flags always match.

| Cookie | Content |
|---|---|
| `verchem-session` | Session JSON: member id, name, email, AIVerID `verification_level` (1–4), expiry |
| `verchem-session-sig` | HMAC-SHA256 of the session value, keyed with `SESSION_SECRET` |

- Lifetime: 7 days (`SESSION_TTL_SECONDS`). `httpOnly`, `sameSite=lax`, `secure` in production. In production the domain is `.verchem.xyz`, so `www` and the apex share the session.
- The OAuth tokens needed for logout revocation are sealed inside the session with AES-256-GCM (`lib/auth/oauth-token-seal.ts`). The key is derived from `SESSION_SECRET` with HKDF. Rotating `SESSION_SECRET` signs everyone out, and those old tokens can no longer be revoked.
- `SESSION_SECRET` is required in production. Without it, sessions fail closed.

## Where access is enforced

- `proxy.ts` (Next.js 16 proxy) redirects signed-out visitors away from `/account`, `/preferences`, `/lab` and `/api/lab`. That is a UX gate only.
- **The security boundary is the API layer.** Every route that reads or writes member data re-verifies the signed session (`lib/auth/session.ts`), and mutating routes also run the same-origin check (`lib/auth/origin-check.ts`).
- VerChem Lab adds organization membership and roles (`owner`, `reviewer`, `analyst`, `viewer`). Releasing a record requires AIVerID verification level 1 or higher (`RELEASE_MIN_VERIFICATION_LEVEL` in `lib/lab/prep-record.ts`), and the reviewer must be a different person from the preparer.
- Local calculators, reference pages and `/verify` need no account.

## Environment variables

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_AIVERID_AUTH_URL` | Authorize endpoint |
| `NEXT_PUBLIC_AIVERID_TOKEN_URL` | Token endpoint (the code falls back to the production hub) |
| `NEXT_PUBLIC_AIVERID_USERINFO_URL` | Userinfo endpoint (the code falls back to the production hub) |
| `NEXT_PUBLIC_AIVERID_CLIENT_ID` | OAuth client id |
| `AIVERID_CLIENT_SECRET` | Server only |
| `SESSION_SECRET` | Server only. Signs session cookies and derives the token-seal key |

The redirect URI is derived from the request origin, so each deployment origin (production domain, `localhost:3000`) must be registered as an allowed redirect on the AIVerID client. See `.env.example`.
