import { NextConfig } from 'next';
import path from 'node:path';

// paper.js (a transitive dependency of ketcher-core) ships a Node build at
// paper/dist/node/canvas.js that requires `jsdom` and `canvas` for
// server-side canvas rendering. Ketcher only runs in the browser, so neither
// is needed and neither is installed. Stub both to an empty module so the
// bundle resolves. See lib/rdkit/empty-module.ts.
const EMPTY_MODULE = path.resolve(process.cwd(), 'lib/rdkit/empty-module.ts');
const STUBBED_NODE_CANVAS_DEPS = /^(jsdom|canvas)(\/.*)?$/;

const nextConfig: NextConfig = {
  // Turbopack config (silences webpack/turbopack mismatch warning in Next.js 16)
  turbopack: {
    resolveAlias: {
      // Stub Node.js built-ins for browser bundles only.
      // @rdkit/rdkit conditionally requires 'fs' in its dist file;
      // we load RDKit only on the client so the stub is safe there.
      fs: { browser: './lib/rdkit/empty-module.ts' },
      path: { browser: './lib/rdkit/empty-module.ts' },
      // paper.js → jsdom + canvas (Node canvas) are unused in the browser; stub them.
      jsdom: { browser: './lib/rdkit/empty-module.ts' },
      canvas: { browser: './lib/rdkit/empty-module.ts' },
    },
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,

  // Compression
  compress: true,

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // P1 Security Headers (Dec 2025 - 4-AI Audit)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.anthropic.com https://api.stripe.com https://aiverid-backend-production.up.railway.app https://*.supabase.co",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // WebAssembly support for RDKit
  webpack(config, { isServer, webpack }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Replace any `jsdom` / `canvas` import (incl. subpaths like
    // jsdom/lib/jsdom/living/generated/utils, pulled in by paper.js via
    // ketcher-core) with an empty module. These are only used by paper's
    // server-side canvas path, which never executes in the browser.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(STUBBED_NODE_CANVAS_DEPS, EMPTY_MODULE)
    );

    // paper/dist/node/extend.js uses Node's `require.extensions` (unsupported
    // by webpack). It lives in paper's server-only path and never runs in the
    // browser, so this warning is benign — silence just this module.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /paper[\\/]dist[\\/]node[\\/]extend\.js/ },
    ];

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@headlessui/react',
      '@heroicons/react',
    ],
  },
};

export default nextConfig;
