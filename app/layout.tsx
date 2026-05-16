import type { Metadata } from 'next'
import './globals.css'
import FeedbackWidget from '@/components/FeedbackWidget'
import NavBar from '@/components/NavBar'
import CookieConsent from "../components/CookieConsent";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: 'MyVitals — AI Health Coach',
  description: 'Track daily wellness. Get personalised AI insights like a doctor-friend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --theme-primary: #0891b2;
            --theme-secondary: #22c55e;
            --theme-base: #f0fdfa;
            --background: #f0fdfa;
            --surface-1: #ffffff;
            --surface-2: #e6fffa;
            --foreground: #134e4a;
            --text-2: #0d9488;
            --border-default: rgba(8,145,178,0.15);
            --border-strong: rgba(8,145,178,0.3);
          }
          body { font-family: 'DM Sans', system-ui, sans-serif !important; color: #134e4a !important; background: #f0fdfa !important; }
          h1, h2, h3 { font-weight: 700 !important; }
          .glass { background: rgba(240,253,250,0.9) !important; border-color: rgba(8,145,178,0.15) !important; }
        ` }} />
      </head>
      <body>
        <NavBar />
        <div style={{ paddingTop: 58 }}>{children}</div>
        <FeedbackWidget siteName="MyVitals" accentColor="#34d399" accentColor2="#10b981" />
        <Footer siteName="MyVitals" />
      <CookieConsent />
      </body>
    </html>
  )
}
