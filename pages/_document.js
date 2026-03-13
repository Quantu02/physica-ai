import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ── PWA Core ────────────────────────────────────── */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00c3ff" />
        <meta name="application-name" content="PhysicaAI" />

        {/* ── iOS PWA ─────────────────────────────────────── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PhysicaAI" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* iOS splash screens (covers common phone sizes) */}
        <link rel="apple-touch-startup-image" href="/splash/splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-750x1334.png"  media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-640x1136.png"  media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />

        {/* ── Android / General ───────────────────────────── */}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72.png" />

        {/* ── SEO ─────────────────────────────────────────── */}
        <meta name="description" content="Learn Physics and Mathematics from Class 11 to Graduate level with AI-powered tutoring, 3D simulations, flashcards, and Socratic learning." />
        <meta name="keywords" content="physics, mathematics, AI tutor, quantum mechanics, calculus, spaced repetition, education" />
        <meta property="og:title" content="PhysicaAI — Physics & Mathematics AI Tutor" />
        <meta property="og:description" content="Learn from Class 11 to Graduate Level with AI" />
        <meta property="og:type" content="website" />

        {/* ── Fonts (preconnect for speed) ────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

        {/* ── Viewport (critical for mobile) ──────────────── */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />

        {/* ── Format detection (prevent iOS auto-linking numbers) ── */}
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <body>
        <Main />
        <NextScript />

        {/* ── Register Service Worker ──────────────────────── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('[PhysicaAI] Service Worker registered:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[PhysicaAI] Service Worker failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </Html>
  );
}
