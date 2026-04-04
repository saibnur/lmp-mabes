import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // --- Midtrans Snap domain list ---
    // Includes both sandbox and production domains
    const midtransScriptDomains = [
      "https://app.sandbox.midtrans.com",
      "https://app.midtrans.com",
      "https://api.sandbox.midtrans.com",
      "https://api.midtrans.com",
      "https://snap-assets.al-pc-id-b.cdn.gtflabs.io",
    ];

    const midtransConnectDomains = [
      "https://api.sandbox.midtrans.com",
      "https://api.midtrans.com",
    ];

    const midtransFrameDomains = [
      "https://app.sandbox.midtrans.com",
      "https://app.midtrans.com",
      // Google Pay & GoPay popup frames
      "https://pay.google.com",
      "https://gwk.gopayapi.com",
    ];

    // --- CSP Directives ---
    const scriptSrcParts = [
      "'self'",
      // REQUIRED: Midtrans Snap SDK uses eval() internally
      "'unsafe-eval'",
      // REQUIRED: Next.js needs 'unsafe-inline' in both dev & production
      // for hydration scripts and chunk loading
      "'unsafe-inline'",
      // GoPay container SDK
      "https://gwk.gopayapi.com",
      ...midtransScriptDomains,
    ];

    const connectSrcParts = [
      "'self'",
      // Firebase Firestore & Auth
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "wss://*.firebaseio.com",
      // Midtrans payment API
      ...midtransConnectDomains,
      // Backend API on Vercel
      "https://*.vercel.app",
      // Allow browser extensions (prevents noisy console errors)
      "chrome-extension:",
      "safari-extension:",
    ];

    const frameSrcParts = ["'self'", ...midtransFrameDomains];

    const imgSrcParts = [
      "'self'",
      "data:",
      "blob:",
      "https://*.googleapis.com",
      "https://*.gstatic.com",
      // Cloudinary CDN for uploaded media (berita, profiles, etc.)
      "https://res.cloudinary.com",
      // Allow browser extensions
      "chrome-extension:",
      "safari-extension:",
    ];

    const cspValue = [
      `default-src 'self'`,
      `script-src ${scriptSrcParts.join(" ")}`,
      `connect-src ${connectSrcParts.join(" ")}`,
      `frame-src ${frameSrcParts.join(" ")}`,
      `img-src ${imgSrcParts.join(" ")}`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      // chrome-extension: and safari-extension: allow browser extension fonts
      // to load without polluting the console with CSP errors
      `font-src 'self' https://fonts.gstatic.com chrome-extension: safari-extension:`,
      `worker-src blob:`,
    ].join("; ");

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
