import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { logs, profile } = await req.json()

  const system = `You are a highly empathetic personal health coach AI with expertise in preventive medicine, nutrition, exercise science, and sleep health. Your insights are warm, specific, encouraging, and medically informed — like a knowledgeable friend who happens to be a doctor. Return ONLY valid JSON, no markdown.`

  const logSummary = logs
    .filter((l: any) => l.water > 0 || l.sleep > 0 || l.steps > 0 || l.mood > 0)
    .map((l: any) => `${l.date}: water=${l.water} glasses, sleep=${l.sleep}h, steps=${l.steps}, mood=${l.mood}/5, exercise=${l.exercise}min${l.meals?.length ? ', meals: ' + l.meals.join('; ') : ''}${l.notes ? ', notes: ' + l.notes : ''}`)
    .join('\n')

  const prompt = `Analyse this person's health data for the past week and generate personalised insights.

Person profile:
- Name: ${profile?.name ?? 'User'}
- Age: ${profile?.age ?? 'unknown'}
- Gender: ${profile?.gender ?? 'unknown'}
- Goals: ${profile?.goals?.join(', ') ?? 'general health'}
${profile?.conditions?.length ? `- Health conditions: ${profile.conditions.join(', ')}` : ''}

Daily logs:
${logSummary || 'No data logged yet — give motivational onboarding advice.'}

Return this exact JSON:
{
  "score": <number 0-100 — overall weekly wellness score>,
  "summary": "<2-3 sentence personalised narrative about their week — be specific, warm, reference their actual numbers>",
  "wins": ["<specific thing they did well>", "<another win>"],
  "improvements": ["<specific actionable improvement>", "<another improvement>"],
  "tip": "<one highly specific, science-backed tip tailored to their data and goals for next week>",
  "alert": "<only include if something genuinely concerning — e.g. consistently under 5h sleep, 0 steps for 5 days. Leave empty string if no alert.>",
  "hydrationNote": "<specific comment on their water intake pattern>",
  "sleepNote": "<specific comment on sleep duration and consistency>",
  "activityNote": "<specific comment on movement and exercise>",
  "moodTrend": "<observation about mood pattern across the week>"
}`

  try {
    const { text } = await callAI(system, [{ role: 'user', content: prompt }], 1500, 'best')
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const insights = JSON.parse(cleaned)
    return NextResponse.json({ insights })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'AI error' }, { status: 500 })
  }
}
