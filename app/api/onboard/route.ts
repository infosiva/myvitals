import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'

const SYSTEM = `You are a health onboarding assistant extracting user profile info from conversation.
Return ONLY valid JSON, no markdown, no explanation.`

export async function POST(req: NextRequest) {
  const { messages }: { messages: Array<{ role: 'user' | 'assistant'; content: string }> } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const extractPrompt = `Based on this conversation, extract the user's health profile.

Return JSON with exactly these fields (use null for genuinely unknown):
{
  "name": <first name or null>,
  "age": <integer age or null>,
  "gender": <"male" | "female" | "other" | null>,
  "heightCm": <height in cm, convert from ft/in if needed, number or null>,
  "weightKg": <weight in kg, convert from lbs if needed, number or null>,
  "goals": <array of goal strings, e.g. ["lose weight","sleep better"] or []>,
  "complete": <true if name+age+at least 1 goal are all known, else false>,
  "nextQuestion": <a warm, concise follow-up question to ask if complete=false, or null>
}`

  try {
    const aiMessages = [...messages, { role: 'user' as const, content: extractPrompt }]
    const raw = await aiChat(aiMessages, SYSTEM, 500, 'fast')
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const result = JSON.parse(match[0])
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
