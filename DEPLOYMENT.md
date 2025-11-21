# VerChem Deployment Guide

## 🚀 Quick Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier works!)
- Node.js 18+ installed locally

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "feat: VerChem world-class chemistry platform"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/verchem.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Visit [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Click "Deploy"

**Done!** Your site will be live at `https://verchem.vercel.app` in ~2 minutes.

### Step 3: Configure Custom Domain (Optional)

1. Go to project settings → Domains
2. Add your domain (e.g., `verchem.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## 🔧 Environment Variables

VerChem doesn't require any environment variables for basic operation, but you can configure:

```bash
# .env.local (optional)
NEXT_PUBLIC_SITE_URL=https://verchem.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Google Analytics
NEXT_PUBLIC_SENTRY_DSN=https://... # Error tracking
```

## 📊 Performance Checklist

After deployment, verify:

- [ ] **Lighthouse Score**: Run audit (aim for 90+ in all categories)
- [ ] **Build Time**: Should be ~2-3s
- [ ] **Page Load**: < 1s for homepage
- [ ] **SEO**: Check meta tags, sitemap, robots.txt
- [ ] **Mobile**: Test on real devices
- [ ] **Accessibility**: Test with screen reader

## 🔍 Monitoring & Analytics

### Vercel Analytics (Built-in)
Already included! Check dashboard for:
- Page views
- Top pages
- Visitor locations
- Performance metrics

### Google Analytics (Optional)

1. Create GA4 property
2. Add to `.env.local`:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

3. Add to `app/layout.tsx`:
```tsx
import Script from 'next/script'

// In <head>
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
  `}
</Script>
```

### Sentry (Error Tracking - Optional)

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

## 🐛 Debugging Production Issues

### Check Build Logs
```bash
npm run build
```

### Check Runtime Logs
- Vercel: Project → Deployments → View Function Logs
- Local: `npm run start` (production mode)

### Common Issues

**Issue**: Build fails with TypeScript errors
```bash
# Solution: Run type check locally
npx tsc --noEmit
```

**Issue**: Missing environment variables
```bash
# Solution: Add to Vercel project settings
# Settings → Environment Variables
```

**Issue**: 404 on dynamic routes
```bash
# Solution: Ensure routes are in app/ directory
# Check app/[route]/page.tsx exists
```

## 🔄 CI/CD Pipeline

Vercel automatically:
- ✅ Runs `npm run build` on every push
- ✅ Deploys to preview URL for PRs
- ✅ Deploys to production on merge to main
- ✅ Runs TypeScript type checking
- ✅ Optimizes images & fonts

### GitHub Actions (Optional)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:calculations
      - run: npm run build
```

## 🌍 CDN & Caching

Vercel automatically provides:
- **Edge Network**: 100+ locations worldwide
- **Smart CDN**: Caches static assets
- **Image Optimization**: Automatic WebP/AVIF
- **Compression**: Brotli & Gzip

## 📈 Scaling

VerChem is designed to scale:
- **Static Generation**: All pages pre-rendered
- **No Database**: No backend scaling needed
- **Edge Functions**: Fast everywhere
- **Free Tier**: Handles 100,000+ visitors/month

## 🔒 Security Headers

Already configured in `next.config.ts`:
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: origin-when-cross-origin
- ✅ X-DNS-Prefetch-Control: on

## 📱 PWA Setup (Optional)

To enable offline support:

```bash
npm install next-pwa
```

Update `next.config.ts`:
```ts
import withPWA from 'next-pwa'

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

export default nextConfig
```

## 🎯 Post-Deployment Checklist

- [ ] Site is live and accessible
- [ ] All calculators work correctly
- [ ] Mobile responsive
- [ ] SEO meta tags present
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] Manifest accessible at `/manifest.json`
- [ ] Error boundaries catch errors
- [ ] Loading states show properly
- [ ] 404 page works
- [ ] Social sharing works (Open Graph)
- [ ] Analytics tracking
- [ ] Performance > 90 (Lighthouse)

## 🆘 Support

If you encounter issues:
1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [Next.js Documentation](https://nextjs.org/docs)
3. Open [GitHub Issue](https://github.com/verchem/verchem/issues)
4. Contact: support@verchem.com

---

**Happy Deploying! 🚀**
