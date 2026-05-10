'use client'
import { useState, useEffect, useRef } from 'react'
import { getProfile, getLog, saveLog, saveProfile, today, getStreak, healthScore } from '@/lib/storage'
import type { HealthProfile, DayLog } from '@/lib/types'
import { MOOD_LABELS, MOOD_COLORS } from '@/lib/types'
import GuidedTour, { type TourStep } from '@/components/GuidedTour'

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

export default function Dashboard() {
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [log, setLog] = useState<DayLog>({ date: today(), water: 0, sleep: 0, steps: 0, mood: 0, exercise: 0, meals: [] })
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)
  const [mealInput, setMealInput] = useState('')
  const [mounted, setMounted] = useState(false)
  // NL log state
  const [nlText, setNlText] = useState('')
  const [nlParsing, setNlParsing] = useState(false)
  const [nlConfirm, setNlConfirm] = useState<{ parsed: Partial<DayLog>; anomalies: string[] } | null>(null)
  // Narrative state
  const [narrative, setNarrative] = useState('')
  const [narrativeLoading, setNarrativeLoading] = useState(false)

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
    saveLog(log)
    setStreak(getStreak())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    // AI narrative
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
  if (!profile) return <Onboarding onDone={p => { saveProfile(p); setProfile(p) }} />

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            {greeting()}, <span style={{ color: GREEN }}>{profile.name}</span> 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 14 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 15 }}>{streak} day streak</span>
          </div>
        )}
      </div>

      {/* AI Narrative Card (post-save) */}
      {(narrativeLoading || narrative) && (
        <div style={{ marginBottom: 20, padding: '18px 20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04))', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', gap: 14, alignItems: 'flex-start' }} className="animate-fade-in">
          <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>🩺</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: GREEN, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>AI Health Coach</p>
            {narrativeLoading
              ? <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[0, 0.15, 0.3].map((d, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, animation: `nlpulse 1.2s ease-in-out ${d}s infinite` }} />)}
                </div>
              : <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>{narrative}</p>
            }
          </div>
        </div>
      )}

      {/* NL Quick Log */}
      <div id="nl-quick-log" style={{ marginBottom: 20, padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>✨ Quick Log with AI</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={nlText}
            onChange={e => setNlText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && parseNL()}
            placeholder='"walked 8k steps, slept 7 hours, feeling great, had oats for breakfast"'
            style={{ flex: 1, padding: '12px 16px', borderRadius: 12, fontSize: 14, color: '#fff', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={parseNL} disabled={nlParsing || !nlText.trim()}
            style={{ padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: nlParsing || !nlText.trim() ? 'not-allowed' : 'pointer', border: 'none', background: nlText.trim() ? `linear-gradient(135deg, ${GREEN}, ${TEAL})` : 'rgba(255,255,255,0.06)', color: nlText.trim() ? '#000' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {nlParsing ? '…' : 'Parse →'}
          </button>
        </div>
        {nlConfirm && (
          <div style={{ marginTop: 14 }} className="animate-fade-in">
            {nlConfirm.anomalies.length > 0 && (
              <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>⚠️ AI flagged — please confirm:</p>
                {nlConfirm.anomalies.map((a, i) => <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>• {a}</p>)}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {Object.entries(nlConfirm.parsed).filter(([, v]) => v != null && (Array.isArray(v) ? (v as any[]).length > 0 : true)).map(([k, v]) => (
                <ConfirmPill key={k} field={k} value={v} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={applyNLParsed} style={{ flex: 1, padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', background: `linear-gradient(135deg, ${GREEN}, ${TEAL})`, color: '#000' }}>
                ✓ Apply these fields
              </button>
              <button onClick={() => setNlConfirm(null)} style={{ padding: '11px 16px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3-col stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <GlassStatCard icon="💧" label="Water" value={log.water} max={8} unit="glasses" color="#38bdf8" />
        <GlassStatCard icon="😴" label="Sleep" value={log.sleep} max={8} unit="hrs" color="#818cf8" />
        <GlassStatCard icon="👟" label="Steps" value={log.steps} max={10000} unit="" color={GREEN} format={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
      </div>

      {/* Main layout: log form + score sidebar */}
      <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* LOG FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Water */}
          <GlassCard accentColor="#38bdf8" title="💧 Hydration">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Glasses of water today</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8' }}>{log.water}</span>
            </div>
            <input type="range" min={0} max={12} value={log.water} onChange={e => update('water', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', height: 4 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {[2,4,6,8,10,12].map(n => (
                <button key={n} onClick={() => update('water', n)}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${log.water === n ? '#38bdf8' : 'rgba(56,189,248,0.2)'}`,
                    background: log.water === n ? 'rgba(56,189,248,0.2)' : 'transparent',
                    color: log.water === n ? '#38bdf8' : 'rgba(56,189,248,0.5)' }}>
                  {n} 💧
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Sleep */}
          <GlassCard accentColor="#818cf8" title="😴 Sleep">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Hours slept last night</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#818cf8' }}>{log.sleep}h</span>
            </div>
            <input type="range" min={0} max={12} step={0.5} value={log.sleep} onChange={e => update('sleep', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#818cf8' }} />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
              {log.sleep >= 7 && log.sleep <= 9 ? '✅ Optimal 7–9h range' : log.sleep < 6 && log.sleep > 0 ? '⚠️ Below recommended 7h — try sleeping earlier' : log.sleep > 9 ? '💤 Slightly long — check for sleep quality issues' : ''}
            </p>
          </GlassCard>

          {/* Steps */}
          <GlassCard accentColor={GREEN} title="👟 Steps">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <input type="number" value={log.steps || ''} placeholder="0"
                onChange={e => update('steps', parseInt(e.target.value) || 0)}
                style={{ flex: 1, padding: '12px 16px', fontSize: 24, fontWeight: 800, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(52,211,153,0.2)`, color: '#fff', outline: 'none' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>goal</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>10k</div>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${GREEN}, ${TEAL})`,
                width: `${Math.min((log.steps / 10000) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
              {log.steps >= 10000 ? '🎉 Goal reached!' : log.steps > 0 ? `${(10000 - log.steps).toLocaleString()} steps to goal` : 'Enter your step count'}
            </p>
          </GlassCard>

          {/* Mood */}
          <GlassCard accentColor="#f472b6" title="😊 Mood">
            <div style={{ display: 'flex', gap: 8 }}>
              {([1,2,3,4,5] as const).map(m => (
                <button key={m} onClick={() => update('mood', m)}
                  style={{ flex: '1 1 0', padding: '12px 6px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${log.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.06)'}`,
                    background: log.mood === m ? `${MOOD_COLORS[m]}18` : 'rgba(255,255,255,0.02)',
                    color: log.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.35)',
                    fontSize: 12, fontWeight: log.mood === m ? 700 : 400, textAlign: 'center',
                    transition: 'all 0.2s' }}>
                  {MOOD_LABELS[m]}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Exercise */}
          <GlassCard accentColor="#fb923c" title="🏃 Exercise">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Minutes of activity</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#fb923c' }}>{log.exercise}m</span>
            </div>
            <input type="range" min={0} max={120} step={5} value={log.exercise} onChange={e => update('exercise', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#fb923c' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {[0,15,30,45,60,90].map(n => (
                <button key={n} onClick={() => update('exercise', n)}
                  style={{ flex: 1, padding: '5px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${log.exercise === n ? '#fb923c' : 'rgba(251,146,60,0.15)'}`,
                    background: log.exercise === n ? 'rgba(251,146,60,0.2)' : 'transparent',
                    color: log.exercise === n ? '#fb923c' : 'rgba(251,146,60,0.45)' }}>
                  {n === 0 ? 'Rest' : `${n}m`}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Meals */}
          <GlassCard accentColor="#a78bfa" title="🍽️ Meals">
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={mealInput} onChange={e => setMealInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMeal()}
                placeholder="What did you eat? Press Enter to add"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 14, color: '#fff',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(167,139,250,0.2)', outline: 'none' }} />
              <button onClick={addMeal} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                +
              </button>
            </div>
            {(log.meals ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {(log.meals ?? []).map((m: string, i: number) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px 4px 12px', borderRadius: 20,
                    background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.18)', fontSize: 12, color: '#c4b5fd' }}>
                    {m}
                    <button onClick={() => removeMeal(i)} style={{ background: 'none', border: 'none', color: 'rgba(167,139,250,0.6)', cursor: 'pointer', padding: '0 0 0 2px', fontSize: 14, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Notes */}
          <GlassCard accentColor="#94a3b8" title="📝 Notes">
            <textarea value={log.notes ?? ''} onChange={e => update('notes', e.target.value)}
              placeholder="Anything notable today — stress, energy, symptoms, travel…"
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14, color: '#fff', resize: 'none',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', outline: 'none', fontFamily: 'inherit' }} />
          </GlassCard>

          {/* Save button */}
          <button id="save-btn" onClick={save} style={{
            padding: '15px', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer',
            background: saved ? 'rgba(52,211,153,0.15)' : `linear-gradient(135deg, ${GREEN}, ${TEAL})`,
            color: saved ? GREEN : '#000', border: saved ? `1px solid ${GREEN}40` : 'none',
            boxShadow: saved ? 'none' : '0 0 24px rgba(52,211,153,0.25)',
            transition: 'all 0.3s',
          }}>
            {saved ? '✓ Saved! Getting AI summary…' : '💾 Save Today\'s Log'}
          </button>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar-sticky" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 78 }}>

          {/* Score ring */}
          <div id="wellness-score" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 20px', textAlign: 'center', backdropFilter: 'blur(12px)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Today's Wellness</p>
            <svg width={140} height={140} viewBox="0 0 140 140" style={{ display: 'block', margin: '0 auto' }}>
              {/* bg track */}
              <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={11} />
              {/* glow */}
              <circle cx={70} cy={70} r={r} fill="none" stroke={scoreColor} strokeWidth={11} opacity={0.15}
                strokeDasharray={`${circumference} 0`} />
              {/* actual ring */}
              <circle cx={70} cy={70} r={r} fill="none" stroke={scoreColor} strokeWidth={11}
                strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }} />
              <text x={70} y={64} textAnchor="middle" fill="#fff" fontSize={32} fontWeight={800}>{score}</text>
              <text x={70} y={80} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={12}>/100</text>
            </svg>
            <p style={{ fontSize: 14, color: scoreColor, fontWeight: 700, marginTop: 14 }}>
              {score >= 80 ? '🌟 Excellent day!' : score >= 60 ? '👍 Good progress' : score >= 40 ? '💪 Keep going' : score >= 20 ? '🌱 Getting started' : '📝 Log your day'}
            </p>
          </div>

          {/* Daily targets */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Daily Targets</p>
            <TargetBar icon="💧" label="Water" current={log.water} target={8} unit="gl" color="#38bdf8" />
            <TargetBar icon="😴" label="Sleep" current={log.sleep} target={8} unit="h" color="#818cf8" />
            <TargetBar icon="👟" label="Steps" current={log.steps} target={10000} unit="" color={GREEN} format={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
            <TargetBar icon="🏃" label="Exercise" current={log.exercise} target={30} unit="m" color="#fb923c" />
          </div>

          {/* AI CTA */}
          <a id="ai-insight-cta" href="/insights" style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))',
            border: '1px solid rgba(52,211,153,0.18)', padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🩺</div>
            <p style={{ fontSize: 14, fontWeight: 800, color: GREEN, marginBottom: 6 }}>AI Weekly Insight</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 14 }}>
              Get a personalised health narrative — like your doctor-friend reviewing your week.
            </p>
            <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: GREEN, color: '#000', fontSize: 12, fontWeight: 800 }}>
              Analyse my week →
            </span>
          </a>
        </div>
      </div>
      <style>{`@keyframes nlpulse{0%,100%{opacity:0.4;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      <GuidedTour steps={TOUR_STEPS} storageKey="myvitals_tour_v1" accentColor={GREEN} delay={800} />
    </main>
  )
}

// ── Confirm pill for NL parsed fields ─────────────────────────────────────────
function ConfirmPill({ field, value }: { field: string; value: any }) {
  const labels: Record<string, string> = { water:'💧', sleep:'😴', steps:'👟', mood:'😊', exercise:'🏃', meals:'🍽️', weight:'⚖️', notes:'📝' }
  const formats: Record<string, (v: any) => string> = {
    water: v => `${v} glasses`,
    sleep: v => `${v}h sleep`,
    steps: v => `${Number(v).toLocaleString()} steps`,
    mood: v => `Mood ${v}/5`,
    exercise: v => `${v}min exercise`,
    meals: v => Array.isArray(v) ? v.join(', ') : String(v),
    weight: v => `${v}kg`,
    notes: v => String(v).slice(0, 40),
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', fontSize: 13, color: '#6ee7b7', fontWeight: 600 }}>
      {labels[field] || '•'} {formats[field] ? formats[field](value) : String(value)}
    </span>
  )
}


function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function GlassCard({ title, accentColor, children }: { title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentColor}14`, borderRadius: 16, padding: '20px 20px 18px', backdropFilter: 'blur(8px)' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>{title}</p>
      {children}
    </div>
  )
}

function GlassStatCard({ icon, label, value, max, unit, color, format }: { icon: string; label: string; value: number; max: number; unit: string; color: string; format?: (v: number) => string }) {
  const pct = Math.min((value / max) * 100, 100)
  const display = format ? format(value) : value
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}14`, borderRadius: 16, padding: '16px 18px' }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{icon} {label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color }}>{display} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{unit}</span></p>
      <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', borderRadius: 99, background: color, width: `${pct}%`, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function TargetBar({ icon, label, current, target, unit, color, format }: { icon: string; label: string; current: number; target: number; unit: string; color: string; format?: (v: number) => string }) {
  const pct = Math.min((current / target) * 100, 100)
  const display = format ? format(current) : current
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{icon} {label}</span>
        <span style={{ fontSize: 12, color: pct >= 100 ? color : 'rgba(255,255,255,0.35)' }}>
          {display}{unit} / {format ? format(target) : target}{unit}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${pct}%`, transition: 'width 0.5s', boxShadow: pct >= 100 ? `0 0 8px ${color}60` : 'none' }} />
      </div>
    </div>
  )
}


const COMMON_CONDITIONS = [
  'Diabetes','Hypertension','Asthma','Anxiety','Depression',
  'High cholesterol','Arthritis','Back pain','Migraine','GERD',
  'Thyroid','PCOS','IBS','Sleep apnea','Eczema',
]
const GOALS = ['Lose weight','Sleep better','More energy','Reduce stress','Build fitness','Eat healthier','Manage condition']
const STEP_TITLES = ["What's your name?",'How old are you?','Your height','Your weight','Health goals','Any conditions?']
const TOTAL_STEPS = 6

function ManualOnboarding({ onDone }: { onDone: (p: HealthProfile) => void }) {
  const [step, setStep] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [form, setForm] = useState({ name:'', age:30, gender:'male', heightCm:170, weightKg:70, goals:[] as string[], conditions:[] as string[] })
  const [condInput, setCondInput] = useState('')
  const [condFocus, setCondFocus] = useState(false)

  function go(dir: 1|-1) { setAnimKey(k=>k+1); setStep(s=>s+dir) }
  function canContinue() { return step!==0||form.name.trim().length>0 }
  function toggleGoal(g: string) { setForm(f=>({...f,goals:f.goals.includes(g)?f.goals.filter(x=>x!==g):[...f.goals,g]})) }
  function addCond(c: string) { const t=c.trim(); if(!t||form.conditions.includes(t))return; setForm(f=>({...f,conditions:[...f.conditions,t]})); setCondInput('') }
  function removeCond(c: string) { setForm(f=>({...f,conditions:f.conditions.filter(x=>x!==c)})) }

  const bmi=form.weightKg/Math.pow(form.heightCm/100,2)
  const bmiLabel=bmi<18.5?'Underweight':bmi<25?'Healthy':bmi<30?'Overweight':'Obese'
  const bmiColor=bmi<18.5?'#60a5fa':bmi<25?'#34d399':bmi<30?'#f59e0b':'#ef4444'
  const totalIn=Math.round(form.heightCm/2.54); const ft=Math.floor(totalIn/12); const htIn=totalIn%12
  const st=Math.floor(form.weightKg/6.35); const lb=Math.round((form.weightKg%6.35)*2.205)
  const filtered=COMMON_CONDITIONS.filter(c=>c.toLowerCase().includes(condInput.toLowerCase())&&!form.conditions.includes(c))

  function submit() {
    const profile: HealthProfile = { name:form.name, age:form.age, gender:form.gender as any, heightCm:form.heightCm, weightKg:form.weightKg, goals:form.goals.length?form.goals:['general health'], conditions:form.conditions }
    onDone(profile)
  }

  const stepContent=()=>{
    switch(step){
      case 0:return(
        <div style={sWrap}>
          <p style={sHint}>Let's personalise your health experience</p>
          <input autoFocus value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            onKeyDown={e=>e.key==='Enter'&&canContinue()&&go(1)}
            placeholder="Your first name" style={sBigInput}/>
        </div>
      )
      case 1:return(
        <div style={sWrap}>
          <p style={sHint}>Used to personalise your health insights</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:32,margin:'36px 0 24px'}}>
            <button onClick={()=>setForm(f=>({...f,age:Math.max(10,f.age-1)}))} style={sBigBtn}>−</button>
            <span style={{fontSize:88,fontWeight:900,color:'#fff',letterSpacing:'-4px',lineHeight:1}}>{form.age}</span>
            <button onClick={()=>setForm(f=>({...f,age:Math.min(100,f.age+1)}))} style={sBigBtn}>+</button>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:28}}>
            {[18,25,30,35,40,50,60].map(a=>(
              <button key={a} onClick={()=>setForm(f=>({...f,age:a}))}
                style={{padding:'8px 18px',borderRadius:20,fontSize:14,fontWeight:600,cursor:'pointer',transition:'all 0.15s',
                  background:form.age===a?'rgba(52,211,153,0.12)':'rgba(255,255,255,0.04)',
                  border:`1px solid ${form.age===a?'rgba(52,211,153,0.5)':'rgba(255,255,255,0.1)'}`,
                  color:form.age===a?GREEN:'rgba(255,255,255,0.45)'}}>{a}</button>
            ))}
          </div>
          <p style={{...sHint,marginBottom:12}}>Gender</p>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            {(['Male','Female','Other'] as const).map(g=>(
              <button key={g} onClick={()=>setForm(f=>({...f,gender:g.toLowerCase()}))}
                style={{padding:'12px 28px',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer',transition:'all 0.15s',
                  border:`2px solid ${form.gender===g.toLowerCase()?GREEN:'rgba(255,255,255,0.1)'}`,
                  background:form.gender===g.toLowerCase()?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.03)',
                  color:form.gender===g.toLowerCase()?GREEN:'rgba(255,255,255,0.45)'}}>{g}</button>
            ))}
          </div>
        </div>
      )
      case 2:return(
        <div style={sWrap}>
          <p style={sHint}>Drag the slider to set your height</p>
          <div style={{textAlign:'center',margin:'36px 0 12px'}}>
            <span style={{fontSize:80,fontWeight:900,color:'#fff',letterSpacing:'-3px'}}>{form.heightCm}</span>
            <span style={{fontSize:22,color:'rgba(255,255,255,0.35)',marginLeft:8}}>cm</span>
            <p style={{fontSize:18,color:'rgba(255,255,255,0.3)',marginTop:6}}>{ft}&prime; {htIn}&Prime;</p>
          </div>
          <input type="range" min={140} max={220} step={1} value={form.heightCm}
            onChange={e=>setForm(f=>({...f,heightCm:parseInt(e.target.value)}))}
            style={{width:'100%',accentColor:GREEN,height:6,marginBottom:8}}/>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={sRangeLabel}>140 cm</span><span style={sRangeLabel}>220 cm</span>
          </div>
        </div>
      )
      case 3:return(
        <div style={sWrap}>
          <p style={sHint}>Drag the slider to set your weight</p>
          <div style={{textAlign:'center',margin:'36px 0 12px'}}>
            <span style={{fontSize:80,fontWeight:900,color:'#fff',letterSpacing:'-3px'}}>{form.weightKg}</span>
            <span style={{fontSize:22,color:'rgba(255,255,255,0.35)',marginLeft:8}}>kg</span>
            <p style={{fontSize:18,color:'rgba(255,255,255,0.3)',marginTop:6}}>{st} st {lb} lb</p>
          </div>
          <input type="range" min={35} max={180} step={0.5} value={form.weightKg}
            onChange={e=>setForm(f=>({...f,weightKg:parseFloat(e.target.value)}))}
            style={{width:'100%',accentColor:bmiColor,height:6,marginBottom:8}}/>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
            <span style={sRangeLabel}>35 kg</span><span style={sRangeLabel}>180 kg</span>
          </div>
          <div style={{textAlign:'center',padding:'14px 20px',borderRadius:16,background:`${bmiColor}10`,border:`1px solid ${bmiColor}28`}}>
            <span style={{fontSize:32,fontWeight:900,color:bmiColor}}>{bmi.toFixed(1)}</span>
            <span style={{fontSize:15,color:bmiColor,marginLeft:10,fontWeight:700}}>BMI &middot; {bmiLabel}</span>
          </div>
        </div>
      )
      case 4:return(
        <div style={sWrap}>
          <p style={sHint}>Select all that apply — shapes your daily tracking</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center',marginTop:24}}>
            {GOALS.map(g=>{const sel=form.goals.includes(g);return(
              <button key={g} onClick={()=>toggleGoal(g)}
                style={{padding:'13px 22px',borderRadius:16,fontSize:15,cursor:'pointer',fontWeight:sel?700:500,transition:'all 0.15s',
                  border:`2px solid ${sel?GREEN:'rgba(255,255,255,0.1)'}`,
                  background:sel?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.03)',
                  color:sel?GREEN:'rgba(255,255,255,0.5)'}}>
                {sel?'✓ ':''}{g}
              </button>
            )})}
          </div>
        </div>
      )
      case 5:return(
        <div style={sWrap}>
          <p style={sHint}>Helps AI personalise your insights. Skip if none.</p>
          {form.conditions.length>0&&(
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:16,marginBottom:4,justifyContent:'center'}}>
              {form.conditions.map(c=>(
                <span key={c} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px 8px 16px',
                  borderRadius:20,background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.28)',
                  fontSize:14,color:'#fca5a5',fontWeight:600}}>
                  {c}
                  <button onClick={()=>removeCond(c)} style={{background:'none',border:'none',color:'rgba(252,165,165,0.6)',cursor:'pointer',padding:'0 0 0 4px',fontSize:16,lineHeight:1}}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{position:'relative',marginTop:20}}>
            <input value={condInput} onChange={e=>setCondInput(e.target.value)}
              onFocus={()=>setCondFocus(true)} onBlur={()=>setTimeout(()=>setCondFocus(false),150)}
              onKeyDown={e=>{if(e.key==='Enter'&&condInput.trim()){addCond(condInput);e.preventDefault()}if(e.key==='Backspace'&&!condInput&&form.conditions.length)removeCond(form.conditions[form.conditions.length-1])}}
              placeholder="Search or type a condition…"
              style={{...sBigInput,fontSize:17,marginTop:0}}/>
            {condFocus&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:6,borderRadius:16,
                background:'rgba(10,10,14,0.98)',border:'1px solid rgba(255,255,255,0.1)',
                zIndex:50,overflow:'hidden',backdropFilter:'blur(20px)',maxHeight:240,overflowY:'auto'}}>
                {condInput&&!COMMON_CONDITIONS.map(c=>c.toLowerCase()).includes(condInput.toLowerCase())&&(
                  <button onMouseDown={()=>addCond(condInput)}
                    style={{width:'100%',padding:'13px 18px',textAlign:'left',background:'rgba(248,113,113,0.08)',
                      border:'none',borderBottom:'1px solid rgba(255,255,255,0.06)',color:'#fca5a5',fontSize:14,cursor:'pointer'}}>
                    + Add &ldquo;{condInput}&rdquo;
                  </button>
                )}
                {(condInput?filtered:COMMON_CONDITIONS.filter(c=>!form.conditions.includes(c))).map(c=>(
                  <button key={c} onMouseDown={()=>addCond(c)}
                    style={{width:'100%',padding:'12px 18px',textAlign:'left',background:'none',
                      border:'none',borderBottom:'1px solid rgba(255,255,255,0.05)',
                      color:'rgba(255,255,255,0.75)',fontSize:14,cursor:'pointer'}}>{c}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  const pct=(step/(TOTAL_STEPS-1))*100

  return(
    <>
      <style>{`
        @keyframes ob-blob1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(70px,-60px) scale(1.2)}66%{transform:translate(-30px,40px) scale(0.85)}}
        @keyframes ob-blob2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-60px,70px) scale(1.15)}70%{transform:translate(50px,-30px) scale(0.9)}}
        @keyframes ob-blob3{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(50px,60px) scale(0.88)}60%{transform:translate(-40px,-50px) scale(1.18)}}
        @keyframes ob-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .ob-step{animation:ob-in 0.3s cubic-bezier(0.4,0,0.2,1) forwards}
        input[type=range]{-webkit-appearance:none;appearance:none;border-radius:999px;background:rgba(255,255,255,0.1);cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 0 14px rgba(52,211,153,0.4);cursor:pointer}
      `}</style>

      {/* Animated BG */}
      <div style={{position:'fixed',inset:0,zIndex:0,background:'#07090c'}}>
        {/* Base gradient wash */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 90% 70% at 10% 40%, rgba(16,185,129,0.18) 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 90% 10%, rgba(99,102,241,0.16) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 60% 90%, rgba(52,211,153,0.1) 0%, transparent 60%)'}}/>
        {/* Animated blobs */}
        <div style={{position:'absolute',width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 65%)',top:'-10%',left:'-15%',animation:'ob-blob1 16s ease-in-out infinite',filter:'blur(55px)'}}/>
        <div style={{position:'absolute',width:550,height:550,borderRadius:'50%',background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)',bottom:'-8%',right:'-12%',animation:'ob-blob2 20s ease-in-out infinite',filter:'blur(60px)'}}/>
        <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 65%)',top:'45%',left:'55%',animation:'ob-blob3 14s ease-in-out infinite',filter:'blur(50px)'}}/>
        {/* Subtle noise overlay */}
        <div style={{position:'absolute',inset:0,opacity:0.03,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")'}}/>
      </div>

      <div style={{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg, #34d399, #10b981)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:26,boxShadow:'0 0 36px rgba(52,211,153,0.28)'}}>💚</div>
          <p style={{fontSize:20,fontWeight:900,color:'#fff',letterSpacing:'-0.3px'}}>My<span style={{color:GREEN}}>Vitals</span></p>
        </div>

        {/* Progress */}
        <div style={{width:'100%',maxWidth:600,marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.28)',fontWeight:600}}>Step {step+1} of {TOTAL_STEPS}</span>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.28)'}}>{Math.round(pct)}% complete</span>
          </div>
          <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg, ${GREEN}, ${TEAL})`,width:`${pct}%`,transition:'width 0.4s cubic-bezier(0.4,0,0.2,1)'}}/>
          </div>
        </div>

        {/* Card */}
        <div style={{width:'100%',maxWidth:600,background:'rgba(255,255,255,0.028)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:28,padding:'44px 48px 40px',backdropFilter:'blur(24px)'}}>
          <h2 style={{fontSize:34,fontWeight:900,color:'#fff',letterSpacing:'-0.8px',marginBottom:4}}>{STEP_TITLES[step]}</h2>

          <div key={animKey} className="ob-step">
            {stepContent()}
          </div>

          <div style={{display:'flex',gap:10,marginTop:40}}>
            {step>0&&(
              <button onClick={()=>go(-1)} style={{flex:'0 0 auto',padding:'14px 24px',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.45)'}}>
                ← Back
              </button>
            )}
            {step<TOTAL_STEPS-1?(
              <button onClick={()=>canContinue()&&go(1)} disabled={!canContinue()}
                style={{flex:1,padding:'16px',borderRadius:14,fontSize:16,fontWeight:800,transition:'all 0.2s',
                  cursor:canContinue()?'pointer':'not-allowed',border:'none',
                  background:canContinue()?`linear-gradient(135deg, ${GREEN}, ${TEAL})`:'rgba(255,255,255,0.06)',
                  color:canContinue()?'#000':'rgba(255,255,255,0.2)',
                  boxShadow:canContinue()?'0 0 28px rgba(52,211,153,0.25)':'none'}}>
                Continue →
              </button>
            ):(
              <button onClick={submit}
                style={{flex:1,padding:'16px',borderRadius:14,fontSize:16,fontWeight:800,cursor:'pointer',border:'none',
                  background:`linear-gradient(135deg, ${GREEN}, ${TEAL})`,color:'#000',
                  boxShadow:'0 0 28px rgba(52,211,153,0.3)'}}>
                Start tracking my health 🚀
              </button>
            )}
          </div>
          {step===TOTAL_STEPS-1&&(
            <button onClick={submit} style={{width:'100%',marginTop:10,padding:'10px',background:'none',border:'none',color:'rgba(255,255,255,0.25)',fontSize:13,cursor:'pointer'}}>
              Skip — set up later
            </button>
          )}
        </div>
      </div>
    </>
  )
}

const sWrap: React.CSSProperties={paddingTop:8}
const sHint: React.CSSProperties={fontSize:15,color:'rgba(255,255,255,0.38)',marginBottom:8}
const sBigInput: React.CSSProperties={width:'100%',padding:'18px 22px',borderRadius:16,fontSize:22,fontWeight:600,color:'#fff',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',outline:'none',boxSizing:'border-box',letterSpacing:'-0.3px',marginTop:16}
const sBigBtn: React.CSSProperties={width:60,height:60,borderRadius:18,fontSize:30,fontWeight:300,cursor:'pointer',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.8)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,lineHeight:1}
const sRangeLabel: React.CSSProperties={fontSize:12,color:'rgba(255,255,255,0.2)'}

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
