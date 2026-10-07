export function Logo() {
  return (
    <>
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
    </>
  )
}
