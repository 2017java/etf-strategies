import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const todo = await prisma.todo.findUnique({
      where: { id },
      include: {
        inspiration: true,
        subTasks: true
      }
    })

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error fetching todo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
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
    const { title, description, priority, status, dueDate } = body

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined
      },
      include: {
        subTasks: true
      }
    })

    if (status === 'done') {
      const linkedInspiration = await prisma.inspiration.findFirst({
        where: { todoId: id }
      })
      if (linkedInspiration) {
        await prisma.inspiration.update({
          where: { id: linkedInspiration.id },
          data: { status: 'done' }
        })
      }
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error updating todo:', error)
    return NextResponse.json(
      { error: 'Failed to update todo' },
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
    await prisma.todo.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}
