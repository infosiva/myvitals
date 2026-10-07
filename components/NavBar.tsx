'use client'

import React from 'react'
import { Logo } from './Logo'
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
        <Logo />
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
                background: 'rgba(13,148,136,0.12)',
                color: '#0d9488',
                border: '1px solid rgba(13,148,136,0.25)',
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
