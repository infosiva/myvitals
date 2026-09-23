import { reportToTaskFlow } from '@/lib/reportToTaskFlow'
import { AI_LIMITER } from '@/lib/rateLimit'
import { aiChat } from '@/lib/ai'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: NextRequest) {
  const limited = AI_LIMITER.check(req)
  if (limited) return limited
  try {
    const body = await req.json()
    const messages: Message[] = body.messages
    const systemPrompt: string = body.systemPrompt ?? `You are VitalsBot, the AI health coach for MyVitals.
Help users understand health metrics, give evidence-based nutrition and fitness advice, explain sleep and stress management.
Keep responses concise, encouraging, and practical. Always recommend consulting a doctor for medical decisions.
Never diagnose conditions or prescribe medication.
If asked anything outside health/wellness coaching, respond: "I'm trained for MyVitals health coaching. For that, try Google or ChatGPT!"`

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    const chatMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const text = await aiChat(chatMessages, systemPrompt, 400, 'fast')

    void reportToTaskFlow({ project: 'myvitals', agentName: 'ChatBot', status: 'completed', message: 'Chat message processed' })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const chunkSize = 12
        for (let i = 0; i < text.length; i += chunkSize) {
          controller.enqueue(encoder.encode(text.slice(i, i + chunkSize)))
          await new Promise((r) => setTimeout(r, 8))
        }
        controller.close()
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[/api/chat]', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
