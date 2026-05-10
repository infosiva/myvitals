'use client'
import { useState, useEffect, useRef } from 'react'
import { getProfile, getLog, saveLog, today, getStreak, healthScore } from '@/lib/storage'
import type { HealthProfile, DayLog } from '@/lib/types'
import { MOOD_LABELS, MOOD_COLORS } from '@/lib/types'

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

  function save() {
    saveLog(log)
    setStreak(getStreak())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? GREEN : score >= 40 ? '#f59e0b' : score >= 20 ? '#f97316' : '#ef4444'
  const r = 52
  const circumference = 2 * Math.PI * r
  const dash = circumference * (score / 100)

  if (!mounted) return null
  if (!profile) return <Onboarding onDone={p => setProfile(p)} />

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
          <button onClick={save} style={{
            padding: '15px', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer',
            background: saved ? 'rgba(52,211,153,0.15)' : `linear-gradient(135deg, ${GREEN}, ${TEAL})`,
            color: saved ? GREEN : '#000', border: saved ? `1px solid ${GREEN}40` : 'none',
            boxShadow: saved ? 'none' : '0 0 24px rgba(52,211,153,0.25)',
            transition: 'all 0.3s',
          }}>
            {saved ? '✓ Saved for today!' : '💾 Save Today\'s Log'}
          </button>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar-sticky" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 78 }}>

          {/* Score ring */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 20px', textAlign: 'center', backdropFilter: 'blur(12px)' }}>
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
          <a href="/insights" style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden',
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
    </main>
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
  'Diabetes', 'Hypertension', 'Asthma', 'Anxiety', 'Depression',
  'High cholesterol', 'Arthritis', 'Back pain', 'Migraine', 'GERD',
  'Thyroid', 'PCOS', 'IBS', 'Sleep apnea', 'Eczema',
]

function Onboarding({ onDone }: { onDone: (p: HealthProfile) => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', age: 30, gender: 'male',
    heightCm: 170, weightKg: 70,
    goals: [] as string[],
  })

  const GOALS = ['Lose weight', 'Sleep better', 'More energy', 'Reduce stress', 'Build fitness', 'Eat healthier']

  const bmi = form.weightKg / Math.pow(form.heightCm / 100, 2)
  const bmiLabel = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmiColor = bmi < 18.5 ? '#60a5fa' : bmi < 25 ? '#34d399' : bmi < 30 ? '#f59e0b' : '#ef4444'
  const totalIn = Math.round(form.heightCm / 2.54)
  const heightDisplay = `${form.heightCm} cm · ${Math.floor(totalIn / 12)}′${totalIn % 12}″`
  const weightDisplay = `${form.weightKg} kg · ${Math.floor(form.weightKg / 6.35)} st`

  function submit() {
    const profile: HealthProfile = {
      name: form.name, age: form.age,
      gender: form.gender as any,
      heightCm: form.heightCm, weightKg: form.weightKg,
      goals: form.goals.length ? form.goals : ['general health'],
      conditions: [],
    }
    import('@/lib/storage').then(m => { m.saveProfile(profile); onDone(profile) })
  }

  const S = { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 as const, display: 'block' as const, marginBottom: 8 }

  return (
    <main style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? GREEN : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s' }} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ marginBottom: 8 }}>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>
                Welcome to <span style={{ color: GREEN }}>MyVitals</span> 💚
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Daily tracking + AI insights. Takes 30 seconds to set up.</p>
            </div>

            {/* Name */}
            <div>
              <label style={S}>Your name</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && form.name && setStep(2)}
                placeholder="e.g. Siva"
                style={{ width: '100%', padding: '14px 18px', borderRadius: 14, fontSize: 17, color: '#fff',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
              />
            </div>

            {/* Age + Gender side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={S}>Age</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px' }}>
                  <button onClick={() => setForm(f => ({ ...f, age: Math.max(10, f.age - 1) }))}
                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)',
                      border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>−</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 26, fontWeight: 800, color: '#fff' }}>{form.age}</span>
                  <button onClick={() => setForm(f => ({ ...f, age: Math.min(100, f.age + 1) }))}
                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)',
                      border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>+</button>
                </div>
              </div>
              <div>
                <label style={S}>Gender</label>
                <div style={{ display: 'flex', gap: 8, height: 58 }}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <button key={g} onClick={() => setForm(f => ({ ...f, gender: g.toLowerCase() }))}
                      style={{ flex: 1, borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        border: `1px solid ${form.gender === g.toLowerCase() ? GREEN : 'rgba(255,255,255,0.1)'}`,
                        background: form.gender === g.toLowerCase() ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
                        color: form.gender === g.toLowerCase() ? GREEN : 'rgba(255,255,255,0.4)' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!form.name}
              style={{ padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 16,
                background: form.name ? `linear-gradient(135deg, ${GREEN}, ${TEAL})` : 'rgba(255,255,255,0.06)',
                color: form.name ? '#000' : 'rgba(255,255,255,0.2)',
                border: 'none', boxShadow: form.name ? '0 0 24px rgba(52,211,153,0.2)' : 'none',
                transition: 'all 0.2s', cursor: form.name ? 'pointer' : 'not-allowed' }}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ marginBottom: 8 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>
                Hi {form.name} 👋
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>A few more details to personalise your AI coach.</p>
            </div>

            {/* Height + Weight */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...S, marginBottom: 0 }}>Height</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>{heightDisplay}</span>
                </div>
                <input type="range" min={140} max={220} value={form.heightCm}
                  onChange={e => setForm(f => ({ ...f, heightCm: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: GREEN }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <label style={{ ...S, marginBottom: 0 }}>Weight</label>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                    background: `${bmiColor}20`, color: bmiColor, border: `1px solid ${bmiColor}40` }}>
                    BMI {bmi.toFixed(1)} {bmiLabel}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: GREEN, fontWeight: 700, display: 'block', marginBottom: 6 }}>{weightDisplay}</span>
                <input type="range" min={35} max={180} step={0.5} value={form.weightKg}
                  onChange={e => setForm(f => ({ ...f, weightKg: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: bmiColor }} />
              </div>
            </div>

            {/* Goals */}
            <div>
              <label style={S}>Health goals (pick any)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GOALS.map(g => {
                  const on = form.goals.includes(g)
                  return (
                    <button key={g} onClick={() => setForm(f => ({ ...f, goals: on ? f.goals.filter(x => x !== g) : [...f.goals, g] }))}
                      style={{ padding: '9px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        border: `1px solid ${on ? GREEN : 'rgba(255,255,255,0.1)'}`,
                        background: on ? 'rgba(52,211,153,0.15)' : 'transparent',
                        color: on ? GREEN : 'rgba(255,255,255,0.5)', fontWeight: on ? 700 : 400, transition: 'all 0.15s' }}>
                      {on ? '✓ ' : ''}{g}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)}
                style={{ padding: '16px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15,
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={submit}
                style={{ flex: 1, padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 16,
                  background: `linear-gradient(135deg, ${GREEN}, ${TEAL})`, color: '#000',
                  border: 'none', boxShadow: '0 0 24px rgba(52,211,153,0.2)', cursor: 'pointer' }}>
                Start tracking 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14, color: '#fff',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', outline: 'none' }} />
    </div>
  )
}
