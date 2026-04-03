import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/ai/asr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audioUrl } = body

    const text = await transcribeAudio(audioUrl)
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Error in voice transcription:', error)
    return NextResponse.json(
      { error: 'Voice transcription failed' },
      { status: 500 }
    )
  }
}
