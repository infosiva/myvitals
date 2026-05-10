import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import type { HealthProfile } from '@/lib/types'

const SYSTEM = `You are a health data extraction assistant. Extract health metrics from natural language.
Return ONLY valid JSON, no markdown, no explanation.`

export async function POST(req: NextRequest) {
  const { text, profile }: { text: string; profile?: HealthProfile } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'No text' }, { status: 400 })

  const profileCtx = profile
    ? `User profile: ${profile.age}yo ${profile.gender}, ${profile.weightKg}kg, goals: ${profile.goals.join(', ')}.`
    : ''

  const prompt = `${profileCtx}
Extract health metrics from this text: "${text}"

Return JSON with exactly these fields (use null for missing, do not guess):
{
  "water": <glasses of water, integer 0-20 or null>,
  "sleep": <hours slept, number or null>,
  "steps": <steps count, integer or null>,
  "mood": <mood 1-5 where 1=rough 5=great, integer or null>,
  "exercise": <exercise minutes, integer or null>,
  "meals": <array of meal descriptions mentioned, or []>,
  "weight": <body weight in kg, number or null>,
  "notes": <anything else health-related worth noting, string or null>,
  "anomalies": <array of strings flagging anything unusual or possibly mistyped>
}`

  try {
    const raw = await aiChat([{ role: 'user', content: prompt }], SYSTEM, 600, 'fast')
    // Extract JSON from response
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const parsed = JSON.parse(match[0])

    // Validate ranges and add anomalies
    const anomalies: string[] = parsed.anomalies || []
    if (parsed.steps > 50000) anomalies.push(`${parsed.steps} steps seems very high — is that correct?`)
    if (parsed.sleep > 14) anomalies.push(`${parsed.sleep}h sleep seems unusually long`)
    if (parsed.water > 15) anomalies.push(`${parsed.water} glasses of water seems very high`)
    if (parsed.exercise > 300) anomalies.push(`${parsed.exercise} min exercise — confirm this is right`)

    return NextResponse.json({ parsed, anomalies })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
