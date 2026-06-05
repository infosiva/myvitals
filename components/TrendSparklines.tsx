'use client'
import { useState, useEffect } from 'react'

const PREFIX = 'healthtracker_'

interface DayData {
  date: string
  sleep: number
  steps: number
  water: number
  mood: number
}

function getLast7Days(): DayData[] {
  const days: DayData[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    try {
      const raw = localStorage.getItem(PREFIX + 'log_' + d)
      if (raw) {
        const parsed = JSON.parse(raw)
        days.push({ date: d, sleep: parsed.sleep ?? 0, steps: parsed.steps ?? 0, water: parsed.water ?? 0, mood: parsed.mood ?? 0 })
      } else {
        days.push({ date: d, sleep: 0, steps: 0, water: 0, mood: 0 })
      }
    } catch {
      days.push({ date: d, sleep: 0, steps: 0, water: 0, mood: 0 })
    }
  }
  return days
}

function dayInitial(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' }).charAt(0)
}

interface ChartProps {
  days: DayData[]
  accessor: (d: DayData) => number
  max: number
  color: string
  label: string
  unit: string
}

function MiniBarChart({ days, accessor, max, color, label, unit }: ChartProps) {
  const MAX_BAR_HEIGHT = 48

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '12px 14px',
    }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        color: color,
        marginBottom: 10,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: MAX_BAR_HEIGHT + 20 }}>
        {days.map((d) => {
          const v = accessor(d)
          const pct = max > 0 ? Math.min(v / max, 1) : 0
          const barH = Math.max(pct * MAX_BAR_HEIGHT, v > 0 ? 3 : 0)
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: MAX_BAR_HEIGHT }}>
                <div
                  style={{
                    width: '100%',
                    height: barH,
                    background: v > 0 ? color : 'rgba(255,255,255,0.06)',
                    borderRadius: '3px 3px 2px 2px',
                    opacity: v > 0 ? 0.85 : 0.4,
                    transition: 'height 0.4s cubic-bezier(0.23,1,0.32,1)',
                  }}
                />
              </div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                {dayInitial(d.date)}
              </span>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 6, textAlign: 'right' }}>
        last 7 days · {unit}
      </p>
    </div>
  )
}

export default function TrendSparklines() {
  const [days, setDays] = useState<DayData[]>([])

  useEffect(() => {
    setDays(getLast7Days())
  }, [])

  if (days.length === 0) return null

  const hasAnyData = days.some(d => d.sleep > 0 || d.steps > 0 || d.water > 0 || d.mood > 0)
  if (!hasAnyData) return null

  return (
    <section style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        7-Day Trends
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
        Your last 7 logged days at a glance
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
      }}>
        <MiniBarChart
          days={days}
          accessor={d => d.sleep}
          max={10}
          color="#818cf8"
          label="Sleep"
          unit="hours"
        />
        <MiniBarChart
          days={days}
          accessor={d => d.steps}
          max={12000}
          color="#34d399"
          label="Steps"
          unit="steps"
        />
        <MiniBarChart
          days={days}
          accessor={d => d.water}
          max={10}
          color="#38bdf8"
          label="Water"
          unit="glasses"
        />
        <MiniBarChart
          days={days}
          accessor={d => d.mood}
          max={5}
          color="#fbbf24"
          label="Mood"
          unit="/ 5"
        />
      </div>
      <style>{`
        @media (max-width: 480px) {
          .trend-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  )
}
