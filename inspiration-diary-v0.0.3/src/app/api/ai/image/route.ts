import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/ai/qwen-vl'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl } = body

    const description = await analyzeImage(imageUrl)
    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error in image analysis:', error)
    return NextResponse.json(
      { error: 'Image analysis failed' },
      { status: 500 }
    )
  }
}
