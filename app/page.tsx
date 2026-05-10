'use client'
import { useState, useEffect } from 'react'
import { getProfile, getLog, saveLog, today, getStreak, healthScore } from '@/lib/storage'
import type { HealthProfile, DayLog } from '@/lib/types'
import { MOOD_LABELS, MOOD_COLORS } from '@/lib/types'

export default function Dashboard() {
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [log, setLog] = useState<DayLog>({ date: today(), water: 0, sleep: 0, steps: 0, mood: 0, exercise: 0, meals: [] })
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)
  const [mealInput, setMealInput] = useState('')

  useEffect(() => {
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
    setTimeout(() => setSaved(false), 2000)
  }

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#34d399' : score >= 40 ? '#f59e0b' : score >= 20 ? '#f97316' : '#ef4444'
  const circumference = 2 * Math.PI * 52
  const dash = circumference * (score / 100)

  if (!profile) return <Onboarding onDone={p => setProfile(p)} />

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>
          Good {greeting()}, {profile.name} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 4, fontSize: 15 }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard icon="🔥" label="Day Streak" value={streak} unit="days" color="#f59e0b" />
        <StatCard icon="💚" label="Today's Score" value={score} unit="/100" color={scoreColor} />
        <StatCard icon="💧" label="Water" value={log.water} unit="glasses" color="#38bdf8" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        {/* Log form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Water */}
          <LogCard title="💧 Hydration" color="#38bdf8">
            <SliderRow label="Glasses of water" value={log.water} min={0} max={12} onChange={v => update('water', v)} unit="glasses" color="#38bdf8" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {[2,4,6,8,10,12].map(n => (
                <button key={n} onClick={() => update('water', n)}
                  style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(56,189,248,0.3)',
                    background: log.water === n ? '#38bdf8' : 'transparent',
                    color: log.water === n ? '#000' : '#38bdf8', fontSize: 13, cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
          </LogCard>

          {/* Sleep */}
          <LogCard title="😴 Sleep" color="#818cf8">
            <SliderRow label="Hours slept" value={log.sleep} min={0} max={12} step={0.5} onChange={v => update('sleep', v)} unit="hrs" color="#818cf8" />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
              {log.sleep >= 7 && log.sleep <= 9 ? '✅ Optimal sleep range' : log.sleep < 6 ? '⚠️ Below recommended 7h' : log.sleep > 9 ? '💤 Slightly oversleeping' : ''}
            </p>
          </LogCard>

          {/* Steps */}
          <LogCard title="👟 Steps" color="#34d399">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="number" value={log.steps || ''} placeholder="0"
                onChange={e => update('steps', parseInt(e.target.value) || 0)}
                style={{ flex: 1, padding: '10px 14px', fontSize: 22, fontWeight: 700, borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)', color: '#fff', outline: 'none' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>steps</span>
            </div>
            <StepsBar steps={log.steps} />
          </LogCard>

          {/* Mood */}
          <LogCard title="😊 Mood" color="#f472b6">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {([1,2,3,4,5] as const).map(m => (
                <button key={m} onClick={() => update('mood', m)}
                  style={{ flex: '1 1 0', padding: '10px 8px', borderRadius: 12, border: `2px solid ${log.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.1)'}`,
                    background: log.mood === m ? MOOD_COLORS[m] + '22' : 'rgba(255,255,255,0.03)',
                    color: log.mood === m ? MOOD_COLORS[m] : 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: log.mood === m ? 700 : 400, cursor: 'pointer', textAlign: 'center' }}>
                  {MOOD_LABELS[m]}
                </button>
              ))}
            </div>
          </LogCard>

          {/* Exercise */}
          <LogCard title="🏃 Exercise" color="#fb923c">
            <SliderRow label="Minutes active" value={log.exercise} min={0} max={120} step={5} onChange={v => update('exercise', v)} unit="min" color="#fb923c" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {[15,30,45,60,90].map(n => (
                <button key={n} onClick={() => update('exercise', n)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(251,146,60,0.3)',
                    background: log.exercise === n ? '#fb923c' : 'transparent',
                    color: log.exercise === n ? '#000' : '#fb923c', fontSize: 12, cursor: 'pointer' }}>
                  {n}m
                </button>
              ))}
            </div>
          </LogCard>

          {/* Meals */}
          <LogCard title="🍽️ Meals" color="#a78bfa">
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={mealInput} onChange={e => setMealInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMeal()}
                placeholder="e.g. oatmeal with berries…"
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 14, color: '#fff',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(167,139,250,0.2)', outline: 'none' }} />
              <button onClick={addMeal} style={{ padding: '9px 16px', borderRadius: 8, background: '#a78bfa', color: '#000', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Add
              </button>
            </div>
            {(log.meals ?? []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {(log.meals ?? []).map((m: string, i: number) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.2)', fontSize: 13, color: '#c4b5fd' }}>
                    {m}
                    <button onClick={() => removeMeal(i)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </LogCard>

          {/* Notes */}
          <LogCard title="📝 Notes" color="#94a3b8">
            <textarea value={log.notes ?? ''} onChange={e => update('notes', e.target.value)}
              placeholder="Anything notable today — stress, illness, travel…"
              rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, color: '#fff', resize: 'vertical',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', fontFamily: 'inherit' }} />
          </LogCard>

          <button onClick={save} style={{
            padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer',
            background: saved ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg,#34d399,#10b981)',
            color: saved ? '#34d399' : '#000', transition: 'all 0.3s',
          }}>
            {saved ? '✓ Saved!' : 'Save Today\'s Log'}
          </button>
        </div>

        {/* Score ring sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Score ring */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>Today's Wellness Score</p>
            <svg width={130} height={130} viewBox="0 0 130 130" style={{ display: 'block', margin: '0 auto' }}>
              <circle cx={65} cy={65} r={52} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
              <circle cx={65} cy={65} r={52} fill="none" stroke={scoreColor} strokeWidth={10}
                strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
                transform="rotate(-90 65 65)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
              <text x={65} y={60} textAnchor="middle" fill={scoreColor} fontSize={30} fontWeight={700}>{score}</text>
              <text x={65} y={78} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={12}>/100</text>
            </svg>
            <p style={{ fontSize: 13, color: scoreColor, fontWeight: 600, marginTop: 12 }}>
              {score >= 80 ? 'Excellent day!' : score >= 60 ? 'Good progress' : score >= 40 ? 'Getting there' : score >= 20 ? 'Room to grow' : 'Log your day'}
            </p>
          </div>

          {/* Quick tips */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Daily Targets</p>
            <TargetRow label="💧 Water" current={log.water} target={8} unit="glasses" color="#38bdf8" />
            <TargetRow label="😴 Sleep" current={log.sleep} target={8} unit="hrs" color="#818cf8" />
            <TargetRow label="👟 Steps" current={log.steps} target={10000} unit="" color="#34d399" />
            <TargetRow label="🏃 Exercise" current={log.exercise} target={30} unit="min" color="#fb923c" />
          </div>

          {/* AI Insights CTA */}
          <a href="/insights" style={{
            display: 'block', padding: 20, borderRadius: 16, textDecoration: 'none',
            background: 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.08))',
            border: '1px solid rgba(52,211,153,0.2)',
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>🧠 AI Weekly Insight</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Get your personalised health narrative — like having a doctor-friend review your week.
            </p>
            <div style={{ marginTop: 12, display: 'inline-block', padding: '6px 14px', borderRadius: 20,
              background: '#34d399', color: '#000', fontSize: 13, fontWeight: 700 }}>
              View insights →
            </div>
          </a>
        </div>
      </div>
    </main>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function LogCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}18`, borderRadius: 16, padding: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  )
}

function SliderRow({ label, value, min, max, step = 1, onChange, unit, color }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit: string; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 700, color }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color }} />
    </div>
  )
}

function StepsBar({ steps }: { steps: number }) {
  const pct = Math.min((steps / 10000) * 100, 100)
  const color = pct >= 100 ? '#10b981' : pct >= 70 ? '#34d399' : pct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{steps.toLocaleString()} / 10,000 steps goal</p>
    </div>
  )
}

function TargetRow({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const pct = Math.min((current / target) * 100, 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
        <span style={{ fontSize: 12, color: pct >= 100 ? color : 'rgba(255,255,255,0.4)' }}>
          {current.toLocaleString()}{unit ? ' ' + unit : ''} / {target.toLocaleString()}{unit ? ' ' + unit : ''}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${pct}%`, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color }: { icon: string; label: string; value: number | string; unit: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px' }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{icon} {label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color }}>{value} <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>{unit}</span></p>
    </div>
  )
}

function Onboarding({ onDone }: { onDone: (p: HealthProfile) => void }) {
  const [form, setForm] = useState({ name: '', age: '', gender: 'male', heightCm: '', weightKg: '', goals: [] as string[], conditions: '' })

  const GOALS = ['Lose weight', 'Sleep better', 'More energy', 'Reduce stress', 'Build fitness', 'Eat healthier']

  function toggleGoal(g: string) {
    setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }))
  }

  function submit() {
    if (!form.name || !form.age) return
    const profile: HealthProfile = {
      name: form.name, age: parseInt(form.age),
      gender: form.gender as any, heightCm: parseFloat(form.heightCm) || 170,
      weightKg: parseFloat(form.weightKg) || 70,
      goals: form.goals.length ? form.goals : ['general health'],
      conditions: form.conditions ? form.conditions.split(',').map(s => s.trim()) : [],
    }
    import('@/lib/storage').then(m => { m.saveProfile(profile); onDone(profile) })
  }

  return (
    <main style={{ maxWidth: 520, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>💚</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>Welcome to HealthPulse</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 15 }}>
          Your AI health coach. Let's set up your profile to personalise everything.
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Your name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Siva" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Age" value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} placeholder="35" type="number" />
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Gender</label>
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14 }}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Height (cm)" value={form.heightCm} onChange={v => setForm(f => ({ ...f, heightCm: v }))} placeholder="175" type="number" />
          <Field label="Weight (kg)" value={form.weightKg} onChange={v => setForm(f => ({ ...f, weightKg: v }))} placeholder="70" type="number" />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 10 }}>Health goals (pick all that apply)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map(g => (
              <button key={g} onClick={() => toggleGoal(g)}
                style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: `1px solid ${form.goals.includes(g) ? '#34d399' : 'rgba(255,255,255,0.12)'}`,
                  background: form.goals.includes(g) ? 'rgba(52,211,153,0.15)' : 'transparent',
                  color: form.goals.includes(g) ? '#34d399' : 'rgba(255,255,255,0.6)' }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <Field label="Health conditions (optional, comma-separated)" value={form.conditions} onChange={v => setForm(f => ({ ...f, conditions: v }))} placeholder="e.g. diabetes, hypertension" />

        <button onClick={submit} disabled={!form.name || !form.age}
          style={{ padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer',
            background: (!form.name || !form.age) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#34d399,#10b981)',
            color: (!form.name || !form.age) ? 'rgba(255,255,255,0.3)' : '#000' }}>
          Start tracking →
        </button>
      </div>
    </main>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#fff',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
    </div>
  )
}
