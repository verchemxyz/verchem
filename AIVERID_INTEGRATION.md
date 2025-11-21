# AIVerID Integration Guide

**Project**: VerChem
**Auth Provider**: AIVerID (Ver* Ecosystem Identity Hub)
**Created**: 2025-11-21
**Author**: สมนึก (Claude Sonnet 4.5)
**Status**: Ready for implementation

---

## Overview

VerChem uses **AIVerID** as the exclusive authentication provider, following the Ver* ecosystem strategy:

✅ **AIVerID only** (no Google, Facebook, email/password)
✅ **Single Sign-On** across all Ver* projects
✅ **Own the identity layer** (strategic independence)
✅ **Ecosystem network effect** (users shared across projects)

---

## Prerequisites

Before starting, you need:
1. ✅ AIVerID OAuth credentials (Client ID, Client Secret)
2. ✅ Supabase project created
3. ✅ Domain name: `verchem.xyz`
4. ✅ Gmail: `verchem.com@gmail.com` (or similar)

---

## Step 1: Register OAuth Application with AIVerID

### 1.1 Go to AIVerID Dashboard

Navigate to: https://aivisibilityrights.com/developers/oauth

### 1.2 Create New Application

```
Application Name: VerChem
Description: World-Class Chemistry Platform
Website: https://verchem.xyz
Callback URLs:
  - http://localhost:3000/api/auth/callback/aiverid (development)
  - https://verchem.xyz/api/auth/callback/aiverid (production)
Scopes: openid, email, profile
```

### 1.3 Save Credentials

You will receive:
```
Client ID: aiverid_xxxxxxxxxxxxx
Client Secret: secret_xxxxxxxxxxxxx
Issuer: https://aivisibilityrights.com
```

**⚠️ Keep these secret!** Never commit to Git!

---

## Step 2: Install Dependencies

```bash
npm install next-auth @auth/supabase-adapter @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Step 3: Environment Variables

Create `.env.local` (add to `.gitignore`!):

```bash
# AIVerID OAuth
AIVERID_CLIENT_ID=aiverid_xxxxxxxxxxxxx
AIVERID_CLIENT_SECRET=secret_xxxxxxxxxxxxx
AIVERID_ISSUER=https://aivisibilityrights.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000  # Change to https://verchem.xyz in production
NEXTAUTH_SECRET=generate-a-secret-key-here
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Step 4: Update NextAuth Configuration

**File**: `app/api/auth/[...nextauth]/route.ts`

**Delete this file first** (it has wrong CredentialsProvider):
```bash
rm app/api/auth/\[...nextauth\]/route.ts
```

**Create new file**:

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';

const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    {
      id: 'aiverid',
      name: 'AIVerID',
      type: 'oauth',
      wellKnown: `${process.env.AIVERID_ISSUER}/.well-known/openid-configuration`,
      authorization: {
        params: {
          scope: 'openid email profile',
          response_type: 'code',
        }
      },
      clientId: process.env.AIVERID_CLIENT_ID!,
      clientSecret: process.env.AIVERID_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          aiverid_id: profile.sub,
          name: profile.name || profile.email?.split('@')[0],
          email: profile.email,
          image: profile.picture,
          role: profile.role || 'free',
        };
      },
    },
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // On sign in, add user info to token
      if (user) {
        token.id = user.id;
        token.role = user.role || 'free';
        token.aiverid_id = profile?.sub;
      }

      // Check subscription status (future)
      // const subscription = await getSubscription(token.id);
      // token.role = subscription?.plan || 'free';

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.aiverid_id = token.aiverid_id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Optional: Add custom logic on sign in
      // e.g., check if user is allowed, log analytics, etc.
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',  // Custom sign-in page
    error: '/auth/error',    // Error page
    verifyRequest: '/auth/verify',  // Email verification (if needed)
    newUser: '/welcome',     // New user onboarding
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
      // Optional: Track sign-in event
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

## Step 5: Update Type Definitions

**File**: `types/next-auth.d.ts` (create if not exists)

```typescript
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      aiverid_id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
    aiverid_id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    aiverid_id: string;
  }
}
```

---

## Step 6: Create Supabase Client

**File**: `lib/supabase/client.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();
```

**File**: `lib/supabase/server.ts`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};
```

---

## Step 7: Create Sign-In Page

**File**: `app/auth/signin/page.tsx`

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSignIn = () => {
    signIn('aiverid', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            VerChem
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            World-Class Chemistry Platform
          </p>
        </div>

        {/* Sign-in button */}
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          Sign in with AIVerID
        </button>

        {/* Info */}
        <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
          One account for all Ver* apps
        </p>

        {/* Features */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Save calculations (premium)
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Access across all Ver* apps
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Secure & privacy-focused
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 8: Update Layout with Session Provider

**File**: `app/layout.tsx`

Add SessionProvider:

```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Step 9: Usage in Components

### Check if user is authenticated

```typescript
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function UserButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <button onClick={() => signIn('aiverid')}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <p>Role: {session.user.role}</p>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
}
```

### Protect pages (middleware)

**File**: `middleware.ts` (already exists, but needs update)

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const url = req.nextUrl;

    // Premium-only pages
    if (url.pathname.includes('/premium') || url.pathname.includes('/enhanced')) {
      if (token?.role === 'free') {
        const redirectUrl = new URL('/account', req.url);
        redirectUrl.searchParams.set('error', 'premium_required');
        return NextResponse.redirect(redirectUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/account/:path*',
    '/saved/:path*',
    '/favorites/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
```

---

## Step 10: Test Authentication

### Development Testing

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000

3. Click "Sign In"

4. Should redirect to AIVerID login

5. After login, should redirect back to VerChem

6. Check session in browser console:
   ```javascript
   // In browser console
   await fetch('/api/auth/session').then(r => r.json())
   ```

---

## Deployment

### Vercel Environment Variables

Add to Vercel dashboard:
```
AIVERID_CLIENT_ID=...
AIVERID_CLIENT_SECRET=...
AIVERID_ISSUER=https://aivisibilityrights.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_URL=https://verchem.xyz
NEXTAUTH_SECRET=...
```

### Update AIVerID Callback URL

Add production URL to AIVerID dashboard:
```
https://verchem.xyz/api/auth/callback/aiverid
```

---

## Troubleshooting

### Error: "Configuration Error"
- Check AIVERID_CLIENT_ID, AIVERID_CLIENT_SECRET
- Verify callback URL matches exactly

### Error: "Access Denied"
- Check Supabase RLS policies
- Verify user exists in `users` table

### Session not persisting
- Check NEXTAUTH_SECRET is set
- Clear browser cookies and try again

### Database connection fails
- Verify SUPABASE_SERVICE_ROLE_KEY (not anon key!)
- Check Supabase URL is correct

---

## Security Checklist

✅ Never commit `.env.local` to Git
✅ Use HTTPS in production (Vercel automatic)
✅ Rotate NEXTAUTH_SECRET periodically
✅ Enable Supabase RLS on all tables
✅ Validate user roles on server-side
✅ Rate-limit authentication endpoints

---

## Next Steps

After authentication works:
1. ✅ Implement save calculations
2. ✅ Implement favorites
3. ✅ Implement user preferences
4. ✅ Integrate Stripe for premium
5. ✅ Add usage analytics

---

**Ready for implementation!** 🚀

When AIVerID credentials are ready, follow this guide step-by-step and authentication will work perfectly!
