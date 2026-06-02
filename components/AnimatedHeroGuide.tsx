'use client'

import { useEffect, useRef, useState } from 'react'

const ACCENT = '#34d399'
const ACCENT2 = '#10b981'

const features = [
  { icon: '📊', title: 'Smart Health Dashboard', desc: 'Track vitals, mood, sleep and nutrition in one unified view. AI spots patterns you\'d miss.' },
  { icon: '🤖', title: 'AI Health Coach', desc: 'VitalsBot gives personalised advice based on your actual data — like a doctor-friend on call 24/7.' },
  { icon: '🔥', title: 'Streak & Habit Engine', desc: 'Daily check-ins build momentum. Streak tracking keeps you consistent with science-backed nudges.' },
  { icon: '🧬', title: 'Evidence-Based Insights', desc: 'Every recommendation cites research. No pseudoscience — just what works for your body type and goals.' },
]

const steps = [
  { num: '01', title: 'Log your day', desc: 'Quick 30-second check-in: mood, sleep, meals, movement. No friction.' },
  { num: '02', title: 'AI analyses trends', desc: 'VitalsBot surfaces patterns across 7-day, 30-day windows. Alerts when something\'s off.' },
  { num: '03', title: 'Get actionable tips', desc: 'Specific, personalised recommendations — not generic "drink water" advice.' },
  { num: '04', title: 'Watch metrics improve', desc: 'Track your health score week over week. Real progress, visualised.' },
]

function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let w = canvas.offsetWidth, h = canvas.offsetHeight
    canvas.width = w; canvas.height = h

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(52,211,153,${p.opacity})`
        ctx.fill()
      }
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(52,211,153,${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight
      canvas.width = w; canvas.height = h
    }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6, pointerEvents: 'none' }}
    />
  )
}

export default function AnimatedHeroGuide() {
  const [visible, setVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setVisible(true)
    const t = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        @keyframes hg-fade-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes hg-glow { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
        @keyframes hg-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        @keyframes hg-spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @keyframes hg-shimmer { 0%{background-position:200% center;} 100%{background-position:-200% center;} }
        .hg-shimmer-text {
          background: linear-gradient(90deg, #34d399, #10b981, #6ee7b7, #34d399);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: hg-shimmer 4s linear infinite;
        }
        .hg-card {
          transition: transform 200ms cubic-bezier(.23,1,.32,1), box-shadow 200ms cubic-bezier(.23,1,.32,1);
        }
        .hg-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(52,211,153,0.15), 0 0 0 1px rgba(52,211,153,0.2);
        }
        @media (max-width: 640px) {
          .hg-grid { grid-template-columns: 1fr !important; }
          .hg-steps { flex-direction: column !important; }
        }
      `}</style>

      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #020d08 0%, #050d0a 60%, #050510 100%)', padding: '80px 24px 60px' }}>
        <ParticleBg />

        {/* Parallax blobs — Securify-inspired health adaptation */}
        <div style={{ position: 'absolute', top: -120, left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'hg-glow 7s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: '8%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.11) 0%, transparent 70%)', filter: 'blur(70px)', animation: 'hg-glow 9s ease-in-out infinite 2.5s', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '25%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,231,183,0.07) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        {/* Hero */}
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', textAlign: 'center', opacity: visible ? 1 : 0, animation: visible ? 'hg-fade-up 0.6s cubic-bezier(0.23,1,0.32,1)' : 'none' }}>

          {/* Liquid-glass badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            borderRadius: 9999, padding: '6px 16px', marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'rgba(167,243,208,0.85)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>AI Health Coach · Free to start</span>
          </div>

          {/* Headline — larger, tighter */}
          <h1 style={{ fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)', fontWeight: 900, lineHeight: 1.0, marginBottom: 22, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
            Your body has patterns.<br />
            <span className="hg-shimmer-text">AI helps you read them.</span>
          </h1>

          {/* Trust pills row — Securify data security pattern */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {['🔒 HIPAA-aware', '💚 Evidence-based', '⚡ No signup needed'].map(p => (
              <span key={p} style={{
                fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 9999,
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)',
                color: 'rgba(167,243,208,0.70)', letterSpacing: '0.04em',
              }}>{p}</span>
            ))}
          </div>

          <p style={{ fontSize: 16, color: 'rgba(241,245,249,0.55)', lineHeight: 1.75, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            Track sleep, mood, nutrition, movement — your AI coach spots what&apos;s working, what&apos;s not, and exactly what to do next.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/insights" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 30px', borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 24px rgba(52,211,153,0.35)', transition: 'transform 150ms cubic-bezier(0.23,1,0.32,1), box-shadow 150ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(52,211,153,0.50)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(52,211,153,0.35)' }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)' }}
            >Start tracking free →</a>
            <a href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 14, border: '1px solid rgba(52,211,153,0.22)', color: ACCENT, fontWeight: 600, fontSize: 15, textDecoration: 'none', background: 'rgba(52,211,153,0.05)', transition: 'background 150ms ease, border-color 150ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,211,153,0.35)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52,211,153,0.22)' }}
            >How it works</a>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ background: '#050d0a', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>Everything your wellness needs</h2>
            <p style={{ color: 'rgba(241,245,249,0.5)', fontSize: 15 }}>Science-backed tracking meets AI-powered coaching</p>
          </div>
          <div className="hg-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="hg-card" style={{ padding: '24px', background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 16, cursor: 'default', animation: `hg-fade-up 0.5s ease-out ${i * 0.1}s both` }}>
                <div style={{ fontSize: 28, marginBottom: 12, animation: 'hg-float 4s ease-in-out infinite', display: 'inline-block' }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(241,245,249,0.55)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ background: 'linear-gradient(180deg, #050d0a 0%, #050510 100%)', padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>From check-in to insight in seconds</h2>
          </div>
          <div className="hg-steps" style={{ display: 'flex', gap: 0, position: 'relative' }}>
            {/* connector line */}
            <div style={{ position: 'absolute', top: 28, left: '12%', right: '12%', height: 1, background: 'rgba(52,211,153,0.15)', pointerEvents: 'none' }} />
            {steps.map((s, i) => (
              <div key={i} onClick={() => setActiveStep(i)} style={{ flex: 1, textAlign: 'center', padding: '0 12px', cursor: 'pointer', transition: 'opacity 200ms' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: activeStep === i ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'rgba(52,211,153,0.08)', border: `2px solid ${activeStep === i ? ACCENT : 'rgba(52,211,153,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', transition: 'all 300ms cubic-bezier(.23,1,.32,1)', boxShadow: activeStep === i ? '0 0 20px rgba(52,211,153,0.4)' : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: activeStep === i ? '#fff' : ACCENT, letterSpacing: '0.05em' }}>{s.num}</span>
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: activeStep === i ? ACCENT : '#f1f5f9', marginBottom: 6, transition: 'color 300ms' }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: 'rgba(241,245,249,0.5)', lineHeight: 1.5, maxWidth: 160, margin: '0 auto' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
