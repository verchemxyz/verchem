# PRICING_MODEL.md - VerCal Pricing & Monetization Strategy

## 💰 Overview

**VerCal Unified Pricing**: Single subscription, access to ALL Ver Calculator products

**Created**: November 21, 2025
**Last Updated**: November 21, 2025

---

## 🎯 Pricing Tiers

### **Tier 1: FREE** 🆓

**Price**: $0

**Features**:
- ✅ Complete reference data (Periodic Table, formulas, standards)
- ✅ **3 basic calculators** per product (most commonly used)
- ✅ Save up to 5 calculations (localStorage)
- ✅ Basic text export
- ❌ No advanced calculators
- ❌ No step-by-step solutions
- ❌ No PDF export
- ❌ No API access

**Per-Product Features**:

**VerChem**:
1. Molecular Mass Calculator
2. Basic Equation Balancer (simple reactions, max 4 compounds)
3. Ideal Gas Law (PV=nRT only)

**VerCivil**:
1. Beam Calculator (simple supported beam, point loads only)
2. Column Calculator (basic compression, no buckling)
3. Load Calculator (dead load + live load only)

**VerElect**:
1. Ohm's Law Calculator (V=IR)
2. Power Calculator (P=VI)
3. Series/Parallel Resistance (max 5 resistors)

**Purpose**:
- Viral growth (students share with friends)
- SEO traffic (rank for calculator keywords)
- Lead generation (upgrade to paid)

---

### **Tier 2: STUDENT** 🎓

**Price**: **$49.99/year** ($4.17/month)

**Billing Options**:
- Annual: $49.99/year (best value!)
- Monthly: $4.99/month ($59.88/year)

**Features**:
- ✅ **ALL calculators** in **ALL VerCal products**
- ✅ **Complete data**: 1,000+ compounds, all formulas, all standards
- ✅ **Unlimited saves** (cloud-synced across devices)
- ✅ **Step-by-step solutions** (show work, not just answers)
- ✅ **Export to PDF** (professional formatting)
- ✅ **Calculation history** (synced, searchable)
- ✅ **Favorites** (quick access to frequently used)
- ✅ **Priority support** (email, 24-hour response)
- ✅ **Ad-free** (clean interface)
- ✅ **Offline mode** (PWA, works without internet)
- ✅ **Dark mode**
- ✅ **Lifetime student price** (keep $49.99 even after graduation!)

**Silent Unlock**:
- Pay for VerChem → VerCivil works!
- Pay for VerCivil → VerElect works!
- Pay for ANY Ver* → ALL VerCal products work! 🎁

**Verification**: **Soft (Honor-Based)**
- User selects: "I am a student"
- Optional: Enter university name (no verification!)
- Trust-based system
- **No ID check required!**

**Why Soft Verification?**
- Lower barrier = Faster growth
- $49.99 is reasonable (not worth lying)
- Most students honest
- Acceptable fraud rate (< 10%)
- Focus on growth NOW, tighten later

**Future Verification** (When ARR > $100K):
- .edu email verification
- Student ID upload (AI OCR)
- SheerID integration ($0.50/verify)
- Grandfather existing users (no re-verify)

---

### **Tier 3: PROFESSIONAL** 💼

**Price**: **$149.99/year** ($12.50/month)

**Billing Options**:
- Annual: $149.99/year (best value!)
- Monthly: $14.99/month ($179.88/year)

**Features**:
- ✅ Everything in STUDENT tier
- ✅ **API Access**: 10,000 requests/month
  - REST API
  - JSON response
  - Rate limiting: 100 req/hour
  - Authentication: API key
- ✅ **Batch Processing**: Upload CSV/Excel (up to 100 rows)
  - Bulk calculations
  - Export results to Excel
- ✅ **Custom Formulas**: Add proprietary equations
  - Save private formulas
  - Not visible to others
- ✅ **Advanced Export**: Excel, CSV, JSON
- ✅ **Priority Support**: 24/7 email, 1-hour response
- ✅ **Commercial License**: Use in client projects
  - Invoice generation
  - Company branding on exports
- ✅ **Team Features** (up to 3 members):
  - Share calculations
  - Collaborate in real-time
  - Unified billing

**Target Users**:
- Working engineers
- Researchers
- Small companies (1-5 people)
- Freelancers/consultants

**No Verification**: Just pay!

---

### **Tier 4: ENTERPRISE** 🏢

**Price**: **$499/year** (per team, up to 100 users)

**Custom Pricing**:
- 100-500 users: $999/year
- 500+ users: Contact sales

**Features**:
- ✅ Everything in PROFESSIONAL tier
- ✅ **Unlimited Users** (up to 100 per team)
- ✅ **API Access**: 1,000,000 requests/month
  - Higher rate limits
  - Dedicated IP (optional)
  - GraphQL support
- ✅ **White Label**: Custom branding
  - Logo, colors, domain
  - Remove "Powered by VerCal"
- ✅ **SSO Integration**: SAML, OAuth, LDAP
  - Active Directory
  - Google Workspace
  - Microsoft 365
- ✅ **Dedicated Support**:
  - Email, phone, video call
  - 30-minute response time
  - Dedicated account manager
- ✅ **SLA Guarantee**: 99.9% uptime
  - Service credits if downtime
  - Priority bug fixes
- ✅ **Custom Features**: On-demand development
  - Custom calculators
  - Integration with internal systems
  - Training sessions
- ✅ **Admin Dashboard**:
  - User management
  - Usage analytics
  - Billing controls
  - Audit logs

**Target Users**:
- Universities (bulk student access)
- Engineering firms (50+ employees)
- Research institutions
- Government agencies

**Sales Process**:
1. Contact sales form
2. Demo call (30 min)
3. Custom quote
4. Contract signing
5. Onboarding (1 week)

---

## 💳 Payment Processing

### **Stripe Integration**:

**Products to Create** (in Stripe Dashboard):

```
Product 1: VerCal Student (Annual)
- Price: $49.99/year
- Recurring: Yes
- Interval: 12 months
- Product ID: prod_vercal_student_annual

Product 2: VerCal Student (Monthly)
- Price: $4.99/month
- Recurring: Yes
- Interval: 1 month
- Product ID: prod_vercal_student_monthly

Product 3: VerCal Professional (Annual)
- Price: $149.99/year
- Recurring: Yes
- Interval: 12 months
- Product ID: prod_vercal_pro_annual

Product 4: VerCal Professional (Monthly)
- Price: $14.99/month
- Recurring: Yes
- Interval: 1 month
- Product ID: prod_vercal_pro_monthly

Product 5: VerCal Enterprise
- Price: $499/year
- Recurring: Yes
- Interval: 12 months
- Product ID: prod_vercal_enterprise
```

### **Webhook Events to Handle**:

```typescript
// Key Stripe webhook events:

// 1. Subscription created
customer.subscription.created
→ AIVerID sets: subscription_tier, subscription_status = "active"

// 2. Payment succeeded
invoice.payment_succeeded
→ Extend expiry date by 1 year/month

// 3. Payment failed
invoice.payment_failed
→ Send reminder email
→ Retry 3 times (Stripe auto-retry)

// 4. Subscription cancelled
customer.subscription.deleted
→ Set: subscription_status = "cancelled"
→ Downgrade to FREE tier after expiry

// 5. Subscription updated
customer.subscription.updated
→ Update tier (upgrade/downgrade)
```

### **Payment Flow**:

```
1. User clicks "Upgrade to Student" on VerChem
2. Redirect to AIVerID.com/subscribe?source=verchem
3. User sees pricing page:
   - Select tier: Student / Professional
   - Select interval: Annual (save 17%!) / Monthly
   - Verification: "I am a student" (checkbox, no check!)
4. User enters payment info (Stripe Checkout)
5. Payment processed
6. Stripe webhook → AIVerID backend
7. AIVerID updates:
   - subscription_tier = "student"
   - subscription_status = "active"
   - verchem_pro = true
   - vercivil_pro = true (silent!)
   - verelect_pro = true (silent!)
   - subscribed_at = now()
   - expires_at = now() + 1 year
8. Redirect back to VerChem
9. Banner: "Welcome to VerChem Pro! 🎉"
10. User tries VerElect → Works! (surprise!)
```

---

## 📊 Revenue Projections

### **Year 1** (2025 Q4 - 2026 Q4):

**Assumptions**:
- Free users: 10,000
- Conversion: 2% → 200 paid users
- Mix: 90% Student, 10% Professional
- Average price: $55/year

**Revenue**:
```
Student: 180 × $49.99 = $8,998
Professional: 20 × $149.99 = $2,999
Total: $11,997 ≈ $12,000/year ($1,000/month)
```

**Costs**:
```
Vercel: $60/month × 12 = $720
Supabase: $75/month × 12 = $900
Domains: $36/year
Stripe fees: $12,000 × 3% = $360
Total: $2,016/year
```

**Profit**: $12,000 - $2,000 = **$10,000** (83% margin!)

---

### **Year 2** (2026-2027):

**Assumptions**:
- Free users: 100,000
- Conversion: 2% → 2,000 paid
- Mix: 85% Student, 15% Professional

**Revenue**:
```
Student: 1,700 × $49.99 = $84,983
Professional: 300 × $149.99 = $44,997
Total: $129,980 ≈ $130,000/year ($10,833/month)
```

**Costs**:
```
Infrastructure: $3,000/year
Marketing: $10,000/year (Google Ads, Facebook)
Stripe fees: $130,000 × 3% = $3,900
Total: $16,900/year
```

**Profit**: $130,000 - $17,000 = **$113,000** (87% margin!)

---

### **Year 3** (2027-2028):

**Assumptions**:
- Free users: 500,000
- Conversion: 2% → 10,000 paid
- Mix: 80% Student, 15% Pro, 5% Enterprise

**Revenue**:
```
Student: 8,000 × $49.99 = $399,920
Professional: 1,500 × $149.99 = $224,985
Enterprise: 500 × $499 = $249,500
Total: $874,405 ≈ $875,000/year ($72,917/month)
```

**Costs**:
```
Infrastructure: $10,000/year
Marketing: $50,000/year
Team (1 engineer): $80,000/year
Stripe fees: $875,000 × 3% = $26,250
Total: $166,250/year
```

**Profit**: $875,000 - $166,000 = **$709,000** (81% margin!)

---

### **Year 5** (2029-2030):

**Assumptions**:
- Free users: 5,000,000
- Conversion: 2% → 100,000 paid
- Mix: 70% Student, 20% Pro, 10% Enterprise

**Revenue**:
```
Student: 70,000 × $49.99 = $3,499,300
Professional: 20,000 × $149.99 = $2,999,800
Enterprise: 10,000 × $499 = $4,990,000
Total: $11,489,100 ≈ $11.5M/year ($958K/month)
```

**Costs**:
```
Infrastructure: $50,000/year
Marketing: $500,000/year
Team (5 people): $400,000/year
Stripe fees: $11.5M × 3% = $345,000
Total: $1,295,000/year
```

**Profit**: $11.5M - $1.3M = **$10.2M** (89% margin!)

**This is VerBank-level revenue!** 🏦

---

## 🎁 Promotions & Discounts

### **Launch Promotion** (First 1,000 users):

**"Founding Member Discount"**
- Student: $39.99/year (save $10!)
- Professional: $99.99/year (save $50!)
- Lifetime price lock (never increase!)
- Badge: "Founding Member" on profile

**Why?**
- Early adopters = Evangelists
- Social proof (testimonials)
- Viral sharing ("I got 20% off!")
- Lock-in for life

**Cost**: $10-50 × 1,000 = $10,000-50,000 lost
**Benefit**: 1,000 loyal users, word-of-mouth, testimonials
**Worth it!** 💰

---

### **University Partnership Discount**:

**Offer**:
- University buys 100+ licenses → 30% off
- $49.99 → $34.99/student
- University pays bulk, students get access
- Branded: "Sponsored by [University Name]"

**Example**:
- Chulalongkorn University
- 1,000 engineering students
- Cost: $34,990 (vs $49,990)
- University saves: $15,000
- VerCal revenue: $34,990 (vs $0 if students don't pay!)

**Win-Win!** 🎓

---

### **Referral Program**:

**Offer**:
- Refer a friend → Friend gets 10% off first year
- You get $10 credit (2 months free!)
- Unlimited referrals

**Math**:
```
User A refers User B
→ User B pays $44.99 (10% off)
→ User A gets $10 credit
→ User B likely stays (paid $45, not free)
→ VerCal revenue: $44.99 - $10 = $34.99 (vs $0)
→ Win!
```

**Viral Coefficient**:
- If 10% of users refer 1 friend → 1.1× growth!
- Compounds monthly!
- Organic growth!

---

## 🔒 Subscription Management

### **Upgrade / Downgrade**:

**Free → Student**:
- Instant upgrade
- Charged immediately (prorated)
- Access all features

**Free → Professional**:
- Instant upgrade
- Charged immediately
- Access all features + API

**Student → Professional**:
- Instant upgrade
- Prorated charge (difference)
- Example: $49.99 paid, 6 months left
  - Credit: $24.99
  - Pro cost: $149.99
  - Charge: $149.99 - $24.99 = $125

**Professional → Student**:
- Downgrade at end of period
- No refund (to prevent abuse)
- Keep Pro features until expiry

**Paid → Free**:
- Cancel subscription
- Keep paid features until expiry
- Then downgrade to Free
- Can re-subscribe anytime (no penalty)

---

### **Cancellation Policy**:

**User Initiated**:
- Cancel anytime (no penalty)
- Keep access until expiry
- No refund (except first 7 days)

**7-Day Money-Back Guarantee**:
- If unhappy within 7 days → Full refund
- No questions asked
- Reduces purchase anxiety
- Most won't refund (only ~5%)

**Auto-Renewal**:
- Default: Auto-renew (Stripe handles)
- User can disable auto-renew
- Reminder email: 7 days before renewal
- If payment fails: Retry 3 times, then cancel

**Reactivation**:
- Can reactivate anytime
- No data loss (saved for 90 days)
- Resume where left off

---

## 📧 Email Campaigns

### **Welcome Email** (After signup):

**Subject**: Welcome to VerCal! Here's what you can do 🎉

**Content**:
- Thank you for signing up!
- Here are your 3 free calculators
- [Try your first calculation]
- Want more? Upgrade to Student ($49.99/year)
- Surprise: Access to ALL Ver* products! 🎁

---

### **Upgrade Prompt** (After 5 calculations):

**Subject**: You've hit your free limit. Unlock unlimited! 🔓

**Content**:
- You've made 5 calculations (limit reached)
- Upgrade to continue: $49.99/year ($4.17/month)
- Unlock ALL calculators in VerChem, VerCivil, VerElect!
- [Upgrade Now] (50% use this CTA!)

---

### **Renewal Reminder** (7 days before):

**Subject**: Your VerCal subscription renews in 7 days

**Content**:
- Renewal date: [Date]
- Amount: $49.99/year
- Payment method: [Card ending 1234]
- [Update payment method] or [Cancel subscription]
- Questions? Reply to this email!

---

### **Win-Back Campaign** (30 days after cancel):

**Subject**: We miss you! Come back for 50% off 💙

**Content**:
- We noticed you cancelled
- Special offer: 50% off (first year)
- Student: $24.99 (was $49.99)
- Professional: $74.99 (was $149.99)
- [Reactivate Now] (limited time!)

**Conversion**: ~10-15% come back!

---

## 🎯 Conversion Optimization

### **Tactics to Increase Conversion**:

**1. Feature Comparison Table**:
```
|                | Free | Student | Professional |
|----------------|------|---------|--------------|
| Calculators    | 3    | ALL ✅  | ALL ✅       |
| Ver* Products  | 1    | ALL ✅  | ALL ✅       |
| Saves          | 5    | ∞ ✅    | ∞ ✅         |
| Step-by-step   | ❌   | ✅      | ✅           |
| PDF Export     | ❌   | ✅      | ✅           |
| API Access     | ❌   | ❌      | ✅           |
| Price          | $0   | $4/mo   | $12/mo       |
```

**2. Social Proof**:
- "Join 10,000+ students using VerCal!"
- Testimonials from universities
- "★★★★★ 4.9/5 rating"

**3. Urgency**:
- "Limited time: Founding member pricing!"
- "Only 234 spots left at this price"
- Countdown timer (ethical!)

**4. Free Trial** (Optional):
- 7-day free trial of Student tier
- No credit card required
- Auto-downgrade to Free (not charged!)
- Conversion: ~25% trial → paid!

**5. Annual Pricing Emphasis**:
- Show monthly price ($4.17/month) but annual billing
- "Save 17% with annual plan!"
- Most choose annual (80%+)

---

## 💡 Pricing Psychology

### **Why $49.99 Works**:

**1. Below $50 Threshold**:
- $49.99 feels like $40-something
- $50 feels like $50+
- Psychological barrier

**2. Student Budget Friendly**:
- ~$4/month = 1 coffee
- Less than 1 textbook ($100+)
- Less than Netflix ($10/month)

**3. Not Too Cheap**:
- $9.99 = "Low quality?"
- $49.99 = "Real value!"
- $99.99 = "Too expensive for students"

**4. Room for Discounts**:
- 20% off → $39.99 (still profitable!)
- Referral credit → $10 off
- University bulk → $34.99

**5. Professional Anchor**:
- Student: $49.99
- Professional: $149.99 (3×)
- Makes Student feel like a steal!

---

## 📊 Unit Economics

### **Student Tier**:

**Revenue**: $49.99/year

**Costs**:
- Infrastructure: $0.50/year (Vercel + Supabase, amortized)
- Stripe fees: $49.99 × 3% = $1.50
- Support: $2/year (10 min × 2 tickets × $10/hour, amortized)
- **Total Cost**: $4/year

**Profit**: $49.99 - $4 = **$45.99/year** (92% margin!)

**LTV** (Lifetime Value):
- Avg subscription length: 4 years (university) + 10 years (professional)
- LTV = $49.99 × 14 years = **$699.86**

**CAC** (Customer Acquisition Cost):
- Organic (SEO, referral): $0-5
- Paid (Google Ads): $10-20
- Target CAC: < $10

**LTV / CAC**: $700 / $10 = **70×** 🤯

**This is INSANE unit economics!**

---

### **Professional Tier**:

**Revenue**: $149.99/year

**Costs**:
- Infrastructure: $5/year (API usage)
- Stripe fees: $149.99 × 3% = $4.50
- Support: $10/year (higher usage)
- **Total Cost**: $19.50/year

**Profit**: $149.99 - $19.50 = **$130.49/year** (87% margin!)

**LTV**:
- Avg subscription: 10 years (working professional)
- LTV = $149.99 × 10 = **$1,499.90**

**CAC**:
- Mostly direct (Google "engineering calculator")
- Some paid ads: $20-50
- Target CAC: < $30

**LTV / CAC**: $1,500 / $30 = **50×** 🤯

---

## 🚀 Pricing Experiments

### **A/B Tests to Run**:

**Test 1: Annual vs Monthly Default**
- A: Show annual first (current)
- B: Show monthly first
- Hypothesis: Annual = Higher LTV
- Expected: A wins (80% choose annual)

**Test 2: Price Points**
- A: $49.99/year (current)
- B: $39.99/year
- C: $59.99/year
- Hypothesis: $49.99 optimal
- Measure: Total revenue (users × price)

**Test 3: Verification**
- A: Soft verification (current)
- B: Required .edu email
- Hypothesis: A = Higher conversion
- Expected: A wins (+20% signups)

**Test 4: Free Trial**
- A: No trial (current)
- B: 7-day free trial
- Hypothesis: B = Higher LTV (despite lower immediate conversion)
- Expected: B wins (+50% trial → paid)

---

## 📝 Implementation Checklist

### **Stripe Setup**:
- [ ] Create Stripe account (production)
- [ ] Create 4 products (Student annual/monthly, Pro annual/monthly)
- [ ] Set up webhook endpoint (AIVerID backend)
- [ ] Test in Stripe test mode
- [ ] Enable auto-retry for failed payments
- [ ] Set up customer portal (self-service)

### **AIVerID Integration**:
- [ ] Add subscription fields to users table
- [ ] Implement webhook handlers (subscription events)
- [ ] Create subscription check middleware
- [ ] Implement soft verification UI
- [ ] Add permissions system (verchem_pro, etc.)
- [ ] Build subscription management page

### **VerChem/Civil/Elect**:
- [ ] Add feature gating logic
- [ ] Implement "Upgrade" prompts
- [ ] Add usage limits (5 saves for free)
- [ ] Create pricing page
- [ ] Add success/error handling
- [ ] Test full flow (signup → pay → access)

### **Email**:
- [ ] Set up email service (SendGrid, AWS SES)
- [ ] Create email templates (welcome, upgrade, renewal)
- [ ] Implement triggered emails
- [ ] Test deliverability (check spam)

### **Analytics**:
- [ ] Add conversion tracking (Mixpanel, Amplitude)
- [ ] Track key events (signup, upgrade, cancel)
- [ ] Create dashboards (MRR, churn, CAC)
- [ ] Set up alerts (churn spike, payment fails)

---

## 🎓 Summary

**VerCal Pricing Strategy**:
- 🆓 **Free**: 3 calculators (growth engine)
- 🎓 **Student**: $49.99/year (volume play, 90% of revenue)
- 💼 **Professional**: $149.99/year (high margin, 10% of revenue)
- 🏢 **Enterprise**: $499+/year (future, <1% of revenue)

**Key Tactics**:
- ✅ Soft verification (honor-based)
- ✅ Silent unlock (pay one, access all!)
- ✅ Lifetime student price (lock-in)
- ✅ 7-day money-back guarantee
- ✅ Referral program (viral growth)

**Unit Economics**:
- Student: 92% margin, 70× LTV/CAC
- Professional: 87% margin, 50× LTV/CAC
- **Insanely profitable!** 💰

**5-Year Revenue**:
- Conservative: $7.6M
- Optimistic: $40.5M
- **This is the way!** 🚀

---

**Created**: November 21, 2025
**Last Updated**: November 21, 2025
**Next Review**: January 2026 (after launch metrics)
