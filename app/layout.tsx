import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HealthPulse — Your AI Health Coach',
  description: 'Track daily wellness. Get personalised AI insights like a doctor-friend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(6,6,18,0.85)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 56,
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 22 }}>💚</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#34d399', letterSpacing: '-0.5px' }}>HealthPulse</span>
          </a>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/" style={navLink}>Dashboard</a>
            <a href="/history" style={navLink}>History</a>
            <a href="/insights" style={navLink}>AI Insights</a>
            <a href="/profile" style={navLink}>Profile</a>
          </div>
        </nav>
        <div style={{ paddingTop: 56 }}>{children}</div>
      </body>
    </html>
  )
}

const navLink: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
  transition: 'color 0.2s',
}
