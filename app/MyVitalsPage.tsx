'use client'
import { useState, useEffect, useRef } from 'react'
import AnimatedHeroGuide from '@/components/AnimatedHeroGuide'
import { getProfile, getLog, saveLog, saveProfile, today, getStreak, healthScore } from '@/lib/storage'
import type { HealthProfile, DayLog } from '@/lib/types'
import { MOOD_LABELS, MOOD_COLORS } from '@/lib/types'
import GuidedTour, { type TourStep } from '@/components/GuidedTour'
import { useGate } from '@/lib/shared/useGate'
import RegisterGate from '@/lib/shared/RegisterGate'
import type { ContentOverrides } from '@/lib/content'

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

const GREEN = '#34d399'
const TEAL = '#10b981'

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

  const headline = overrides.headline ?? 'Track your health.'
  const ctaLabel = overrides.cta ?? "Save Today's Log"

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

  if (!mounted) return null
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
      .mv-main{background:#070d0a;min-height:100vh;color:#fff;font-family:inherit}
      .mv-hero{display:grid;grid-template-columns:1fr 260px;gap:24px;align-items:start;padding:28px 24px 20px;max-width:960px;margin:0 auto}
      .mv-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 24px 16px;max-width:960px;margin:0 auto}
      .mv-bottom{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 24px 16px;max-width:960px;margin:0 auto}
      .mv-full{padding:0 24px 16px;max-width:960px;margin:0 auto}
      .mv-card{background:#0d1a12;border:1px solid rgba(52,211,153,0.1);border-radius:16px;padding:14px 16px}
      .mv-label{font-size:11px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
      input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:99px;background:rgba(255,255,255,0.08);cursor:pointer;outline:none}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 0 8px rgba(52,211,153,0.4);cursor:pointer}
      .mv-compare{display:block}
      @media(max-width:640px){
        .mv-hero{grid-template-columns:1fr;padding:16px 14px 12px}
        .mv-metrics{grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 10px}
        .mv-bottom{grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 10px}
        .mv-full{padding:0 14px 12px}
        .mv-score-col{display:none}
        .mv-card{padding:10px 12px;border-radius:12px}
        .mv-compare{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .mv-compare table{min-width:480px}
        .mv-metrics .mv-card:last-child{grid-column:span 2}
      }
    `}</style>

    <div className="mv-main">

      {/* ── HERO: 2-col above fold ─────────────────────────────────── */}
      <div className="mv-hero">

        {/* LEFT: headline + NL log */}
        <div>
          {/* Streak bar */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <span style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.55)', letterSpacing:'-0.2px' }}>
              My<span style={{ color:GREEN }}>Vitals</span>
            </span>
            {streak > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)' }}>
                <span style={{ fontSize:12 }}>🔥</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#f59e0b' }}>{streak}d streak</span>
              </div>
            )}
            <span style={{ marginLeft:'auto', fontSize:12, color:'rgba(255,255,255,0.25)' }}>
              {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
            </span>
          </div>

          <h1 style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-0.6px', lineHeight:1.2, marginBottom:6 }}>
            {headline}<br /><span style={{ color:GREEN }}>Every single day.</span>
          </h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', marginBottom:16, lineHeight:1.5 }}>
            {greeting()}, <strong style={{ color:'rgba(255,255,255,0.6)' }}>{profile.name}</strong>. Log your day in one sentence.
          </p>

          {/* NL Quick Log */}
          <div id="nl-quick-log" style={{ background:'#0d1a12', border:'1px solid rgba(52,211,153,0.15)', borderRadius:14, padding:'12px 14px' }}>
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
                style={{ flex:1, minWidth:0, padding:'11px 14px', borderRadius:10, fontSize:14, color:'#fff', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', outline:'none', fontFamily:'inherit' }}
              />
              <button onClick={parseNL} disabled={nlParsing || !nlText.trim()}
                style={{ flexShrink:0, padding:'11px 18px', borderRadius:10, fontWeight:700, fontSize:14, cursor: nlParsing || !nlText.trim() ? 'not-allowed' : 'pointer', border:'none', background: nlText.trim() ? `linear-gradient(135deg,${GREEN},${TEAL})` : 'rgba(255,255,255,0.06)', color: nlText.trim() ? '#000' : 'rgba(255,255,255,0.2)', transition:'all 0.2s', minHeight:44 }}>
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
                    style={{ padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer', border:'1px solid rgba(52,211,153,0.18)', background:'rgba(52,211,153,0.05)', color:'rgba(52,211,153,0.6)', fontFamily:'inherit', transition:'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(52,211,153,0.12)'; (e.currentTarget as HTMLButtonElement).style.color='#34d399' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(52,211,153,0.05)'; (e.currentTarget as HTMLButtonElement).style.color='rgba(52,211,153,0.6)' }}
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
                    {nlConfirm.anomalies.map((a, i) => <p key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>• {a}</p>)}
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
                  <button onClick={() => setNlConfirm(null)} style={{ padding:'9px 14px', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'rgba(255,255,255,0.4)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Narrative (post-save) */}
          {(narrativeLoading || narrative) && (
            <div style={{ marginTop:12, padding:'12px 14px', borderRadius:12, background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.15)', display:'flex', gap:10, alignItems:'flex-start' }} className="animate-fade-in">
              <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🩺</span>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:GREEN, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>AI Coach</p>
                {narrativeLoading
                  ? <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                      {[0, 0.15, 0.3].map((d, i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:GREEN, animation:`nlpulse 1.2s ease-in-out ${d}s infinite` }} />)}
                    </div>
                  : <p style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.6 }}>{narrative}</p>
                }
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: wellness score ring */}
        <div id="wellness-score" className="mv-score-col" style={{ background:'#0d1a12', border:'1px solid rgba(52,211,153,0.12)', borderRadius:20, padding:'20px 16px', textAlign:'center', position:'sticky', top:20 }}>
          <p className="mv-label" style={{ marginBottom:12 }}>Today&apos;s Wellness</p>
          <svg width={160} height={160} viewBox="0 0 160 160" style={{ display:'block', margin:'0 auto' }}>
            <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12} />
            <circle cx={80} cy={80} r={r} fill="none" stroke={scoreColor} strokeWidth={12} opacity={0.12} strokeDasharray={`${circumference} 0`} />
            <circle cx={80} cy={80} r={r} fill="none" stroke={scoreColor} strokeWidth={12}
              strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
              transform="rotate(-90 80 80)"
              style={{ transition:'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s',
                filter:`drop-shadow(0 0 8px ${scoreColor}60)` }} />
            <text x={80} y={74} textAnchor="middle" fill="#fff" fontSize={36} fontWeight={800}>{score}</text>
            <text x={80} y={92} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={13}>/100</text>
          </svg>
          <p style={{ fontSize:13, color:scoreColor, fontWeight:700, marginTop:10, marginBottom:16 }}>
            {score >= 80 ? 'Excellent day' : score >= 60 ? 'Good progress' : score >= 40 ? 'Keep going' : score >= 20 ? 'Getting started' : 'Log your day'}
          </p>
          {/* 5 mini metric bars */}
          {[
            { icon:'💧', label:'Water', v:log.water, max:8, color:'#38bdf8', fmt:(v:number)=>`${v} gl` },
            { icon:'😴', label:'Sleep', v:log.sleep, max:8, color:'#818cf8', fmt:(v:number)=>`${v}h` },
            { icon:'👟', label:'Steps', v:log.steps, max:10000, color:GREEN, fmt:(v:number)=>v>=1000?`${(v/1000).toFixed(1)}k`:String(v) },
            { icon:'😊', label:'Mood', v:log.mood, max:5, color:'#f472b6', fmt:(v:number)=>`${v}/5` },
            { icon:'🏃', label:'Exercise', v:log.exercise, max:30, color:'#fb923c', fmt:(v:number)=>`${v}m` },
          ].map(m => (
            <div key={m.label} style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{m.icon} {m.label}</span>
                <span style={{ fontSize:11, fontWeight:700, color: Math.min(m.v/m.max,1)>=1 ? m.color : 'rgba(255,255,255,0.35)' }}>{m.fmt(m.v)}</span>
              </div>
              <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min((m.v/m.max)*100,100)}%`, background:m.color, borderRadius:99, transition:'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── METRIC INPUTS: 2-col compact grid ─────────────────────── */}
      <div className="mv-metrics">
        {/* Water */}
        <div className="mv-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>💧 Water</span>
            <span style={{ fontSize:18, fontWeight:800, color:'#38bdf8' }}>{log.water} <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:400 }}>gl</span></span>
          </div>
          <input type="range" min={0} max={12} value={log.water} onChange={e => update('water', parseInt(e.target.value))} style={{ accentColor:'#38bdf8' }} />
          <div style={{ display:'flex', gap:4, marginTop:8, flexWrap:'wrap' }}>
            {[2,4,6,8].map(n => (
              <button key={n} onClick={() => update('water', n)} style={{ padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${log.water===n?'#38bdf8':'rgba(56,189,248,0.2)'}`, background:log.water===n?'rgba(56,189,248,0.15)':'transparent', color:log.water===n?'#38bdf8':'rgba(56,189,248,0.4)', minHeight:28 }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Sleep */}
        <div className="mv-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>😴 Sleep</span>
            <span style={{ fontSize:18, fontWeight:800, color:'#818cf8' }}>{log.sleep}<span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:400 }}>h</span></span>
          </div>
          <input type="range" min={0} max={12} step={0.5} value={log.sleep} onChange={e => update('sleep', parseFloat(e.target.value))} style={{ accentColor:'#818cf8' }} />
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:6 }}>
            {log.sleep >= 7 && log.sleep <= 9 ? '✅ Optimal' : log.sleep < 6 && log.sleep > 0 ? '⚠️ Below 7h' : log.sleep > 9 ? '💤 Slightly long' : ''}
          </p>
        </div>

        {/* Steps */}
        <div className="mv-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>👟 Steps</span>
            <span style={{ fontSize:11, color:GREEN, fontWeight:700 }}>{log.steps >= 10000 ? '✓ Goal' : `${Math.round((log.steps/10000)*100)}%`}</span>
          </div>
          <input type="number" value={log.steps || ''} placeholder="0"
            onChange={e => update('steps', parseInt(e.target.value) || 0)}
            style={{ width:'100%', padding:'8px 12px', fontSize:20, fontWeight:800, borderRadius:9, background:'rgba(255,255,255,0.04)', border:`1px solid rgba(52,211,153,0.18)`, color:'#fff', outline:'none', boxSizing:'border-box', marginBottom:8 }} />
          <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${GREEN},${TEAL})`, width:`${Math.min((log.steps/10000)*100,100)}%`, borderRadius:99, transition:'width 0.5s' }} />
          </div>
        </div>

        {/* Exercise */}
        <div className="mv-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>🏃 Exercise</span>
            <span style={{ fontSize:18, fontWeight:800, color:'#fb923c' }}>{log.exercise}<span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:400 }}>m</span></span>
          </div>
          <input type="range" min={0} max={120} step={5} value={log.exercise} onChange={e => update('exercise', parseInt(e.target.value))} style={{ accentColor:'#fb923c' }} />
          <div style={{ display:'flex', gap:4, marginTop:8 }}>
            {[0,15,30,60].map(n => (
              <button key={n} onClick={() => update('exercise', n)} style={{ flex:1, padding:'3px 4px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${log.exercise===n?'#fb923c':'rgba(251,146,60,0.15)'}`, background:log.exercise===n?'rgba(251,146,60,0.18)':'transparent', color:log.exercise===n?'#fb923c':'rgba(251,146,60,0.4)', minHeight:28 }}>
                {n === 0 ? 'Rest' : `${n}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mv-card" style={{ gridColumn:'span 2' }}>
          <p className="mv-label">😊 Mood</p>
          <div style={{ display:'flex', gap:8 }}>
            {([1,2,3,4,5] as const).map(m => (
              <button key={m} onClick={() => update('mood', m)}
                style={{ flex:'1 1 0', padding:'10px 6px', borderRadius:10, cursor:'pointer', border:`2px solid ${log.mood===m?MOOD_COLORS[m]:'rgba(255,255,255,0.06)'}`, background:log.mood===m?`${MOOD_COLORS[m]}18`:'rgba(255,255,255,0.02)', color:log.mood===m?MOOD_COLORS[m]:'rgba(255,255,255,0.35)', fontSize:12, fontWeight:log.mood===m?700:400, textAlign:'center', transition:'all 0.2s', minHeight:44 }}>
                {MOOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
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
              style={{ flex:1, padding:'8px 12px', borderRadius:9, fontSize:13, color:'#fff', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(167,139,250,0.2)', outline:'none', minHeight:36 }} />
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
            style={{ width:'100%', padding:'8px 12px', borderRadius:9, fontSize:13, color:'#fff', resize:'none', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* ── SAVE + AI CTA ──────────────────────────────────────────── */}
      <div className="mv-full" style={{ display:'flex', gap:10, alignItems:'stretch' }}>
        <button id="save-btn" onClick={save} style={{
          flex:1, padding:'14px', borderRadius:14, fontWeight:700, fontSize:16, cursor:'pointer',
          background: saved ? 'rgba(52,211,153,0.12)' : `linear-gradient(135deg,${GREEN},${TEAL})`,
          color: saved ? GREEN : '#000', border: saved ? `1px solid ${GREEN}30` : 'none',
          boxShadow: saved ? 'none' : '0 0 20px rgba(52,211,153,0.2)',
          transition:'all 0.3s',
        }}>
          {saved ? '✓ Saved! Getting AI summary…' : ctaLabel}
        </button>
        <a id="ai-insight-cta" href="/insights" style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8, padding:'14px 18px', borderRadius:14, textDecoration:'none', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.18)', color:GREEN, fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>
          🩺 Weekly insight →
        </a>
      </div>

      <GuidedTour steps={TOUR_STEPS} storageKey="myvitals_tour_v1" accentColor={GREEN} delay={800} />

      {/* ── Competitor comparison (compact) ───────────────────────── */}
      <section className="mv-compare" style={{ borderTop:'1px solid rgba(52,211,153,0.08)', padding:'32px 24px', maxWidth:960, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <p style={{ fontSize:10, color:'rgba(52,211,153,0.4)', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:6 }}>How we compare</p>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#f0fdf4' }}>MyVitals vs alternatives</h2>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(52,211,153,0.12)' }}>
                {['Feature','MyVitals','MyFitnessPal','Apple Health','Cronometer'].map((h,i) => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:i===0?'left':'center', color:i===1?GREEN:'rgba(255,255,255,0.22)', fontWeight:700, fontSize:10, letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['AI natural language logging','✅ Built-in','❌','❌','❌'],
                ['No account required','✅','❌','❌','❌'],
                ['AI weekly insights','✅','❌','❌','❌'],
                ['Mood + sleep + steps tracking','✅ All-in-one','⚠️ Steps only','✅','⚠️ Nutrition focus'],
                ['Works offline','✅','⚠️','✅','⚠️'],
                ['Cost','Free','Free / $10 mo','Free (iPhone)','Free / $9 mo'],
              ].map(row => (
                <tr key={row[0]} style={{ borderBottom:'1px solid rgba(52,211,153,0.05)' }}>
                  {row.map((cell,i) => (
                    <td key={i} style={{ padding:'7px 10px', textAlign:i===0?'left':'center', color:i===1?GREEN:i===0?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.22)', background:i===1?'rgba(52,211,153,0.03)':'transparent', fontSize:11 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(52,211,153,0.07)', padding:'16px 24px' }}>
        <div style={{ maxWidth:960, margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <span style={{ fontWeight:900, fontSize:13, color:GREEN }}>MyVitals</span>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[['Privacy','/privacy'],['Terms','/terms'],['About','/about']].map(([label,href]) => (
              <a key={label} href={href} style={{ fontSize:11, color:'rgba(255,255,255,0.22)', textDecoration:'none' }}
                onMouseOver={e=>(e.currentTarget.style.color=GREEN)} onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.22)')}>{label}</a>
            ))}
          </div>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.12)' }}>© 2026 MyVitals</p>
        </div>
      </footer>

    </div>
    <MyVitalsCookieBanner green={GREEN} />
    <FloatingChat />
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
        <div style={{ width:320, height:400, background:'#0d1a12', border:'1px solid rgba(52,211,153,0.2)', borderRadius:20, display:'flex', flexDirection:'column', marginBottom:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(52,211,153,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:800, fontSize:13, color:GREEN }}>🩺 AI Coach</span>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:18 }}>×</button>
          </div>
          <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'85%', padding:'8px 12px', borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px', background:m.role==='user'?`linear-gradient(135deg,${GREEN},${TEAL})`:'rgba(255,255,255,0.06)', color:m.role==='user'?'#000':'#fff', fontSize:13, lineHeight:1.5, fontWeight:m.role==='user'?600:400 }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', gap:4, padding:'8px 12px', background:'rgba(255,255,255,0.06)', borderRadius:'14px 14px 14px 4px', alignSelf:'flex-start' }}>
                {[0,0.15,0.3].map((d,i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:GREEN, opacity:0.6, animation:`nlpulse 1.2s ease-in-out ${d}s infinite` }} />)}
              </div>
            )}
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(52,211,153,0.1)', display:'flex', gap:8 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask your coach…" style={{ flex:1, padding:'9px 12px', borderRadius:10, fontSize:13, color:'#fff', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', outline:'none', fontFamily:'inherit' }} />
            <button onClick={send} disabled={loading||!input.trim()} style={{ padding:'9px 14px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', border:'none', background:input.trim()?`linear-gradient(135deg,${GREEN},${TEAL})`:'rgba(255,255,255,0.06)', color:input.trim()?'#000':'rgba(255,255,255,0.2)' }}>→</button>
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
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(7,13,10,0.97)', backdropFilter:'blur(12px)', borderTop:'1px solid rgba(52,211,153,0.12)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, zIndex:999, flexWrap:'wrap' }}>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:0 }}>We use local storage only — no cookies, no tracking. <a href="/privacy" style={{ color:green, textDecoration:'none' }}>Privacy policy</a></p>
      <button onClick={() => { localStorage.setItem('mv_cookie_ok','1'); setVisible(false) }} style={{ padding:'7px 16px', borderRadius:8, background:green, border:'none', color:'#000', fontWeight:700, fontSize:12, cursor:'pointer', flexShrink:0 }}>Got it</button>
    </div>
  )
}

function ConfirmPill({ field, value }: { field: string; value: any }) {
  const labels: Record<string, string> = { water:'💧', sleep:'😴', steps:'👟', mood:'😊', exercise:'🏃', weight:'⚖️', notes:'📝', meals:'🍽️' }
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', fontSize:12, color:'rgba(255,255,255,0.7)' }}>
      {labels[field] ?? '•'} <strong style={{ color:'#fff' }}>{field}</strong>: {display}
    </span>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px', ...style }}>{children}</div>
}

function GlassStatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <GlassCard>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</span>
      </div>
      <p style={{ fontSize:24, fontWeight:800, color, margin:0 }}>{value}</p>
    </GlassCard>
  )
}

function TargetBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color }}>{value}/{max}</span>
      </div>
      <div style={{ height:4, borderRadius:99, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.min((value/max)*100,100)}%`, background:color, borderRadius:99, transition:'width 0.5s' }} />
      </div>
    </div>
  )
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
        <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#34d399,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22, boxShadow:'0 0 24px rgba(52,211,153,0.28)' }}>💚</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:6 }}>Let&apos;s set up your profile</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>Takes 30 seconds. No account needed.</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Your name</label>
          <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Alex"
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Age</label>
          <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) || 25 }))} min={13} max={120}
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Gender</label>
          <div style={{ display:'flex', gap:8 }}>
            {(['male','female','other'] as const).map(g => (
              <button key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                style={{ flex:1, padding:'11px', borderRadius:10, cursor:'pointer', border:`2px solid ${form.gender===g?'#34d399':'rgba(255,255,255,0.08)'}`, background:form.gender===g?'rgba(52,211,153,0.12)':'rgba(255,255,255,0.02)', color:form.gender===g?'#34d399':'rgba(255,255,255,0.4)', fontWeight:600, fontSize:13, textTransform:'capitalize', transition:'all 0.15s' }}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => form.name.trim() && setStep(1)} disabled={!form.name.trim()}
          style={{ marginTop:8, padding:'15px', borderRadius:14, fontWeight:800, fontSize:16, cursor:form.name.trim()?'pointer':'not-allowed', border:'none', background:form.name.trim()?'linear-gradient(135deg,#34d399,#10b981)':'rgba(255,255,255,0.06)', color:form.name.trim()?'#000':'rgba(255,255,255,0.2)', transition:'all 0.2s', boxShadow:form.name.trim()?'0 0 24px rgba(52,211,153,0.28)':'none' }}>
          Continue →
        </button>
      </div>
    </div>,

    // Step 1: Height + weight
    <div key="step1" style={{ maxWidth:480, margin:'0 auto', padding:'0 20px' }}>
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>Body metrics</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>Used to personalise your wellness score.</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Height (cm)</label>
          <input type="number" value={form.heightCm} onChange={e => setForm(f => ({ ...f, heightCm: parseInt(e.target.value) || 170 }))} min={100} max={250}
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Weight (kg)</label>
          <input type="number" value={form.weightKg} onChange={e => setForm(f => ({ ...f, weightKg: parseInt(e.target.value) || 70 }))} min={30} max={300}
            style={{ width:'100%', padding:'13px 16px', borderRadius:12, fontSize:15, color:'#fff', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setStep(0)} style={{ flex:'0 0 auto', padding:'15px 20px', borderRadius:14, fontWeight:700, fontSize:15, cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'rgba(255,255,255,0.4)' }}>← Back</button>
          <button onClick={() => setStep(2)} style={{ flex:1, padding:'15px', borderRadius:14, fontWeight:800, fontSize:16, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#34d399,#10b981)', color:'#000', boxShadow:'0 0 24px rgba(52,211,153,0.28)' }}>Continue →</button>
        </div>
      </div>
    </div>,

    // Step 2: Goals
    <div key="step2" style={{ maxWidth:480, margin:'0 auto', padding:'0 20px' }}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>Health goals</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>Pick all that apply. AI tailors insights to your goals.</p>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
        {GOAL_OPTIONS.map(g => (
          <button key={g} onClick={() => toggleGoal(g)}
            style={{ padding:'8px 14px', borderRadius:20, cursor:'pointer', border:`1.5px solid ${form.goals.includes(g)?'#34d399':'rgba(255,255,255,0.08)'}`, background:form.goals.includes(g)?'rgba(52,211,153,0.12)':'rgba(255,255,255,0.02)', color:form.goals.includes(g)?'#34d399':'rgba(255,255,255,0.5)', fontSize:13, fontWeight:form.goals.includes(g)?700:400, transition:'all 0.15s' }}>
            {g}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => setStep(1)} style={{ flex:'0 0 auto', padding:'15px 20px', borderRadius:14, fontWeight:700, fontSize:15, cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'rgba(255,255,255,0.4)' }}>← Back</button>
        <button onClick={submit} style={{ flex:1, padding:'15px', borderRadius:14, fontWeight:800, fontSize:16, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#34d399,#10b981)', color:'#000', boxShadow:'0 0 24px rgba(52,211,153,0.28)' }}>
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
          <div key={i} style={{ width:i===step?24:6, height:6, borderRadius:99, background:i===step?'#34d399':i<step?'rgba(52,211,153,0.4)':'rgba(255,255,255,0.1)', transition:'all 0.3s' }} />
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
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #34d399, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22, boxShadow: '0 0 24px rgba(52,211,153,0.28)' }}>💚</div>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>My<span style={{ color: GREEN }}>Vitals</span> <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>— Setup</span></p>
      </div>
      <div ref={scrollRef} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? `linear-gradient(135deg, ${GREEN}, ${TEAL})` : 'rgba(255,255,255,0.06)', color: m.role === 'user' ? '#000' : '#fff', fontSize: 14, lineHeight: 1.55, fontWeight: m.role === 'user' ? 600 : 400, whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 5, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '16px 16px 16px 4px', alignSelf: 'flex-start' }}>
            {[0, 0.15, 0.3].map((d, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, opacity: 0.6, animation: `nlpulse 1.2s ease-in-out ${d}s infinite` }} />)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type your answer…" style={{ flex: 1, padding: '13px 16px', borderRadius: 12, fontSize: 15, color: '#fff', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ padding: '13px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', background: input.trim() ? `linear-gradient(135deg, ${GREEN}, ${TEAL})` : 'rgba(255,255,255,0.06)', color: input.trim() ? '#000' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s' }}>Send</button>
      </div>
      {extracted.complete && (
        <button onClick={confirmAndStart} className="animate-fade-in" style={{ width: '100%', padding: 15, borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: 'pointer', border: 'none', background: `linear-gradient(135deg, ${GREEN}, ${TEAL})`, color: '#000', boxShadow: '0 0 28px rgba(52,211,153,0.28)', marginBottom: 10 }}>
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
              <button onClick={() => setMode('manual')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Prefer a form instead?</button>
            </div>
          </>
        : <>
            <ManualOnboarding onDone={onDone} />
            <div style={{ textAlign: 'center', paddingBottom: 20 }}>
              <button onClick={() => setMode('chat')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Use AI chat instead?</button>
            </div>
          </>
      }
    </div>
  )
}
