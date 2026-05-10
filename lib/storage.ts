import type { DayLog, HealthProfile } from './types'

const PREFIX = 'healthtracker_'

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function getProfile(): HealthProfile | null {
  try { return JSON.parse(localStorage.getItem(PREFIX + 'profile') ?? 'null') } catch { return null }
}
export function saveProfile(p: HealthProfile) {
  localStorage.setItem(PREFIX + 'profile', JSON.stringify(p))
}

export function getLog(date: string): DayLog {
  try {
    const raw = localStorage.getItem(PREFIX + 'log_' + date)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { date, water: 0, sleep: 0, steps: 0, mood: 0, exercise: 0, meals: [] }
}
export function saveLog(log: DayLog) {
  localStorage.setItem(PREFIX + 'log_' + log.date, JSON.stringify(log))
}

export function getLast30Days(): DayLog[] {
  const logs: DayLog[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    logs.push(getLog(d))
  }
  return logs.reverse()
}

export function getStreak(): number {
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    const log = getLog(d)
    const logged = log.water > 0 || log.sleep > 0 || log.steps > 0 || log.mood > 0
    if (i === 0 && !logged) continue  // today not yet logged — don't break streak
    if (i > 0 && !logged) break
    if (logged) streak++
  }
  return streak
}

export function healthScore(log: DayLog): number {
  let score = 0
  if (log.water >= 8) score += 20
  else if (log.water >= 5) score += 12
  else if (log.water >= 2) score += 5
  if (log.sleep >= 7 && log.sleep <= 9) score += 20
  else if (log.sleep >= 6) score += 12
  else if (log.sleep >= 4) score += 5
  if (log.steps >= 10000) score += 20
  else if (log.steps >= 7000) score += 14
  else if (log.steps >= 4000) score += 8
  else if (log.steps >= 1000) score += 3
  if (log.mood >= 4) score += 20
  else if (log.mood >= 3) score += 12
  else if (log.mood >= 2) score += 6
  if (log.exercise >= 30) score += 20
  else if (log.exercise >= 15) score += 12
  else if (log.exercise > 0) score += 5
  return score
}
