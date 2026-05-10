'use client'
import { useState, useEffect } from 'react'
import { getProfile, getLast30Days } from '@/lib/storage'
import type { WeeklyInsight } from '@/lib/types'

export default function InsightsPage() {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState<WeeklyInsight & { hydrationNote?: string; sleepNote?: string; activityNote?: string; moodTrend?: string; alert?: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const cached = sessionStorage.getItem('healthpulse_insight')
    if (cached) {
      try { setInsight(JSON.parse(cached)) } catch {}
    }
  }, [])

  async function generate() {
    setLoading(true)
    setError('')
    const profile = getProfile()
    const logs = getLast30Days().slice(-7)
    try {
      const res = await fetch('/api/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logs, profile }) })
      const data = await res.json()
      if (data.insights) {
        setInsight(data.insights)
        sessionStorage.setItem('healthpulse_insight', JSON.stringify(data.insights))
      } else {
        setError(data.error ?? 'Unknown error')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = insight ? (insight.score >= 80 ? '#10b981' : insight.score >= 60 ? '#34d399' : insight.score >= 40 ? '#f59e0b' : '#ef4444') : '#34d399'

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>🧠 AI Health Insights</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 4, fontSize: 15 }}>
          Personalised weekly narrative — like your doctor-friend reviewing your health data.
        </p>
      </div>

      {!insight && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🩺</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Ready to analyse your week?</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Our AI reviews your past 7 days of logs and gives you a detailed, personalised health narrative with wins, improvements, and a science-backed tip.
          </p>
          <button onClick={generate} style={{ padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#34d399,#10b981)', color: '#000' }}>
            Generate my insight
          </button>
          {error && <p style={{ color: '#ef4444', marginTop: 16, fontSize: 14 }}>{error}</p>}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(52,211,153,0.2)', borderTopColor: '#34d399', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#34d399', fontWeight: 600 }}>Analysing your health data…</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>This takes about 10 seconds</p>
        </div>
      )}

      {insight && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.4s ease-out' }}>
          {/* Score + summary */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${scoreColor}30`, borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{insight.score}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>wellness score</div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>{insight.summary}</p>
              </div>
            </div>
            {insight.alert && (
              <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <p style={{ fontSize: 14, color: '#fca5a5', lineHeight: 1.5 }}>{insight.alert}</p>
              </div>
            )}
          </div>

          {/* Wins + Improvements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginBottom: 14 }}>✅ Wins this week</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insight.wins.map((w, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: '#34d399', fontSize: 14, marginTop: 1 }}>→</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fb923c', marginBottom: 14 }}>📈 Focus areas</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insight.improvements.map((w, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: '#fb923c', fontSize: 14, marginTop: 1 }}>→</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detail notes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            <NoteCard icon="💧" title="Hydration" note={insight.hydrationNote} color="#38bdf8" />
            <NoteCard icon="😴" title="Sleep" note={insight.sleepNote} color="#818cf8" />
            <NoteCard icon="🏃" title="Activity" note={insight.activityNote} color="#fb923c" />
            <NoteCard icon="😊" title="Mood Trend" note={insight.moodTrend} color="#f472b6" />
          </div>

          {/* Tip */}
          <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.1),rgba(16,185,129,0.05))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginBottom: 10 }}>💡 Science-backed tip for next week</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{insight.tip}</p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={generate} disabled={loading}
              style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              Regenerate
            </button>
            <a href="/" style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: 'none', background: 'rgba(52,211,153,0.15)', color: '#34d399', textDecoration: 'none' }}>
              Back to dashboard
            </a>
          </div>
        </div>
      )}
    </main>
  )
}

function NoteCard({ icon, title, note, color }: { icon: string; title: string; note?: string; color: string }) {
  if (!note) return null
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}18`, borderRadius: 14, padding: 18 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{icon} {title}</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{note}</p>
    </div>
  )
}
