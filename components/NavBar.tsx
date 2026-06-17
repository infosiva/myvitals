'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Today' },
  { href: '/history', label: 'History' },
  { href: '/insights', label: 'AI Coach' },
  { href: '/profile', label: 'Profile' },
]

export default function NavBar({ authSlot }: { authSlot?: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-brand">
        <span style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.03em', color: '#0f172a' }}>
          My<span style={{ color: '#0d9488' }}>Vitals</span>
        </span>
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
      {authSlot && <div className="nav-auth">{authSlot}</div>}
    </nav>
  )
}
