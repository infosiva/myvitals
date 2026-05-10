export interface DayLog {
  date: string          // YYYY-MM-DD
  water: number         // glasses (0-10)
  sleep: number         // hours (0-12)
  steps: number         // 0-30000
  mood: number          // 1-5
  exercise: number      // minutes
  meals: string[]       // free text meal descriptions
  weight?: number       // kg, optional
  notes?: string
}

export interface HealthProfile {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  heightCm: number
  weightKg: number
  goals: string[]       // e.g. ['lose weight', 'sleep better', 'more energy']
  conditions?: string[] // e.g. ['diabetes', 'hypertension'] — optional
}

export type Mood = 1 | 2 | 3 | 4 | 5
export const MOOD_LABELS: Record<number, string> = { 1: '😞 Rough', 2: '😕 Low', 3: '😐 Okay', 4: '😊 Good', 5: '🤩 Great' }
export const MOOD_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#10b981' }

export interface WeeklyInsight {
  score: number           // 0-100
  summary: string         // 2-3 sentence narrative
  wins: string[]          // what went well
  improvements: string[]  // what to work on
  tip: string             // one actionable tip for next week
  alert?: string          // if something concerning (e.g. very low sleep)
}
