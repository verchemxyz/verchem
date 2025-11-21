# VerCal Integration Guide

**For VerCivil, VerElect, and all future Ver* Calculator products**

This guide explains how to integrate with the VerCal Ecosystem using VerChem as the master template.

---

## 🎯 Overview

**VerCal Ecosystem** = Unified subscription system where:
- User pays **ONCE** (at AIVerID)
- Gets access to **ALL** Ver* calculator products
- Single login, single subscription, multiple products

**Key Principle**: VerChem is the master template. Copy its patterns!

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│      AIVerID (Railway PostgreSQL)           │
│  - Central authentication                   │
│  - Subscription management                  │
│  - Payment processing (Stripe)              │
│  - Issues JWT tokens with subscription      │
└─────────────────────────────────────────────┘
         ↓ OAuth Login + JWT Token
    ┌────┴─────┬──────────┬──────────┐
    ↓          ↓          ↓          ↓
┌─────────┐┌─────────┐┌─────────┐┌─────────┐
│VerChem  ││VerCivil ││VerElect ││Ver[X]   │
│(master) ││(copy)   ││(copy)   ││(future) │
└─────────┘└─────────┘└─────────┘└─────────┘
```

---

## 📁 File Structure

### ✅ **UNIVERSAL Files** (Copy to ALL Ver* products)

These files are identical across all Ver* products. **Copy as-is from VerChem:**

```
/lib/vercal/                    # ✅ Copy entire folder
  ├── types.ts                  # Type definitions
  ├── constants.ts              # Pricing, AIVerID config
  └── subscription.ts           # Subscription logic

/components/vercal/             # ✅ Copy entire folder
  ├── UpgradePrompt.tsx         # Upgrade prompts
  └── SubscriptionBadge.tsx     # Subscription badges

/app/pricing/                   # ✅ Copy pricing page
  └── page.tsx                  # (You'll create this in Step 5)

/middleware.ts                  # ✅ Copy middleware
                                # (Checks subscription on each request)
```

### ⚠️ **APP-SPECIFIC Files** (Customize per Ver* product)

These files differ per product:

```
/lib/config/                    # ⚠️ Customize for your product
  ├── product.ts                # Your product name, domain, colors
  └── calculators.ts            # Your calculators (free vs paid)
```

---

## 🚀 Step-by-Step Integration

### **Step 1: Copy Universal Files**

From VerChem, copy these folders **exactly as-is**:

```bash
# In your new Ver* project (e.g., VerCivil)
cp -r /path/to/verchem/lib/vercal ./lib/
cp -r /path/to/verchem/components/vercal ./components/
```

**No changes needed!** These files work across all Ver* products.

---

### **Step 2: Create Your Product Config**

Create `/lib/config/product.ts`:

```typescript
// Example: VerCivil
import type { ProductConfig } from '@/lib/vercal/types'

export const PRODUCT_CONFIG: ProductConfig = {
  name: 'VerCivil',                       // Your product name
  displayName: 'Civil Engineering',       // Display name
  domain: 'vercivil.com',                 // Your domain
  primaryColor: '#10B981',                // Your brand color (green for VerCivil)
  freeCalculators: [
    'beam-simple',
    'column-basic',
    'load-calculator',
  ],
  paidCalculators: [
    'beam-advanced',
    'column-buckling',
    'retaining-wall',
    'foundation-design',
    // ... all your paid calculators
  ],
}
```

---

### **Step 3: Define Your Calculators**

Create `/lib/config/calculators.ts`:

```typescript
// Example: VerCivil
import type { Calculator } from '@/lib/vercal/types'

export const VERCIVIL_CALCULATORS: Calculator[] = [
  // FREE TIER (3 calculators)
  {
    id: 'beam-simple',
    name: 'Simple Beam Calculator',
    description: 'Calculate reactions and moments for simply supported beams',
    tier: 'free',
    path: '/calculators/beam?mode=simple',
    icon: '🏗️',
  },
  {
    id: 'column-basic',
    name: 'Basic Column Calculator',
    description: 'Check axial compression capacity',
    tier: 'free',
    path: '/calculators/column?mode=basic',
    icon: '🏛️',
  },
  {
    id: 'load-calculator',
    name: 'Load Calculator',
    description: 'Calculate dead and live loads',
    tier: 'free',
    path: '/calculators/loads',
    icon: '⚖️',
  },

  // PAID TIER (Student+)
  {
    id: 'beam-advanced',
    name: 'Advanced Beam Analysis',
    description: 'Continuous beams, moment redistribution, ACI 318 design',
    tier: 'student',
    path: '/calculators/beam?mode=advanced',
    icon: '🏗️',
  },
  // ... more calculators
]

// Helper functions (same as VerChem)
export function getCalculatorsByTier(tier: SubscriptionTier): Calculator[] {
  // ... same logic as VerChem
}

export function getFreeCalculators(): Calculator[] {
  return VERCIVIL_CALCULATORS.filter((calc) => calc.tier === 'free')
}

export function getPaidCalculators(): Calculator[] {
  return VERCIVIL_CALCULATORS.filter((calc) => calc.tier !== 'free')
}
```

---

### **Step 4: Add Feature Gating to Your Pages**

In your calculator pages, check subscription tier:

```typescript
// app/calculators/beam/page.tsx (Example: VerCivil)
import { getServerSession } from 'next-auth' // or your auth method
import { checkFeatureAccess, getEffectiveTier } from '@/lib/vercal/subscription'
import { UpgradePrompt } from '@/components/vercal/UpgradePrompt'
import { getCalculatorById } from '@/lib/config/calculators'

export default async function BeamCalculatorPage({
  searchParams,
}: {
  searchParams: { mode?: string }
}) {
  const session = await getServerSession()
  const subscription = session?.user?.subscription // From JWT token

  const mode = searchParams.mode || 'simple'
  const calculator = getCalculatorById(`beam-${mode}`)

  // Check access
  const access = checkFeatureAccess(subscription, calculator.tier)

  if (!access.hasAccess) {
    return (
      <div>
        <h1>Beam Calculator</h1>
        <UpgradePrompt
          feature={calculator.name}
          requiredTier={calculator.tier}
        />
      </div>
    )
  }

  // User has access! Show calculator
  return (
    <div>
      <h1>Beam Calculator</h1>
      <BeamCalculatorComponent mode={mode} />
    </div>
  )
}
```

---

### **Step 5: Create Pricing Page**

Copy VerChem's pricing page and customize branding:

```typescript
// app/pricing/page.tsx
import { PRICING_TIERS } from '@/lib/vercal/constants'
import { PRODUCT_CONFIG } from '@/lib/config/product'
import { getPaidCalculators, getFreeCalculators } from '@/lib/config/calculators'

export default function PricingPage() {
  const freeCount = getFreeCalculators().length
  const paidCount = getPaidCalculators().length

  return (
    <div>
      <h1>Pricing</h1>
      <p>
        Get access to <strong>ALL {paidCount} {PRODUCT_CONFIG.displayName} calculators</strong>
      </p>
      <p>
        Plus <strong>VerChem, VerElect, and all future VerCal products!</strong>
      </p>

      {/* Render pricing tiers */}
      {PRICING_TIERS.map((tier) => (
        <PricingCard key={tier.id} tier={tier} />
      ))}
    </div>
  )
}
```

---

### **Step 6: Add Subscription Check Middleware**

Create `/middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Get session from cookie/token
  const session = await getSession(request)

  if (!session) {
    // Not logged in - redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Read subscription from JWT token (included by AIVerID)
  const subscription = session.subscription

  // Add to header for easy access in pages
  const response = NextResponse.next()
  response.headers.set('x-subscription-tier', subscription.tier)
  response.headers.set('x-subscription-status', subscription.status)

  return response
}

// Apply to protected routes
export const config = {
  matcher: ['/calculators/:path*', '/account/:path*'],
}
```

---

### **Step 7: Environment Variables**

Add to `.env.local`:

```bash
# AIVerID Configuration
NEXT_PUBLIC_AIVERID_URL=https://aiverid.com
AIVERID_API_URL=https://aiverid.com/api
AIVERID_CLIENT_ID=your_client_id
AIVERID_CLIENT_SECRET=your_client_secret
AIVERID_JWT_PUBLIC_KEY=your_jwt_public_key

# Product Configuration
NEXT_PUBLIC_DOMAIN=vercivil.com

# Stripe (Optional - only if you want product-specific tracking)
# Note: Main Stripe integration is at AIVerID!
```

---

### **Step 8: Test the Flow**

**Test 1: Free User**
```
1. Visit calculator page (e.g., /calculators/beam?mode=advanced)
2. Not logged in → Redirect to login
3. Login via AIVerID
4. Free tier → See UpgradePrompt
5. Click "Upgrade" → Redirect to AIVerID subscribe page
```

**Test 2: Paid User**
```
1. User already paid on VerChem
2. Visit VerCivil.com
3. Login via AIVerID OAuth
4. JWT includes: { subscription: { tier: "student" } }
5. VerCivil reads JWT → Sees "student" tier
6. ✅ Full access to all calculators!
7. Banner: "🎉 Your VerCal subscription unlocks VerCivil!"
```

---

## 🎁 Silent Unlock Magic

The **best part** of VerCal Ecosystem:

```
User pays for VerChem ($49.99)
→ AIVerID sets: subscription_tier = "student"
→ AIVerID sets permissions:
   - verchem_pro = true
   - vercivil_pro = true  ✅ (silent!)
   - verelect_pro = true  ✅ (silent!)

User visits VerCivil.com (curious)
→ Login via AIVerID
→ JWT includes: subscription.tier = "student"
→ VerCivil: "You have access!"
→ User: "OMG! This is amazing!" 😱
→ User shares with friends → Viral!
```

**No extra code needed!** Just check `subscription.tier` in JWT.

---

## 📊 Checklist for New Ver* Product

- [ ] Copy `/lib/vercal/` from VerChem
- [ ] Copy `/components/vercal/` from VerChem
- [ ] Create `/lib/config/product.ts` (customize)
- [ ] Create `/lib/config/calculators.ts` (customize)
- [ ] Add feature gating to calculator pages
- [ ] Create `/app/pricing/page.tsx` (copy from VerChem, customize)
- [ ] Add `/middleware.ts` for subscription check
- [ ] Set environment variables
- [ ] Test: Login → See free calculators
- [ ] Test: Upgrade → Pay at AIVerID → Return → Full access
- [ ] Test: Visit other Ver* product → Automatic access! 🎁
- [ ] Update `VERCAL_PRODUCTS` in `/lib/vercal/constants.ts` (add your product)

---

## 🔐 Security Notes

**JWT Token Verification:**
- In production, verify JWT signature with AIVerID's public key
- Don't trust client-side tokens blindly
- Re-verify on sensitive operations

**Example:**
```typescript
import jwt from 'jsonwebtoken'

const verified = jwt.verify(token, process.env.AIVERID_JWT_PUBLIC_KEY)
const subscription = verified.subscription
```

---

## 🤔 Common Questions

### Q: Do I need my own Stripe account?
**A:** No! All payments go through AIVerID's Stripe account. You just check subscription status from JWT.

### Q: Can I have product-specific pricing?
**A:** No. VerCal pricing is unified ($49.99 Student, $149.99 Pro) across ALL products. This is the ecosystem advantage!

### Q: What if subscription expires?
**A:** JWT token expires every 1 hour. Next refresh, user gets updated subscription status. If expired, `tier` becomes `"free"`.

### Q: How to add a new calculator?
**A:** Just add to your `/lib/config/calculators.ts`. Set `tier: 'free'` or `tier: 'student'`. Feature gating happens automatically!

### Q: Can I customize the upgrade prompt?
**A:** Yes! `<UpgradePrompt>` accepts `message` prop. But keep it consistent with VerChem for brand unity.

---

## 🚀 Launch Checklist

Before launching your Ver* product:

- [ ] Test full flow (free → upgrade → paid → access other Ver*)
- [ ] Add your product to `VERCAL_PRODUCTS` in constants.ts
- [ ] Update marketing materials to mention VerCal bundle
- [ ] Coordinate with AIVerID team for OAuth setup
- [ ] Test JWT token verification in production
- [ ] Monitor subscription checks (add logging)
- [ ] Set up error tracking (Sentry, etc.)

---

## 📞 Support

**Questions?** Ask in:
- VerCal Team Chat
- CLAUDE.md in master project
- Or reference VerChem codebase (master template)

**Remember**: VerChem is the source of truth! When in doubt, copy from VerChem! ✅

---

**Last Updated**: 2025-11-21
**Master Template**: VerChem
**Next to Integrate**: VerCivil, VerElect
