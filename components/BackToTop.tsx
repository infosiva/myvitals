'use client'
import { useEffect, useState } from 'react'

export default function BackToTop({ accentColor = '#0d9488' }: { accentColor?: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{ background: accentColor }}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
      aria-label="Back to top"
    >
      ↑
    </button>
  )
}
