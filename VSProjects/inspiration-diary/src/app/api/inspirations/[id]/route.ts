import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const inspiration = await prisma.inspiration.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        todo: {
          include: {
            subTasks: true
          }
        }
      }
    })

    if (!inspiration) {
      return NextResponse.json(
        { error: 'Inspiration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(inspiration)
  } catch (error) {
    console.error('Error fetching inspiration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspiration' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, imageUrl, imageDesc, audioUrl, emotion, status, tagIds, keywords, analysis } = body

    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (imageDesc !== undefined) updateData.imageDesc = imageDesc
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl
    if (emotion !== undefined) updateData.emotion = emotion
    if (status !== undefined) updateData.status = status
    if (keywords !== undefined) updateData.keywords = keywords
    if (analysis !== undefined) updateData.analysis = analysis

    if (tagIds) {
      await prisma.inspirationTag.deleteMany({
        where: { inspirationId: id }
      })
      
      updateData.tags = {
        create: tagIds.map((tagId: string) => ({ tagId }))
      }
    }

    const inspiration = await prisma.inspiration.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating inspiration:', error)
    return NextResponse.json(
      { error: 'Failed to update inspiration' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.inspiration.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inspiration:', error)
    return NextResponse.json(
      { error: 'Failed to delete inspiration' },
      { status: 500 }
    )
  }
}
