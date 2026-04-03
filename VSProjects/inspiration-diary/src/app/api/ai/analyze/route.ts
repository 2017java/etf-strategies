import { NextRequest, NextResponse } from 'next/server'
import { analyzeInspiration, expandInspiration } from '@/lib/ai/qwen'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, action } = body

    if (action === 'expand') {
      const expanded = await expandInspiration(content)
      return NextResponse.json({ expanded })
    }

    const analysis = await analyzeInspiration(content)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    )
  }
}
