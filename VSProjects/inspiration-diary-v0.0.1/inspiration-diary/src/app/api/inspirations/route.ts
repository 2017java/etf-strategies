import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const tagId = searchParams.get('tagId')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    if (type && type !== 'all') {
      where.type = type
    }
    if (tagId) {
      where.tags = {
        some: { tagId }
      }
    }
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { imageDesc: { contains: search, mode: 'insensitive' } },
      ]
    }

    const inspirations = await prisma.inspiration.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        todo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(inspirations)
  } catch (error) {
    console.error('Error fetching inspirations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspirations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, type, imageUrl, imageDesc, audioUrl, emotion, tagIds } = body

    const inspiration = await prisma.inspiration.create({
      data: {
        content,
        type,
        imageUrl,
        imageDesc,
        audioUrl,
        emotion,
        tags: tagIds ? {
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        } : undefined
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json(inspiration)
  } catch (error) {
    console.error('Error creating inspiration:', error)
    return NextResponse.json(
      { error: 'Failed to create inspiration' },
      { status: 500 }
    )
  }
}
