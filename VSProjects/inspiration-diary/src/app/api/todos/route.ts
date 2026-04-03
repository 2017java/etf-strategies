import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (priority && priority !== 'all') {
      where.priority = priority
    }

    const todos = await prisma.todo.findMany({
      where,
      include: {
        inspiration: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        },
        subTasks: true
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(todos)
  } catch (error) {
    console.error('Error fetching todos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority, dueDate, inspirationId, subTasks } = body

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        subTasks: subTasks ? {
          create: subTasks.map((title: string) => ({ title }))
        } : undefined
      },
      include: {
        subTasks: true
      }
    })

    if (inspirationId) {
      await prisma.inspiration.update({
        where: { id: inspirationId },
        data: {
          status: 'todo',
          todoId: todo.id
        }
      })
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    )
  }
}
