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
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(5,5,16,0.8)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(52,211,153,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', height: 58,
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #34d399, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: '0 0 16px rgba(52,211,153,0.35)',
            }}>💚</div>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.5px' }}>
              Health<span style={{ color: '#34d399' }}>Pulse</span>
            </span>
          </a>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { href: '/', label: '📊 Today' },
              { href: '/history', label: '📅 History' },
              { href: '/insights', label: '🧠 AI Coach' },
              { href: '/profile', label: '⚙️ Profile' },
            ].map(({ href, label }) => (
              <a key={href} href={href} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
              }}>{label}</a>
            ))}
          </div>
        </nav>
        <div style={{ paddingTop: 58 }}>{children}</div>
        <FeedbackWidget siteName="MyVitals" accentColor="#34d399" accentColor2="#10b981" />
      </body>
    </html>
  )
}
