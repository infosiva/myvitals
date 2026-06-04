'use client'

// Compact landing — max 3 desktop viewport scrolls
// bg-[#070b14], accent emerald #10b981
// Sections: Hero (split ~70vh) | Pill strip | 3-col features | CTA strip | Footer

import { useState } from 'react'
import { motion } from 'framer-motion'

const ACCENT = '#10b981'
const ACCENT2 = '#34d399'
const BG = '#070b14'
const CARD_BG = 'rgba(16,185,129,0.05)'
const CARD_BORDER = 'rgba(16,185,129,0.14)'

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1]
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease },
})

// ── Mini dashboard mockup ───────────────────────────────────────────────────
const READINGS = [
  { label: 'Blood Pressure', value: '118/76', unit: 'mmHg', status: 'normal', dot: '#10b981' },
  { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'normal', dot: '#10b981' },
  { label: 'Glucose', value: '98', unit: 'mg/dL', status: 'normal', dot: '#10b981' },
  { label: 'Weight', value: '74.2', unit: 'kg', status: 'stable', dot: '#f59e0b' },
  { label: 'Sleep', value: '6.5', unit: 'hrs', status: 'low', dot: '#ef4444' },
]

function DashMockup() {
  return (
    <motion.div
      {...fadeUp(0.3)}
      style={{
        background: 'rgba(7,11,20,0.92)',
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 20,
        padding: '18px 20px',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 48px rgba(16,185,129,0.08), 0 20px 60px rgba(0,0,0,0.4)`,
        width: '100%',
        maxWidth: 360,
      }}
    >
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Health Dashboard
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Today&apos;s snapshot</p>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 20,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          fontSize: 11, fontWeight: 700, color: ACCENT,
        }}>
          Score 82
        </div>
      </div>

      {/* readings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {READINGS.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.07, duration: 0.35, ease }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: r.dot, flexShrink: 0,
                boxShadow: `0 0 6px ${r.dot}80`,
              }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{r.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{r.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI insight strip */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.4 }}
        style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 10,
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>🩺</span>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, margin: 0 }}>
          Sleep is below 7h for 3 days. Try a consistent 10pm bedtime.
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Metric pill strip ───────────────────────────────────────────────────────
const METRIC_PILLS = [
  'Blood Pressure', 'Heart Rate', 'Glucose', 'Weight', 'Sleep', 'Temperature',
]

// ── 3-col feature cards ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Analysis',
    desc: 'Natural language insights on your readings. Spot trends before they become issues.',
  },
  {
    icon: '📈',
    title: 'Trend Charts',
    desc: '7-day and 30-day sparklines for every metric. See patterns at a glance.',
  },
  {
    icon: '📄',
    title: 'Export PDF',
    desc: 'One-tap health report. Share with your doctor or keep for your records.',
  },
]

// ── Main component ──────────────────────────────────────────────────────────
export default function AnimatedHeroGuide() {
  const [activePill, setActivePill] = useState(0)

  return (
    <div style={{ background: BG, color: '#fff', fontFamily: 'inherit', overflowX: 'hidden' }}>
      {/* ambient glow */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '-8%', width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
      </div>

      <style>{`
        .mv-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .mv-feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) {
          .mv-hero-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .mv-feature-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
        @media (max-width: 640px) {
          .mv-pill-strip { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .mv-pill-strip::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* ── SECTION 1: HERO (~70vh) ─────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 32px 56px', maxWidth: 1160, margin: '0 auto', boxSizing: 'border-box' }}>
        <div className="mv-hero-grid">

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* eyebrow */}
            <motion.div {...fadeUp(0)}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 999,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
                Free · No account needed
              </span>
            </motion.div>

            {/* headline */}
            <motion.h1 {...fadeUp(0.08)} style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', margin: 0, color: '#f0fdf4' }}>
              Your health,{' '}
              <span style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 28px rgba(16,185,129,0.35))',
              }}>
                understood.
              </span>
            </motion.h1>

            <motion.p {...fadeUp(0.14)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0, maxWidth: 420 }}>
              Track vitals, get AI analysis, spot trends. Your personal health dashboard — no account, free forever.
            </motion.p>

            {/* CTA */}
            <motion.div {...fadeUp(0.2)} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: `0 0 28px rgba(16,185,129,0.45)` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('myvitals-onboard')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 28px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  color: '#000', fontWeight: 800, fontSize: 15,
                  border: 'none', cursor: 'pointer', letterSpacing: '-0.2px',
                  boxShadow: `0 0 20px rgba(16,185,129,0.25)`,
                }}
              >
                Add first reading
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.button>

              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
                ✓ No signup · Works offline · Private
              </span>
            </motion.div>
          </div>

          {/* Right: dashboard mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DashMockup />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: PILL STRIP (60px) ───────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, borderTop: `1px solid rgba(16,185,129,0.08)`, borderBottom: `1px solid rgba(16,185,129,0.08)`, padding: '0 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div
            className="mv-pill-strip"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 0', flexWrap: 'wrap' }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8, whiteSpace: 'nowrap' }}>
              Track
            </span>
            {METRIC_PILLS.map((pill, i) => (
              <button
                key={pill}
                onClick={() => setActivePill(i)}
                style={{
                  padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: `1px solid ${activePill === i ? ACCENT : 'rgba(16,185,129,0.18)'}`,
                  background: activePill === i ? `rgba(16,185,129,0.12)` : 'transparent',
                  color: activePill === i ? ACCENT : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: 3-COL FEATURES ──────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 32px', maxWidth: 1160, margin: '0 auto', boxSizing: 'border-box' }}>
        <div className="mv-feature-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4, ease }}
              whileHover={{ y: -3, boxShadow: `0 8px 32px rgba(16,185,129,0.12)` }}
              style={{
                padding: '20px 22px', borderRadius: 16,
                background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: PRICING ─────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 32px', maxWidth: 1160, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 8px', color: '#f0fdf4' }}>
            Simple pricing.{' '}
            <span style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              No surprises.
            </span>
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Start free, upgrade when you need more.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 680, margin: '0 auto' }}>
          {[
            {
              name: 'Free',
              price: '$0',
              period: '',
              note: '7 days of tracking',
              features: ['Daily health index', 'AI day recap', 'Water, sleep & steps', 'Mood & exercise log'],
              highlight: false,
              cta: 'Start tracking free',
              href: '#myvitals-onboard',
            },
            {
              name: 'Pro',
              price: '$4',
              period: '/mo',
              note: 'Unlimited tracking',
              features: ['Everything in Free', '30-day trend charts', 'Export PDF reports', 'Weekly AI coach summary'],
              highlight: true,
              cta: 'Get Pro',
              href: '/profile',
            },
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4, ease }}
              whileHover={{ scale: 1.02, y: -3 }}
              style={{
                padding: '22px 20px', borderRadius: 16, position: 'relative', overflow: 'hidden',
                background: plan.highlight ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                border: plan.highlight ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${CARD_BORDER}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              {plan.highlight && (
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: ACCENT, fontWeight: 700 }}>POPULAR</span>
              )}
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, margin: '0 0 6px' }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 3 }}>
                <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', color: plan.highlight ? ACCENT : '#f0fdf4' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '0 0 14px' }}>{plan.note}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                    <span style={{ color: ACCENT, fontSize: 11 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <motion.a
                href={plan.href}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: 'block', padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 13,
                  textAlign: 'center', textDecoration: 'none',
                  background: plan.highlight ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'rgba(16,185,129,0.08)',
                  color: plan.highlight ? '#000' : ACCENT,
                  border: plan.highlight ? 'none' : `1px solid rgba(16,185,129,0.2)`,
                  boxSizing: 'border-box',
                }}
              >
                {plan.cta}
              </motion.a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: CTA STRIP ───────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, borderTop: `1px solid rgba(16,185,129,0.08)`, padding: '20px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Free forever for personal use. No account needed to start.
          </p>
          <motion.button
            id="myvitals-onboard"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              // scroll down — onboarding is rendered below by MyVitalsPage
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
            }}
            style={{
              padding: '10px 22px', borderRadius: 9,
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              color: '#000', fontWeight: 700, fontSize: 13,
              border: 'none', cursor: 'pointer',
            }}
          >
            Get started free →
          </motion.button>
        </div>
      </div>

      {/* ── FOOTER (one row) ────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: `1px solid rgba(16,185,129,0.07)`, padding: '14px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 900, fontSize: 13, color: ACCENT }}>MyVitals</span>
          <div style={{ display: 'flex', gap: 18 }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['About', '/about']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.color = ACCENT)}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}>
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', margin: 0 }}>© 2026 MyVitals</p>
        </div>
      </footer>
    </div>
  )
}
