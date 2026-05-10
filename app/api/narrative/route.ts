import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import type { DayLog, HealthProfile } from '@/lib/types'

const SYSTEM = `You are an encouraging AI health coach. Write warm, personal, data-driven summaries.
Keep it to 2 sentences max. Be specific with numbers. Never be generic.`

export async function POST(req: NextRequest) {
  const { log, profile }: { log: DayLog; profile?: HealthProfile } = await req.json()
  if (!log) return NextResponse.json({ error: 'No log data' }, { status: 400 })

  const name = profile?.name ? profile.name.split(' ')[0] : 'you'
  const goals = profile?.goals?.join(', ') || 'general health'

  const prompt = `Write a 2-sentence personal health summary for ${name} based on today's data.
Goals: ${goals}

Today's log:
- Water: ${log.water} glasses
- Sleep: ${log.sleep}h
- Steps: ${log.steps?.toLocaleString() || 0}
- Mood: ${log.mood}/5
- Exercise: ${log.exercise} min
- Meals: ${log.meals?.join(', ') || 'not logged'}
${log.weight ? `- Weight: ${log.weight}kg` : ''}
${log.notes ? `- Notes: ${log.notes}` : ''}

Be warm, specific, and motivating. Mention 1-2 metrics by name.`

  try {
    const text = await aiChat([{ role: 'user', content: prompt }], SYSTEM, 150, 'fast')
    return NextResponse.json({ narrative: text.trim() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
