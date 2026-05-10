import type { Metadata } from 'next'
import './globals.css'
import FeedbackWidget from '@/components/FeedbackWidget'

export const metadata: Metadata = {
  title: 'MyVitals — AI Health Coach',
  description: 'Track daily wellness. Get personalised AI insights like a doctor-friend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav-bar">
          <a href="/" className="nav-brand">
            <div className="nav-logo">💚</div>
            <span>My<span className="brand-accent">Vitals</span></span>
          </a>
          <div className="nav-links">
            {[
              { href: '/', label: 'Today' },
              { href: '/history', label: 'History' },
              { href: '/insights', label: 'AI Coach' },
              { href: '/profile', label: 'Profile' },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="nav-link">{label}</a>
            ))}
          </div>
        </nav>
        <div style={{ paddingTop: 58 }}>{children}</div>
        <FeedbackWidget siteName="MyVitals" accentColor="#34d399" accentColor2="#10b981" />
      </body>
    </html>
  )
}
