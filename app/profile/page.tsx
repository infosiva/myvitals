'use client'
import { useState, useEffect } from 'react'
import { getProfile, saveProfile } from '@/lib/storage'
import type { HealthProfile } from '@/lib/types'

export default function ProfilePage() {
  const [form, setForm] = useState({ name: '', age: '', gender: 'male', heightCm: '', weightKg: '', goals: [] as string[], conditions: '' })
  const [saved, setSaved] = useState(false)

  const GOALS = ['Lose weight', 'Sleep better', 'More energy', 'Reduce stress', 'Build fitness', 'Eat healthier']

  useEffect(() => {
    const p = getProfile()
    if (p) setForm({ name: p.name, age: String(p.age), gender: p.gender, heightCm: String(p.heightCm), weightKg: String(p.weightKg), goals: p.goals, conditions: p.conditions?.join(', ') ?? '' })
  }, [])

  function toggleGoal(g: string) {
    setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }))
  }

  function save() {
    const profile: HealthProfile = {
      name: form.name, age: parseInt(form.age),
      gender: form.gender as any, heightCm: parseFloat(form.heightCm),
      weightKg: parseFloat(form.weightKg), goals: form.goals,
      conditions: form.conditions ? form.conditions.split(',').map(s => s.trim()) : [],
    }
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>⚙️ Your Profile</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 28, fontSize: 14 }}>Used to personalise your AI health insights</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
        <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Siva" />
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
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 10 }}>Health goals</label>
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

        <Field label="Health conditions (comma-separated)" value={form.conditions} onChange={v => setForm(f => ({ ...f, conditions: v }))} placeholder="e.g. diabetes, hypertension" />

        <button onClick={save} style={{ padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg,#34d399,#10b981)',
          color: saved ? '#34d399' : '#000', transition: 'all 0.3s' }}>
          {saved ? '✓ Saved!' : 'Save Profile'}
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
