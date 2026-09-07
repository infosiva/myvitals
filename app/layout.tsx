import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import FeedbackWidget from '@/components/FeedbackWidget'
import NavBar from '@/components/NavBar'
import CookieConsent from "../components/CookieConsent"
import Footer from "../components/Footer"
import AuthButton from '@/components/AuthButton'
import AffiliateStrip from '@/components/AffiliateStrip'
import ChatBot from '@/components/ChatBot'
import BackToTop from '@/components/BackToTop'
import { getSiteFlags } from '@/lib/flags'
import { loadSiteTheme, buildThemeStyleTag, isWidgetHidden } from '@/lib/theme-loader'

export const metadata: Metadata = {
  title: 'MyVitals — Your health, finally explained.',
  description: 'AI connects your food, sleep, symptoms and mood — and tells you what\'s actually driving how you feel. No paywall on insights.',
  metadataBase: new URL('https://myvitals.app'),
  openGraph: {
    title: 'MyVitals — Your health, finally explained.',
    description: 'AI connects your food, sleep, symptoms and mood — and tells you what\'s actually driving how you feel.',
    url: 'https://myvitals.app',
    siteName: 'MyVitals',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyVitals — Your health, finally explained.',
    description: 'AI connects your food, sleep, symptoms and mood — and tells you what\'s actually driving how you feel.',
  },
  robots: { index: true, follow: true },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "MyVitals",
  "url": "https://myvitals.app",
  "description": "Apple Health logs everything but explains nothing. MyVitals reads your data and tells you what to fix — sleep, stress, nutrition, in plain English.",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [flags, theme] = await Promise.all([
    getSiteFlags('myvitals'),
    loadSiteTheme('myvitals'),
  ])

  const themeCSS = buildThemeStyleTag(theme, {
    background: '#f0fdfa',
    primary: '#0d9488',
    secondary: '#0f766e',
  })

  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-4237294630161176" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --theme-primary: #0d9488;
            --theme-secondary: #0f766e;
            --theme-base: #f0fdfa;
            --background: #f0fdfa;
            --foreground: #0f172a;
            --accent: #0d9488;
            --accent-2: #0f766e;
            --border: #99f6e4;
            --surface-1: #ffffff;
            --surface-2: #ccfbf1;
            --text-2: #0f766e;
            --border-default: rgba(13,148,136,0.2);
            --border-strong: rgba(13,148,136,0.4);
            --radius: 1rem;
          }
          body { font-family: 'DM Sans', system-ui, sans-serif !important; color: #0f172a; }
          h1, h2, h3 { font-family: 'DM Sans', system-ui, sans-serif !important; font-weight: 700; letter-spacing: -0.02em; }
          ${themeCSS}
        ` }} />
      </head>
      <body style={{
        background: 'var(--background, #f0fdfa)',
        color: '#0f172a',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div className="aurora aurora-primary" aria-hidden />
        <div className="aurora aurora-secondary" aria-hidden />
        <div className="aurora aurora-third" aria-hidden />
        <NavBar authSlot={<AuthButton />} />
        <div style={{ paddingTop: 58 }}>{children}</div>
        {flags.chatbot && !isWidgetHidden(theme, 'chatbot') && <ChatBot />}
        <FeedbackWidget siteName="MyVitals" accentColor="#34d399" accentColor2="#10b981" position={flags.chatbot ? 'left' : 'right'} />
        <Script defer data-site="myvitals.app" src="http://31.97.56.148:3098/t.js" strategy="afterInteractive" />
        {!isWidgetHidden(theme, 'backToTop') && <BackToTop accentColor="#10b981" />}
        <AffiliateStrip />
        <Footer siteName="MyVitals" />
        {!isWidgetHidden(theme, 'cookieConsent') && <CookieConsent />}
      </body>
    </html>
  )
}
