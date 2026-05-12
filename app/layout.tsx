import type { Metadata } from 'next'
import './globals.css'
import FeedbackWidget from '@/components/FeedbackWidget'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'MyVitals — AI Health Coach',
  description: 'Track daily wellness. Get personalised AI insights like a doctor-friend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <div style={{ paddingTop: 58 }}>{children}</div>
        <FeedbackWidget siteName="MyVitals" accentColor="#34d399" accentColor2="#10b981" />
      </body>
    </html>
  )
}
