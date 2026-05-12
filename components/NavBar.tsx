'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Today' },
  { href: '/history', label: 'History' },
  { href: '/insights', label: 'AI Coach' },
  { href: '/profile', label: 'Profile' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-brand">
        <div className="nav-logo">💚</div>
        <span>My<span className="brand-accent">Vitals</span></span>
      </Link>
      <div className="nav-links">
        {NAV.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="nav-link"
              style={isActive ? {
                background: 'rgba(52,211,153,0.15)',
                color: '#34d399',
                border: '1px solid rgba(52,211,153,0.25)',
              } : undefined}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
