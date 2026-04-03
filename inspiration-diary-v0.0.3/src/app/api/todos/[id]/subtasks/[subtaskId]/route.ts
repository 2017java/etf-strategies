import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { id, subtaskId } = await params
    const body = await request.json()
    const { completed } = body

    const subTask = await prisma.subTask.update({
      where: { id: subtaskId },
      data: { completed }
    })

    return NextResponse.json(subTask)
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    )
  }
}
