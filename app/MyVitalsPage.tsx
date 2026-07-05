'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, animate } from 'framer-motion'
import AnimatedHeroGuide from '@/components/AnimatedHeroGuide'
import { getProfile, getLog, saveLog, saveProfile, today, getStreak, healthScore } from '@/lib/storage'
import type { HealthProfile, DayLog } from '@/lib/types'
import { MOOD_LABELS, MOOD_COLORS } from '@/lib/types'
import GuidedTour, { type TourStep } from '@/components/GuidedTour'
import { useGate } from '@/lib/shared/useGate'
import RegisterGate from '@/lib/shared/RegisterGate'
import type { ContentOverrides } from '@/lib/content'
import GoalProgressBars from '@/components/GoalProgressBars'
import LiveStatsBar from '@/components/LiveStatsBar'

const TOUR_STEPS: TourStep[] = [
  {
    target: '#nl-quick-log',
    title: 'Log your day in seconds',
    body: 'Type how your day went — "walked 8k steps, slept 7hrs, had oats for breakfast" — AI fills all fields instantly.',
    icon: '✨',
    placement: 'bottom',
  },
  {
    target: '#wellness-score',
    title: 'Your Wellness Score',
    body: 'Scores 0–100 across water, sleep, steps, mood and exercise. Updates live as you log.',
    icon: '📊',
    placement: 'left',
  },
  {
    target: '#save-btn',
    title: 'Save & get AI recap',
    body: 'After saving, your AI coach writes a personal 2-sentence summary of your day — specific to your numbers.',
    icon: '🩺',
    placement: 'top',
  },
  {
    target: '#ai-insight-cta',
    title: 'Weekly AI Coach',
    body: 'Log 3+ days and unlock a full weekly narrative — wins, patterns, and one actionable next step.',
    icon: '🌟',
    placement: 'left',
  },
]

const GREEN = '#0d9488'
const TEAL = '#0f766e'

export default function MyVitalsPage({ overrides }: { overrides: ContentOverrides }) {
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [log, setLog] = useState<DayLog>({ date: today(), water: 0, sleep: 0, steps: 0, mood: 0, exercise: 0, meals: [] })
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)
  const [mealInput, setMealInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const { count: gateCount, showGate, increment: gateIncrement, onRegistered, dismissGate } = useGate('myvitals', 7, 'save')
  const [nlText, setNlText] = useState('')
  const [nlParsing, setNlParsing] = useState(false)
  const [nlConfirm, setNlConfirm] = useState<{ parsed: Partial<DayLog>; anomalies: string[] } | null>(null)
  const [narrative, setNarrative] = useState('')
  const [narrativeLoading, setNarrativeLoading] = useState(false)

  const headline = overrides.headline ?? 'Your health, finally explained.'
  const subheadline = overrides.subheadline ?? 'AI connects your food, sleep, symptoms and mood — and tells you what\'s actually driving how you feel.'
  const ctaLabel = overrides.cta ?? "Save Today's Log"

  // Daily Health Index — 0-100 from today's log
  function dailyHealthIndex(l: DayLog): number {
    const water = Math.min((l.water / 8) * 100, 100)
    const sleep = Math.min((l.sleep / 8) * 100, 100)
    const steps = Math.min((l.steps / 10000) * 100, 100)
    const mood = Math.min((l.mood / 10) * 100, 100)
    const exercise = Math.min((l.exercise / 30) * 100, 100)
    return Math.round((water + sleep + steps + mood + exercise) / 5)
  }

  const dhi = dailyHealthIndex(log)
  const dhiColor = dhi >= 75 ? '#10b981' : dhi >= 50 ? '#f59e0b' : '#ef4444'

  // Morning brief — compute from localStorage history
  function getMorningBrief(): string {
    if (typeof window === 'undefined') return ''
    const history: DayLog[] = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      try {
        const raw = localStorage.getItem('healthtracker_log_' + d)
        if (raw) history.push(JSON.parse(raw))
      } catch {}
    }
    if (history.length < 3) return ''
    const goodSleepDays = history.filter(l => l.sleep >= 7).length
    if (goodSleepDays >= 2) {
      return `Your energy tends to peak on days with 7+ hours sleep — you hit that ${goodSleepDays} of the last ${history.length} days. Log tonight to keep tracking the pattern.`
    }
    const goodStepDays = history.filter(l => l.steps >= 8000).length
    if (goodStepDays >= 2) {
      return `You hit 8k+ steps on ${goodStepDays} of the last ${history.length} days. Activity is your strongest habit right now.`
    }
    return `You've logged ${history.length} of the last 7 days. Keep it up — patterns become clear after 5+ days.`
  }

  const todayLogged = log.water > 0 || log.sleep > 0 || log.steps > 0 || log.mood > 0
  const morningBrief = getMorningBrief()

  useEffect(() => {
    setMounted(true)
    const p = getProfile()
    setProfile(p)
    const l = getLog(today())
    setLog(l)
    setStreak(getStreak())
    setScore(healthScore(l))
  }, [])

  function update(field: keyof DayLog, val: any) {
    const next = { ...log, [field]: val }
    setLog(next)
    setScore(healthScore(next))
  }

  function addMeal() {
    if (!mealInput.trim()) return
    update('meals', [...(log.meals ?? []), mealInput.trim()])
    setMealInput('')
  }

  function removeMeal(i: number) {
    update('meals', (log.meals ?? []).filter((_: string, idx: number) => idx !== i))
  }

  async function save() {
    const allowed = await gateIncrement()
    if (!allowed) return
    saveLog(log)
    setStreak(getStreak())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setNarrativeLoading(true)
    setNarrative('')
    try {
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log, profile }),
      })
      const data = await res.json()
      if (data.narrative) setNarrative(data.narrative)
    } catch { /* silent */ }
    finally { setNarrativeLoading(false) }
  }

  async function parseNL() {
    if (!nlText.trim()) return
    setNlParsing(true)
    setNlConfirm(null)
    try {
      const res = await fetch('/api/parse-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlText, profile }),
      })
      const data = await res.json()
      if (data.parsed) setNlConfirm({ parsed: data.parsed, anomalies: data.anomalies || [] })
    } catch { /* silent */ }
    finally { setNlParsing(false) }
  }

  function applyNLParsed() {
    if (!nlConfirm) return
    const p = nlConfirm.parsed
    const next = { ...log }
    if (p.water != null) next.water = p.water
    if (p.sleep != null) next.sleep = p.sleep
    if (p.steps != null) next.steps = p.steps
    if (p.mood != null) next.mood = p.mood
    if (p.exercise != null) next.exercise = p.exercise
    if (p.weight != null) next.weight = p.weight
    if (p.notes) next.notes = p.notes
    if (p.meals && p.meals.length > 0) next.meals = [...(next.meals ?? []), ...p.meals]
    setLog(next)
    setScore(healthScore(next))
    setNlConfirm(null)
    setNlText('')
  }

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? GREEN : score >= 40 ? '#f59e0b' : score >= 20 ? '#f97316' : '#ef4444'
  const r = 52
  const circumference = 2 * Math.PI * r
  const dash = circumference * (score / 100)

  // Animated score counter
  const motionScore = useMotionValue(0)
  const springScore = useSpring(motionScore, { stiffness: 60, damping: 14 })
  const [displayScore, setDisplayScore] = useState(0)
  useEffect(() => {
    const controls = animate(motionScore, score, { duration: 1.2, ease: 'easeOut' })
    const unsubscribe = springScore.on('change', v => setDisplayScore(Math.round(v)))
    return () => { controls.stop(); unsubscribe() }
  }, [score]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return (
    <div style={{ minHeight: '100vh', background: 'var(--background, #f0fdfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(13,148,136,0.2)', borderTopColor: '#0d9488', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!profile) return (
    <>
      <AnimatedHeroGuide />
      <Onboarding onDone={p => { saveProfile(p); setProfile(p) }} />
    </>
  )

  return (
    <>
    {showGate && (
      <RegisterGate
        freeUsed={gateCount}
        freeLimit={7}
        freeFeature="days of tracking"
        lockedFeature="unlimited history + trends + export"
        accentColor="#10b981"
        site="myvitals"
        onSuccess={onRegistered}
        onDismiss={dismissGate}
      />
    )}
    <style>{`
      @keyframes nlpulse{0%,100%{opacity:0.4;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
      @keyframes ring-in{from{stroke-dasharray:0 ${circumference}}to{stroke-dasharray:${dash} ${circumference}}}
      @keyframes dhi-count{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes strip-up{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
      .mv-main{background:transparent;min-height:100vh;color:#0f172a;font-family:inherit}
      .mv-hero{display:grid;grid-template-columns:1fr 250px;gap:20px;align-items:start;padding:18px 20px 14px;max-width:960px;margin:0 auto}
      .mv-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 20px 10px;max-width:960px;margin:0 auto}
      .mv-bottom{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 20px 10px;max-width:960px;margin:0 auto}
      .mv-full{padding:0 20px 10px;max-width:960px;margin:0 auto}
      .mv-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.04)}
      .mv-label{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
      input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:99px;background:#e2e8f0;cursor:pointer;outline:none}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.3);cursor:pointer}
      .mv-compare{display:block}
      @media(max-width:640px){
        .mv-hero{grid-template-columns:1fr;padding:12px 12px 10px}
        .mv-metrics{grid-template-columns:1fr 1fr;gap:6px;padding:0 12px 8px}
        .mv-bottom{grid-template-columns:1fr 1fr;gap:6px;padding:0 12px 8px}
        .mv-full{padding:0 12px 10px}
        .mv-score-col{display:none}
        .mv-card{padding:10px 12px;border-radius:12px}
        .mv-metrics .mv-card:last-child{grid-column:span 2}
      }
    `}</style>

    <div className="mv-main">
      <LiveStatsBar />

      {/* ── HERO: 2-col above fold ─────────────────────────────────── */}
      <div className="mv-hero">

        {/* LEFT: DHI inline + headline + NL log */}
        <div>
          {/* Top bar: brand + streak + date + DHI pill */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:800, color:'#64748b', letterSpacing:'-0.2px' }}>
              My<span style={{ color:GREEN }}>Vitals</span>
            </span>
            {streak > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
                <span style={{ fontSize:12 }}>🔥</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#f59e0b' }}>{streak}d streak</span>
              </div>
            )}
            {/* DHI pill — inline, no separate block */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:`${dhiColor}0d`, border:`1px solid ${dhiColor}30` }}
            >
              <DailyHealthIndexCounter value={dhi} color={dhiColor} compact />
              <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', textTransform:'uppercase' }}>DHI</span>
            </motion.div>
            <span style={{ marginLeft:'auto', fontSize:11, color:'#cbd5e1' }}>
              {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
            </span>
          </div>

          <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px', lineHeight:1.2, marginBottom:5 }}>
            {headline}
          </h1>
          <p style={{ fontSize:12, color:'#64748b', marginBottom:12, lineHeight:1.55 }}>
            {!todayLogged && (morningBrief || subheadline)}
            {todayLogged && subheadline}
          </p>

          {/* NL Quick Log */}
          <div id="nl-quick-log" style={{ background:'#fff', border:`1px solid ${GREEN}20`, borderRadius:14, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <p className="mv-label" style={{ marginBottom:0 }}>✨ AI Quick Log</p>
              <span style={{ fontSize:10, color:'rgba(52,211,153,0.5)', fontWeight:600 }}>type → AI fills fields</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={nlText}
                onChange={e => setNlText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && parseNL()}
                placeholder='e.g. "8k steps, 7h sleep, oats, feeling good"'
                style={{ flex:1, minWidth:0, padding:'11px 14px', borderRadius:10, fontSize:14, color:'#0f172a', background:'#f8fafc', border:'1px solid #e2e8f0', outline:'none', fontFamily:'inherit' }}
              />
              <button onClick={parseNL} disabled={nlParsing || !nlText.trim()}
                style={{ flexShrink:0, padding:'11px 18px', borderRadius:10, fontWeight:700, fontSize:14, cursor: nlParsing || !nlText.trim() ? 'not-allowed' : 'pointer', border:'none', background: nlText.trim() ? `linear-gradient(135deg,${GREEN},${TEAL})` : '#f1f5f9', color: nlText.trim() ? '#000' : '#cbd5e1', transition:'all 0.2s', minHeight:44 }}>
                {nlParsing ? '…' : 'AI →'}
              </button>
            </div>
            {!nlConfirm && !nlText && (
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                {[
                  '8k steps, 7h sleep, oats, good mood',
                  'barely moved, 5h sleep, stressed',
                  '10k steps, 8h sleep, salad, feeling great',
                ].map(ex => (
                  <button key={ex} onClick={() => setNlText(ex)}
                    style={{ padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer', border:'1px solid rgba(52,211,153,0.35)', background:'rgba(52,211,153,0.15)', color:'#a7f3d0', fontFamily:'inherit', transition:'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(52,211,153,0.25)'; (e.currentTarget as HTMLButtonElement).style.color='#d1fae5' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(52,211,153,0.15)'; (e.currentTarget as HTMLButtonElement).style.color='#a7f3d0' }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
            {nlConfirm && (
              <div style={{ marginTop:12 }} className="animate-fade-in">
                {nlConfirm.anomalies.length > 0 && (
                  <div style={{ marginBottom:8, padding:'8px 12px', borderRadius:8, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
                    <p style={{ fontSize:11, color:'#f59e0b', fontWeight:700, marginBottom:3 }}>⚠️ AI flagged — please confirm:</p>
                    {nlConfirm.anomalies.map((a, i) => <p key={i} style={{ fontSize:12, color:'#64748b' }}>• {a}</p>)}
                  </div>
                )}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  {Object.entries(nlConfirm.parsed).filter(([, v]) => v != null && (Array.isArray(v) ? (v as any[]).length > 0 : true)).map(([k, v]) => (
                    <ConfirmPill key={k} field={k} value={v} />
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={applyNLParsed} style={{ flex:1, padding:'9px', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer', border:'none', background:`linear-gradient(135deg,${GREEN},${TEAL})`, color:'#000' }}>
                    ✓ Apply
                  </button>
                  <button onClick={() => setNlConfirm(null)} style={{ padding:'9px 14px', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer', border:'1px solid #e2e8f0', background:'transparent', color:'#64748b' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Narrative (post-save) */}
          {(narrativeLoading || narrative) && (
            <motion.div
              style={{ marginTop:12, padding:'12px 14px', borderRadius:12, background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.15)', display:'flex', gap:10, alignItems:'flex-start' }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🩺</span>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:GREEN, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>AI Coach</p>
                {narrativeLoading
                  ? <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                      {[0, 0.15, 0.3].map((d, i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:GREEN, animation:`nlpulse 1.2s ease-in-out ${d}s infinite` }} />)}
                    </div>
                  : <p style={{ fontSize:13, color:'#0f172a', lineHeight:1.6 }}>{narrative}</p>
                }
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT: wellness score ring */}
        <div id="wellness-score" className="mv-score-col" style={{ background:'#fff', border:`1px solid ${GREEN}18`, borderRadius:16, padding:'14px 12px', textAlign:'center', position:'sticky', top:16 }}>
          <p className="mv-label" style={{ marginBottom:8 }}>Today&apos;s Wellness</p>
          <svg width={130} height={130} viewBox="0 0 160 160" style={{ display:'block', margin:'0 auto' }}>
            <circle cx={80} cy={80} r={r} fill="none" stroke="#f8fafc" strokeWidth={12} />
            <circle cx={80} cy={80} r={r} fill="none" stroke={scoreColor} strokeWidth={12} opacity={0.12} strokeDasharray={`${circumference} 0`} />
            <circle cx={80} cy={80} r={r} fill="none" stroke={scoreColor} strokeWidth={12}
              strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
              transform="rotate(-90 80 80)"
              style={{ transition:'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s',
                filter:`drop-shadow(0 0 8px ${scoreColor}60)` }} />
            <text x={80} y={74} textAnchor="middle" fill="#fff" fontSize={36} fontWeight={800}>{displayScore}</text>
            <text x={80} y={92} textAnchor="middle" fill="#94a3b8" fontSize={13}>/100</text>
          </svg>
          <p style={{ fontSize:13, color:scoreColor, fontWeight:700, marginTop:10, marginBottom:16 }}>
            {score >= 80 ? 'Excellent day' : score >= 60 ? 'Good progress' : score >= 40 ? 'Keep going' : score >= 20 ? 'Getting started' : 'Log your day'}
          </p>
          {/* 5 mini metric bars */}
          {[
            { icon:'💧', label:'Water', v:log.water, max:8, color:'#38bdf8', fmt:(v:number)=>`${v} gl` },
            { icon:'😴', label:'Sleep', v:log.sleep, max:8, color:'#10b981', fmt:(v:number)=>`${v}h` },
            { icon:'👟', label:'Steps', v:log.steps, max:10000, color:GREEN, fmt:(v:number)=>v>=1000?`${(v/1000).toFixed(1)}k`:String(v) },
            { icon:'😊', label:'Mood', v:log.mood, max:5, color:'#f472b6', fmt:(v:number)=>`${v}/5` },
            { icon:'🏃', label:'Exercise', v:log.exercise, max:30, color:'#fb923c', fmt:(v:number)=>`${v}m` },
          ].map(m => (
            <div key={m.label} style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11, color:'#64748b' }}>{m.icon} {m.label}</span>
                <span style={{ fontSize:11, fontWeight:700, color: Math.min(m.v/m.max,1)>=1 ? m.color : '#94a3b8' }}>{m.fmt(m.v)}</span>
              </div>
              <div style={{ height:3, borderRadius:99, background:'#e2e8f0', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min((m.v/m.max)*100,100)}%`, background:m.color, borderRadius:99, transition:'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── GOAL PROGRESS BARS ─────────────────────────────────────── */}
      <GoalProgressBars log={log} profile={profile} />

      {/* ── METRIC INPUTS: 2-col compact grid ─────────────────────── */}
      <div className="mv-metrics">
        {/* Water */}
        <motion.div className="mv-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>💧 Water</span>
            <span style={{ fontSize:18, fontWeight:800, color:'#10b981' }}>{log.water} <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>gl</span></span>
          </div>
          <input type="range" min={0} max={12} value={log.water} onChange={e => update('water', parseInt(e.target.value))} style={{ accentColor:'#10b981' }} />
          <div style={{ display:'flex', gap:4, marginTop:8, flexWrap:'wrap' }}>
            {[2,4,6,8].map(n => (
              <button key={n} onClick={() => update('water', n)} style={{ padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${log.water===n?'#10b981':'#e2e8f0'}`, background:log.water===n?'rgba(16,185,129,0.12)':'transparent', color:log.water===n?'#10b981':'#94a3b8', minHeight:28 }}>{n}</button>
            ))}
          </div>
        </motion.div>

        {/* Sleep */}
        <motion.div className="mv-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.10, ease: [0.23, 1, 0.32, 1] }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>😴 Sleep</span>
            <span style={{ fontSize:18, fontWeight:800, color:'#818cf8' }}>{log.sleep}<span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>h</span></span>
          </div>
          <input type="range" min={0} max={12} step={0.5} value={log.sleep} onChange={e => update('sleep', parseFloat(e.target.value))} style={{ accentColor:'#818cf8' }} />
          <p style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
            {log.sleep >= 7 && log.sleep <= 9 ? '✅ Optimal' : log.sleep < 6 && log.sleep > 0 ? '⚠️ Below 7h' : log.sleep > 9 ? '💤 Slightly long' : ''}
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div className="mv-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>👟 Steps</span>
            <span style={{ fontSize:11, color:GREEN, fontWeight:700 }}>{log.steps >= 10000 ? '✓ Goal' : `${Math.round((log.steps/10000)*100)}%`}</span>
          </div>
          <input type="number" value={log.steps || ''} placeholder="0"
            onChange={e => update('steps', parseInt(e.target.value) || 0)}
            style={{ width:'100%', padding:'8px 12px', fontSize:20, fontWeight:800, borderRadius:9, background:'#f8fafc', border:`1px solid rgba(52,211,153,0.18)`, color:'#0f172a', outline:'none', boxSizing:'border-box', marginBottom:8 }} />
          <div style={{ height:3, borderRadius:99, background:'#f1f5f9', overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${GREEN},${TEAL})`, width:`${Math.min((log.steps/10000)*100,100)}%`, borderRadius:99, transition:'width 0.5s' }} />
          </div>
        </motion.div>

        {/* Exercise */}
        <motion.div className="mv-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.20, ease: [0.23, 1, 0.32, 1] }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>🏃 Exercise</span>
            <span style={{ fontSize:18, fontWeight:800, color:'#fb923c' }}>{log.exercise}<span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>m</span></span>
          </div>
          <input type="range" min={0} max={120} step={5} value={log.exercise} onChange={e => update('exercise', parseInt(e.target.value))} style={{ accentColor:'#fb923c' }} />
          <div style={{ display:'flex', gap:4, marginTop:8 }}>
            {[0,15,30,60].map(n => (
              <button key={n} onClick={() => update('exercise', n)} style={{ flex:1, padding:'3px 4px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${log.exercise===n?'#fb923c':'rgba(251,146,60,0.15)'}`, background:log.exercise===n?'rgba(251,146,60,0.18)':'transparent', color:log.exercise===n?'#fb923c':'rgba(251,146,60,0.4)', minHeight:28 }}>
                {n === 0 ? 'Rest' : `${n}m`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Mood */}
        <motion.div className="mv-card" style={{ gridColumn:'span 2' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}>
          <p className="mv-label">😊 Mood</p>
          <div style={{ display:'flex', gap:8 }}>
            {([1,2,3,4,5] as const).map(m => (
              <button key={m} onClick={() => update('mood', m)}
                style={{ flex:'1 1 0', padding:'10px 6px', borderRadius:10, cursor:'pointer', border:`2px solid ${log.mood===m?MOOD_COLORS[m]:'#f1f5f9'}`, background:log.mood===m?`${MOOD_COLORS[m]}18`:'#f8fafc', color:log.mood===m?MOOD_COLORS[m]:'#64748b', fontSize:12, fontWeight:log.mood===m?700:400, textAlign:'center', transition:'all 0.2s', minHeight:44 }}>
                {MOOD_LABELS[m]}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── MEALS + NOTES: 2-col ───────────────────────────────────── */}
      <div className="mv-bottom">
        {/* Meals — compact chip input */}
        <div className="mv-card">
          <p className="mv-label">🍽️ Meals</p>
          <div style={{ display:'flex', gap:6 }}>
            <input value={mealInput} onChange={e => setMealInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMeal()}
              placeholder="Add meal…"
              style={{ flex:1, padding:'8px 12px', borderRadius:9, fontSize:13, color:'#0f172a', background:'#f8fafc', border:'1px solid rgba(167,139,250,0.2)', outline:'none', minHeight:36 }} />
            <button onClick={addMeal} style={{ padding:'8px 12px', borderRadius:9, background:'rgba(167,139,250,0.18)', border:'1px solid rgba(167,139,250,0.28)', color:'#a78bfa', fontWeight:700, fontSize:15, cursor:'pointer', minHeight:36 }}>+</button>
          </div>
          {(log.meals ?? []).length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
              {(log.meals ?? []).map((m: string, i: number) => (
                <span key={i} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px 3px 10px', borderRadius:20, background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.18)', fontSize:11, color:'#c4b5fd' }}>
                  {m}
                  <button onClick={() => removeMeal(i)} style={{ background:'none', border:'none', color:'rgba(167,139,250,0.5)', cursor:'pointer', padding:'0 0 0 2px', fontSize:13, lineHeight:1 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mv-card">
          <p className="mv-label">📝 Notes</p>
          <textarea value={log.notes ?? ''} onChange={e => update('notes', e.target.value)}
            placeholder="Energy, stress, symptoms…"
            rows={3}
            style={{ width:'100%', padding:'8px 12px', borderRadius:9, fontSize:13, color:'#0f172a', resize:'none', background:'#f8fafc', border:'1px solid #e2e8f0', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* ── SAVE + AI CTA ──────────────────────────────────────────── */}
      <div className="mv-full" style={{ display:'flex', gap:10, alignItems:'stretch' }}>
        <motion.button id="save-btn" onClick={save} whileTap={{ scale: 0.97 }} style={{
          flex:1, padding:'14px', borderRadius:14, fontWeight:700, fontSize:16, cursor:'pointer',
          background: saved ? 'rgba(52,211,153,0.12)' : `linear-gradient(135deg,${GREEN},${TEAL})`,
          color: saved ? GREEN : '#000', border: saved ? `1px solid ${GREEN}30` : 'none',
          boxShadow: saved ? 'none' : '0 0 20px rgba(52,211,153,0.2)',
          transition:'background 0.3s, color 0.3s, border 0.3s, box-shadow 0.3s',
        }}>
          {saved ? '✓ Saved! Getting AI summary…' : ctaLabel}
        </motion.button>
        <a id="ai-insight-cta" href="/insights" style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8, padding:'14px 18px', borderRadius:14, textDecoration:'none', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.18)', color:GREEN, fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>
          🩺 Weekly insight →
        </a>
      </div>

      {/* Promo code link */}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(15,118,110,0.7)', marginTop: 4 }}>
        Have a promo code? <a href="#promo" style={{ color: GREEN, textDecoration: 'underline' }}>Apply it →</a>
      </p>

      {/* ── 3-TAP MOBILE LOG STRIP ────────────────────────────────── */}
      <QuickLogStrip log={log} onUpdate={update} accent={GREEN} />

      <GuidedTour steps={TOUR_STEPS} storageKey="myvitals_tour_v1" accentColor={GREEN} delay={800} />

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(52,211,153,0.07)', padding:'16px 24px' }}>
        <div style={{ maxWidth:960, margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <span style={{ fontWeight:900, fontSize:13, color:GREEN }}>MyVitals</span>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[['Privacy','/privacy'],['Terms','/terms'],['About','/about']].map(([label,href]) => (
              <a key={label} href={href} style={{ fontSize:11, color:'#94a3b8', textDecoration:'none' }}
                onMouseOver={e=>(e.currentTarget.style.color=GREEN)} onMouseOut={e=>(e.currentTarget.style.color='#94a3b8')}>{label}</a>
            ))}
          </div>
          <p style={{ fontSize:10, color:'#e2e8f0' }}>© 2026 MyVitals</p>
        </div>
      </footer>

    </div>
    <MyVitalsCookieBanner green={GREEN} />
    <FloatingChat />
    </>
  )
}

// ── Daily Health Index animated counter ────────────────────────────────────
function DailyHealthIndexCounter({ value, color, compact }: { value: number; color: string; compact?: boolean }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 50, damping: 14 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 1.4, ease: 'easeOut' })
    const unsub = spring.on('change', v => setDisplay(Math.round(v)))
    return () => { controls.stop(); unsub() }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  if (compact) {
    return (
      <span style={{ fontSize:18, fontWeight:900, color, fontVariantNumeric:'tabular-nums', textShadow:`0 0 12px ${color}60` }}>
        {display}
      </span>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      <span style={{ fontSize:64, fontWeight:900, color, lineHeight:1, display:'block',
        textShadow:`0 0 30px ${color}60`, fontVariantNumeric:'tabular-nums' }}>
        {display}
      </span>
    </motion.div>
  )
}

// ── 3-tap Quick Log Strip (mobile) ─────────────────────────────────────────
function QuickLogStrip({ log, onUpdate, accent }: { log: DayLog; onUpdate: (f: keyof DayLog, v: any) => void; accent: string }) {
  const [active, setActive] = useState<string | null>(null)
  const [tempVal, setTempVal] = useState(0)

  const items = [
    { key: 'water', emoji: '💧', label: 'Water', min: 0, max: 12, step: 1, current: log.water, unit: 'gl' },
    { key: 'sleep', emoji: '😴', label: 'Sleep', min: 0, max: 12, step: 0.5, current: log.sleep, unit: 'h' },
    { key: 'steps', emoji: '👟', label: 'Steps', min: 0, max: 20000, step: 500, current: log.steps, unit: 'k' },
    { key: 'mood', emoji: '😊', label: 'Mood', min: 1, max: 10, step: 1, current: log.mood, unit: '/10' },
  ]

  function openItem(key: string, current: number) {
    setActive(key)
    setTempVal(current)
  }

  function confirm() {
    if (!active) return
    onUpdate(active as keyof DayLog, tempVal)
    setActive(null)
  }

  const activeItem = items.find(i => i.key === active)

  return (
    <>
      <style>{`
        @media(min-width:641px){.quick-log-strip{display:none!important}}
        @keyframes strip-slide-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

      {/* Overlay picker */}
      {active && activeItem && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:900, display:'flex', alignItems:'flex-end' }}
          onClick={() => setActive(null)}
        >
          <motion.div
            initial={{ y: 200 }} animate={{ y: 0 }} transition={{ type:'spring', stiffness:400, damping:35 }}
            onClick={e => e.stopPropagation()}
            style={{ width:'100%', background:'#fff', borderTop:`2px solid ${accent}30`, borderRadius:'20px 20px 0 0', padding:'20px 24px 32px' }}
          >
            <div style={{ width:36, height:4, borderRadius:99, background:'#e2e8f0', margin:'0 auto 16px' }} />
            <p style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#64748b', marginBottom:6 }}>
              {activeItem.emoji} {activeItem.label}
            </p>
            <p style={{ textAlign:'center', fontSize:48, fontWeight:900, color:accent, marginBottom:16 }}>
              {activeItem.key === 'steps' ? `${(tempVal/1000).toFixed(1)}k` : tempVal}{activeItem.unit}
            </p>
            <input type="range" min={activeItem.min} max={activeItem.max} step={activeItem.step} value={tempVal}
              onChange={e => setTempVal(activeItem.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
              style={{ width:'100%', accentColor:accent, marginBottom:16 }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setActive(null)} style={{ flex:1, padding:'13px', borderRadius:12, border:'1px solid #e2e8f0', background:'transparent', color:'#64748b', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={confirm} style={{ flex:2, padding:'13px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${accent},${accent}cc)`, color:'#000', fontWeight:800, fontSize:14, cursor:'pointer' }}>
                Save {activeItem.emoji}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Fixed strip */}
      <div className="quick-log-strip" style={{
        position:'fixed', bottom:60, left:0, right:0, zIndex:800,
        background:'#fff', backdropFilter:'blur(16px)',
        borderTop:`1px solid ${accent}18`,
        padding:'10px 16px 10px',
        display:'flex', gap:6,
        animation:'strip-slide-up 0.3s cubic-bezier(0.23,1,0.32,1) both'
      }}>
        {items.map(item => (
          <button key={item.key} onClick={() => openItem(item.key, item.current)}
            style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              padding:'8px 4px', borderRadius:12,
              border:`1px solid ${item.current > 0 ? accent + '30' : '#e2e8f0'}`,
              background:item.current > 0 ? `${accent}0a` : '#f8fafc',
              cursor:'pointer', transition:'all 0.15s'
            }}
          >
            <span style={{ fontSize:18 }}>{item.emoji}</span>
            <span style={{ fontSize:10, fontWeight:700, color:item.current > 0 ? accent : '#94a3b8' }}>
              {item.key === 'steps' && item.current > 0 ? `${(item.current/1000).toFixed(1)}k` : item.current > 0 ? `${item.current}${item.unit}` : '+'}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hi! I\'m your MyVitals AI coach 🩺 Ask me anything about your health tracking.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user' as const, content: input.trim() }
    const next = [...msgs, userMsg]
    setMsgs(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) })
      const data = await res.json()
      if (data.content) setMsgs(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Sorry, try again?' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:1000 }}>
      {open && (
        <div style={{ width:320, height:400, background:'#fff', border:`1px solid ${GREEN}28`, borderRadius:20, display:'flex', flexDirection:'column', marginBottom:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(52,211,153,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:800, fontSize:13, color:GREEN }}>🩺 AI Coach</span>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:18 }}>×</button>
          </div>
          <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'85%', padding:'8px 12px', borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px', background:m.role==='user'?`linear-gradient(135deg,${GREEN},${TEAL})`:'#f1f5f9', color:m.role==='user'?'#000':'#0f172a', fontSize:13, lineHeight:1.5, fontWeight:m.role==='user'?600:400 }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', gap:4, padding:'8px 12px', background:'#f1f5f9', borderRadius:'14px 14px 14px 4px', alignSelf:'flex-start' }}>
                {[0,0.15,0.3].map((d,i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:GREEN, opacity:0.6, animation:`nlpulse 1.2s ease-in-out ${d}s infinite` }} />)}
              </div>
            )}
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(52,211,153,0.1)', display:'flex', gap:8 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask your coach…" style={{ flex:1, padding:'9px 12px', borderRadius:10, fontSize:13, color:'#0f172a', background:'#f8fafc', border:'1px solid #e2e8f0', outline:'none', fontFamily:'inherit' }} />
            <button onClick={send} disabled={loading||!input.trim()} style={{ padding:'9px 14px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', border:'none', background:input.trim()?`linear-gradient(135deg,${GREEN},${TEAL})`:'#f1f5f9', color:input.trim()?'#000':'#cbd5e1' }}>→</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg,${GREEN},${TEAL})`, border:'none', cursor:'pointer', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(52,211,153,0.4)', marginLeft:'auto' }}>
        {open ? '×' : '🩺'}
      </button>
    </div>
  )
}

function MyVitalsCookieBanner({ green }: { green: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem('mv_cookie_ok')) setVisible(true)
  }, [])
  if (!visible) return null
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', backdropFilter:'blur(12px)', borderTop:'1px solid rgba(52,211,153,0.12)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, zIndex:999, flexWrap:'wrap' }}>
      <p style={{ fontSize:12, color:'#64748b', margin:0 }}>We use local storage only — no cookies, no tracking. <a href="/privacy" style={{ color:green, textDecoration:'none' }}>Privacy policy</a></p>
      <button onClick={() => { localStorage.setItem('mv_cookie_ok','1'); setVisible(false) }} style={{ padding:'7px 16px', borderRadius:8, background:green, border:'none', color:'#000', fontWeight:700, fontSize:12, cursor:'pointer', flexShrink:0 }}>Got it</button>
    </div>
  )
}

function ConfirmPill({ field, value }: { field: string; value: any }) {
  const labels: Record<string, string> = { water:'💧', sleep:'😴', steps:'👟', mood:'😊', exercise:'🏃', weight:'⚖️', notes:'📝', meals:'🍽️' }
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', fontSize:12, color:'#475569' }}>
      {labels[field] ?? '•'} <strong style={{ color:'#0f172a' }}>{field}</strong>: {display}
    </span>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// ── Manual Onboarding ───────────────────────────────────────────────────────
function ManualOnboarding({ onDone }: { onDone: (p: HealthProfile) => void }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', age: 25, gender: 'other' as HealthProfile['gender'], heightCm: 170, weightKg: 70, goals: [] as string[] })

  const GOAL_OPTIONS = ['Lose weight','Build muscle','Improve sleep','Increase energy','Reduce stress','Improve nutrition','Run a 5k','General health']

  function toggleGoal(g: string) {
    setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }))
  }

  function submit() {
    onDone({ ...form, goals: form.goals.length ? form.goals : ['general health'] })
  }

  const steps = [
    // Step 0: Name + age
    <div key="step0" style={{ maxWidth:480, margin:'0 auto', padding:'0 20px' }}>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#0ea5e9,#38bdf8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22, boxShadow:'0 0 24px rgba(14,165,233,0.28)' }}>💙</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Let&apos;s set up your profile</h2>
        <p style={{ fontSize:13, color:'#64748b' }}>Takes 30 seconds. No account needed.</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Your name</label>
          <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Alex"
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#0f172a', background:'#f8fafc', border:'1px solid #e2e8f0', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Age</label>
          <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) || 25 }))} min={13} max={120}
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#0f172a', background:'#f8fafc', border:'1px solid #e2e8f0', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Gender</label>
          <div style={{ display:'flex', gap:8 }}>
            {(['male','female','other'] as const).map(g => (
              <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                style={{ flex:1, padding:'11px', borderRadius:10, cursor:'pointer', border:`2px solid ${form.gender===g?'#0ea5e9':'#e2e8f0'}`, background:form.gender===g?'rgba(14,165,233,0.12)':'#f8fafc', color:form.gender===g?'#0ea5e9':'#64748b', fontWeight:600, fontSize:13, textTransform:'capitalize', transition:'all 0.15s' }}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => form.name.trim() && setStep(1)} disabled={!form.name.trim()}
          style={{ marginTop:8, padding:'15px', borderRadius:14, fontWeight:800, fontSize:16, cursor:form.name.trim()?'pointer':'not-allowed', border:'none', background:form.name.trim()?'linear-gradient(135deg,#0ea5e9,#38bdf8)':'#f1f5f9', color:form.name.trim()?'#000':'#cbd5e1', transition:'all 0.2s', boxShadow:form.name.trim()?'0 0 24px rgba(14,165,233,0.28)':'none' }}>
          Continue →
        </button>
      </div>
    </div>,

    // Step 1: Height + weight
    <div key="step1" style={{ maxWidth:480, margin:'0 auto', padding:'0 20px' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Body metrics</h2>
        <p style={{ fontSize:13, color:'#64748b' }}>Used to personalise your wellness score.</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Height (cm)</label>
          <input type="number" value={form.heightCm} onChange={e => setForm(f => ({ ...f, heightCm: parseInt(e.target.value) || 170 }))} min={100} max={250}
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#0f172a', background:'#f8fafc', border:'1px solid #e2e8f0', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Weight (kg)</label>
          <input type="number" value={form.weightKg} onChange={e => setForm(f => ({ ...f, weightKg: parseInt(e.target.value) || 70 }))} min={30} max={300}
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#0f172a', background:'#f8fafc', border:'1px solid #e2e8f0', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setStep(0)} style={{ flex:'0 0 auto', padding:'15px 20px', borderRadius:14, fontWeight:700, fontSize:15, cursor:'pointer', border:'1px solid #e2e8f0', background:'transparent', color:'#64748b' }}>← Back</button>
          <button onClick={() => setStep(2)} style={{ flex:1, padding:'15px', borderRadius:14, fontWeight:800, fontSize:16, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#0ea5e9,#38bdf8)', color:'#000', boxShadow:'0 0 24px rgba(14,165,233,0.28)' }}>Continue →</button>
        </div>
      </div>
    </div>,

    // Step 2: Goals
    <div key="step2" style={{ maxWidth:480, margin:'0 auto', padding:'0 20px' }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Health goals</h2>
        <p style={{ fontSize:13, color:'#64748b' }}>Pick all that apply. AI tailors insights to your goals.</p>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
        {GOAL_OPTIONS.map(g => (
          <button key={g} onClick={() => toggleGoal(g)}
            style={{ padding:'8px 14px', borderRadius:20, cursor:'pointer', border:`1.5px solid ${form.goals.includes(g)?'#0ea5e9':'#e2e8f0'}`, background:form.goals.includes(g)?'rgba(14,165,233,0.12)':'#f8fafc', color:form.goals.includes(g)?'#0ea5e9':'#64748b', fontSize:13, fontWeight:form.goals.includes(g)?700:400, transition:'all 0.15s' }}>
            {g}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => setStep(1)} style={{ flex:'0 0 auto', padding:'15px 20px', borderRadius:14, fontWeight:700, fontSize:15, cursor:'pointer', border:'1px solid #e2e8f0', background:'transparent', color:'#64748b' }}>← Back</button>
        <button onClick={submit} style={{ flex:1, padding:'15px', borderRadius:14, fontWeight:800, fontSize:16, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#0ea5e9,#38bdf8)', color:'#000', boxShadow:'0 0 24px rgba(14,165,233,0.28)' }}>
          Start tracking 🚀
        </button>
      </div>
    </div>,
  ]

  return (
    <div style={{ minHeight:'calc(100vh - 58px)', display:'flex', flexDirection:'column', justifyContent:'center', paddingBottom:40 }}>
      {/* Progress dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:32 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:i===step?24:6, height:6, borderRadius:99, background:i===step?'#34d399':i<step?'rgba(52,211,153,0.4)':'#e2e8f0', transition:'all 0.3s' }} />
        ))}
      </div>
      {steps[step]}
    </div>
  )
}

// ── AI Chat Onboarding ─────────────────────────────────────────────────────────
type ChatMsg = { role: 'user' | 'assistant'; content: string }

function AIChatOnboarding({ onDone }: { onDone: (p: HealthProfile) => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "Hi! I'm your MyVitals health coach 👋 Let's get you set up in 30 seconds.\n\nWhat's your name and how old are you?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<any>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: ChatMsg = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) })
      const data = await res.json()
      setExtracted(data)
      if (data.complete) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Perfect! Here's what I've got:\n\n👤 ${data.name}, ${data.age} years old\n🎯 Goals: ${(data.goals||[]).join(', ')}\n\nReady to start?` }])
      } else if (data.nextQuestion) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.nextQuestion }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, try again?' }])
    }
    setLoading(false)
  }

  function confirmAndStart() {
    onDone({
      name: extracted.name || 'Friend',
      age: extracted.age || 30,
      gender: extracted.gender || 'other',
      heightCm: extracted.heightCm || 170,
      weightKg: extracted.weightKg || 70,
      goals: extracted.goals?.length ? extracted.goals : ['general health'],
    })
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 58px)', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22, boxShadow: '0 0 24px rgba(14,165,233,0.28)' }}>💙</div>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My<span style={{ color: GREEN }}>Vitals</span> <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>— Setup</span></p>
      </div>
      <div ref={scrollRef} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? `linear-gradient(135deg, ${GREEN}, ${TEAL})` : '#f1f5f9', color: m.role === 'user' ? '#000' : '#0f172a', fontSize: 14, lineHeight: 1.55, fontWeight: m.role === 'user' ? 600 : 400, whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '10px 14px', background: '#f1f5f9', borderRadius: '16px 16px 16px 4px', alignSelf: 'flex-start' }}>
            {[0, 0.15, 0.3].map((d, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, opacity: 0.6, animation: `nlpulse 1.2s ease-in-out ${d}s infinite` }} />)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type your answer…" style={{ flex: 1, padding: '13px 16px', borderRadius: 12, fontSize: 15, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ padding: '13px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', background: input.trim() ? `linear-gradient(135deg, ${GREEN}, ${TEAL})` : '#f1f5f9', color: input.trim() ? '#000' : '#cbd5e1', transition: 'all 0.2s' }}>Send
        </button>
      </div>
      {extracted.complete && (
        <button onClick={confirmAndStart} className="animate-fade-in" style={{ width: '100%', padding: 15, borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', border: 'none', background: `linear-gradient(135deg, ${GREEN}, ${TEAL})`, color: '#000', boxShadow: '0 0 28px rgba(14,165,233,0.28)', marginBottom: 10 }}>
          Start tracking my health 🚀
        </button>
      )}
      <style>{`@keyframes nlpulse{0%,100%{opacity:0.4;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )
}

// ── Onboarding: AI chat first, form toggle ─────────────────────────────────────
function Onboarding({ onDone }: { onDone: (p: HealthProfile) => void }) {
  const [mode, setMode] = useState<'chat' | 'manual'>('chat')
  return (
    <div>
      {mode === 'chat'
        ? <>
            <AIChatOnboarding onDone={onDone} />
            <div style={{ textAlign: 'center', paddingBottom: 20, marginTop: -10 }}>
              <button onClick={() => setMode('manual')} style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Prefer a form instead?</button>
            </div>
          </>
        : <>
            <ManualOnboarding onDone={onDone} />
            <div style={{ textAlign: 'center', paddingBottom: 20 }}>
              <button onClick={() => setMode('chat')} style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Use AI chat instead?</button>
            </div>
          </>
      }
    </div>
  )
}
