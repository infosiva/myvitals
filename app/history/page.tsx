'use client'
import { useState, useEffect } from 'react'
import { getLast30Days, healthScore } from '@/lib/storage'
import type { DayLog } from '@/lib/types'
import { MOOD_LABELS, MOOD_COLORS } from '@/lib/types'
import TrendSparklines from '@/components/TrendSparklines'

export default function HistoryPage() {
  const [logs, setLogs] = useState<DayLog[]>([])

  useEffect(() => {
    const all = getLast30Days().filter(l => l.water > 0 || l.sleep > 0 || l.steps > 0 || l.mood > 0)
    setLogs(all.reverse())
  }, [])

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px', background: 'var(--background, #f0fdfa)' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>📅 30-Day History</h1>
      <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>All logged days in the past 30 days</p>

      {logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
          <p>No logs yet. Start tracking on the dashboard!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {logs.map(log => {
          const sc = healthScore(log)
          const scoreColor = sc >= 80 ? '#10b981' : sc >= 60 ? '#34d399' : sc >= 40 ? '#f59e0b' : '#ef4444'
          return (
            <div key={log.date} className="history-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <div className="history-date" style={{ minWidth: 80 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{formatDate(log.date)}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{log.date}</p>
              </div>
              <div className="history-metrics" style={{ flex: 1, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Metric icon="💧" value={log.water} unit="gl" />
                <Metric icon="😴" value={log.sleep} unit="hr" />
                <Metric icon="👟" value={log.steps >= 1000 ? `${(log.steps/1000).toFixed(1)}k` : log.steps} unit="steps" />
                <Metric icon="🏃" value={log.exercise} unit="min" />
                {log.mood > 0 && <span style={{ fontSize: 13, color: MOOD_COLORS[log.mood] }}>{MOOD_LABELS[log.mood]}</span>}
              </div>
              <div style={{ textAlign: 'center', minWidth: 48 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor }}>{sc}</span>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>score</p>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

function Metric({ icon, value, unit }: { icon: string; value: any; unit: string }) {
  return (
    <span style={{ fontSize: 13, color: '#475569' }}>
      {icon} <strong style={{ color: '#0f172a' }}>{value}</strong> {unit}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
