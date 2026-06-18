'use client'
import { useEffect, useState } from 'react'

interface Stats { checksLogged: number; insightsGenerated: number }

export default function LiveStatsBar() {
  const [stats, setStats] = useState<Stats>({ checksLogged: 0, insightsGenerated: 0 })

  useEffect(() => {
    fetch('/api/session-stats').then(r => r.json()).then(setStats).catch(() => {})
    const t = setInterval(() => {
      fetch('/api/session-stats').then(r => r.json()).then(setStats).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  if (!stats.checksLogged && !stats.insightsGenerated) return null

  return (
    <div className="border-y py-3 px-5" style={{ background: 'var(--surface-2,#ccfbf1)', borderColor: 'var(--border,rgba(13,148,136,0.18))' }}>
      <div className="mx-auto flex max-w-5xl justify-center gap-8 flex-wrap">
        {stats.checksLogged > 0 && (
          <div className="text-center">
            <span className="block text-[20px] font-black tabular-nums" style={{ color: 'var(--accent,#0d9488)' }}>{stats.checksLogged}</span>
            <span className="text-[11px] text-slate-500">health checks this session</span>
          </div>
        )}
        {stats.insightsGenerated > 0 && (
          <div className="text-center">
            <span className="block text-[20px] font-black tabular-nums" style={{ color: 'var(--accent,#0d9488)' }}>{stats.insightsGenerated}</span>
            <span className="text-[11px] text-slate-500">AI insights generated</span>
          </div>
        )}
      </div>
    </div>
  )
}
