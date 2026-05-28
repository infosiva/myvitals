import Script from 'next/script'
import type { Metadata } from 'next'
import './globals.css'
import FeedbackWidget from '@/components/FeedbackWidget'
import NavBar from '@/components/NavBar'
import CookieConsent from "../components/CookieConsent";
import Footer from "../components/Footer";
import AuthButton from '@/components/AuthButton'
import AffiliateStrip from '@/components/AffiliateStrip'
import ChatBot from '@/components/ChatBot'
import { getSiteFlags } from '@/lib/flags'

export const metadata: Metadata = {
  title: 'MyVitals — AI Health Coach',
  description: 'Track daily wellness. Get personalised AI insights like a doctor-friend.',
  metadataBase: new URL('https://myvitals.app'),
  openGraph: {
    title: 'MyVitals — AI Health Coach',
    description: 'Track daily wellness. Get personalised AI insights like a doctor-friend.',
    url: 'https://myvitals.app',
    siteName: 'MyVitals',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyVitals — AI Health Coach',
    description: 'Track daily wellness. Get personalised AI insights like a doctor-friend.',
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const flags = await getSiteFlags('myvitals')
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --theme-primary: #34d399;
            --theme-secondary: #10b981;
            --background: #050510;
            --surface-1: rgba(255,255,255,0.04);
            --surface-2: rgba(255,255,255,0.07);
            --foreground: #f1f5f9;
            --text-2: rgba(255,255,255,0.55);
            --border-default: rgba(255,255,255,0.08);
            --border-strong: rgba(52,211,153,0.25);
          }
          html, body { background: #050510 !important; color: #f1f5f9 !important; }
          body { font-family: 'DM Sans', system-ui, sans-serif !important; }
          h1, h2, h3 { font-weight: 700 !important; }
          .glass { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; }
        ` }} />
      </head>
      <body>
        <div className="aurora aurora-primary" aria-hidden />
        <div className="aurora aurora-secondary" aria-hidden />
        <div className="aurora aurora-third" aria-hidden />
        <div className="grain" aria-hidden />
        <NavBar authSlot={<AuthButton />} />
        <div style={{ paddingTop: 58 }}>{children}</div>
        {flags.chatbot && <ChatBot />}
        <FeedbackWidget siteName="MyVitals" accentColor="#34d399" accentColor2="#10b981" />
        <AffiliateStrip />
        <Footer siteName="MyVitals" />
      <CookieConsent />
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script src="http://31.97.56.148:3098/t.js" data-site="myvitals.app" defer></script>
            <Script async src="http://31.97.56.148:3100/script.js" data-website-id="5574c4a1-ce1c-45aa-ba8b-2ffe9b5eb9c5" strategy="afterInteractive" />
      </body>
    </html>
  )
}
