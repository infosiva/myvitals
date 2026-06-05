'use client'
import { motion } from 'framer-motion'
import type { DayLog, HealthProfile } from '@/lib/types'

interface Props {
  log: DayLog
  profile: HealthProfile | null
}

const DEFAULT_GOALS = {
  steps: 10000,
  sleep: 8,
  water: 8,
  exercise: 30,
}

export default function GoalProgressBars({ log, profile: _profile }: Props) {
  // Profile doesn't store numeric goals, so use defaults
  const goals = DEFAULT_GOALS

  const bars = [
    {
      icon: '👟',
      label: 'Steps',
      actual: log.steps,
      goal: goals.steps,
      color: '#34d399',
      fmt: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v),
      goalFmt: (v: number) => `${(v / 1000).toFixed(0)}k`,
    },
    {
      icon: '😴',
      label: 'Sleep',
      actual: log.sleep,
      goal: goals.sleep,
      color: '#818cf8',
      fmt: (v: number) => `${v}h`,
      goalFmt: (v: number) => `${v}h`,
    },
    {
      icon: '💧',
      label: 'Water',
      actual: log.water,
      goal: goals.water,
      color: '#38bdf8',
      fmt: (v: number) => `${v} gl`,
      goalFmt: (v: number) => `${v} gl`,
    },
    {
      icon: '🏃',
      label: 'Exercise',
      actual: log.exercise,
      goal: goals.exercise,
      color: '#fb923c',
      fmt: (v: number) => `${v}m`,
      goalFmt: (v: number) => `${v}m`,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
      style={{
        padding: '0 24px 16px',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      <div style={{
        background: '#0d1a12',
        border: '1px solid rgba(52,211,153,0.1)',
        borderRadius: 16,
        padding: '14px 16px',
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Daily Goals
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
          {bars.map((bar, i) => {
            const pct = Math.min((bar.actual / bar.goal) * 100, 100)
            const reached = bar.actual >= bar.goal
            return (
              <motion.div
                key={bar.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {bar.icon} {bar.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: reached ? bar.color : 'rgba(255,255,255,0.3)' }}>
                    {bar.fmt(bar.actual)}{reached ? ' ✓' : ` / ${bar.goalFmt(bar.goal)}`}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                      height: '100%',
                      background: bar.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
