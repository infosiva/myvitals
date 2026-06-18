import { NextRequest, NextResponse } from 'next/server'

let counts = { checksLogged: 0, insightsGenerated: 0 }

export async function GET() { return NextResponse.json(counts) }

export async function POST(req: NextRequest) {
  const { event } = await req.json()
  if (event === 'check_logged') counts.checksLogged++
  if (event === 'insight_generated') counts.insightsGenerated++
  return NextResponse.json({ ok: true })
}
