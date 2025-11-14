import type { NextConfig } from "next";

/**
 * Next.js Configuration for Admin Panel
 * 
 * Configured for port 9200 and admin.clienthunt.app subdomain
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Standalone output for deployment
  output: 'standalone',
  
  // Custom server port (can be overridden by PORT env var)
  // Default: 9200
  
  // Custom server port is set via CLI: next dev -p 9200
  // See package.json scripts
  
  // SEO & Performance Optimizations
  compress: true,
  
  // Headers for security
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // Strict CSP for admin panel
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js HMR in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https:",
      "connect-src 'self' http://localhost:7300 https://api.clienthunt.app",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'", // Admin panel should not be embedded
    ];
    
    // In production, remove unsafe-eval
    if (!isDev) {
      const productionCsp = cspDirectives.map(directive => 
        directive.replace(" 'unsafe-eval'", "")
      );
      productionCsp.push("upgrade-insecure-requests");
      cspDirectives.splice(0, cspDirectives.length, ...productionCsp);
    }
    
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
            value: 'DENY' // Admin panel should never be embedded
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer' // Strict referrer policy for admin
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow' // Don't index admin panel
          },
        ],
      },
      // JavaScript files
      {
        source: '/_next/static/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // CSS files
      {
        source: '/_next/static/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7300',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:9200',
  },
};

export default nextConfig;

