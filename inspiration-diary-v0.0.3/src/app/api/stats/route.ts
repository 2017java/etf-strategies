import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    const [
      totalInspirations,
      pendingInspirations,
      todoInspirations,
      doneInspirations,
      totalTodos,
      pendingTodos,
      inProgressTodos,
      doneTodos,
      inspirationsByType,
      inspirationsByEmotion,
      recentInspirations,
      tagStats
    ] = await Promise.all([
      prisma.inspiration.count({ where: dateFilter }),
      prisma.inspiration.count({ where: { ...dateFilter, status: 'pending' } }),
      prisma.inspiration.count({ where: { ...dateFilter, status: 'todo' } }),
      prisma.inspiration.count({ where: { ...dateFilter, status: 'done' } }),
      prisma.todo.count({ where: dateFilter }),
      prisma.todo.count({ where: { ...dateFilter, status: 'pending' } }),
      prisma.todo.count({ where: { ...dateFilter, status: 'in_progress' } }),
      prisma.todo.count({ where: { ...dateFilter, status: 'done' } }),
      prisma.inspiration.groupBy({
        by: ['type'],
        where: dateFilter,
        _count: true
      }),
      prisma.inspiration.groupBy({
        by: ['emotion'],
        where: { ...dateFilter, emotion: { not: null } },
        _count: true
      }),
      prisma.inspiration.findMany({
        where: dateFilter,
        select: {
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      prisma.tag.findMany({
        include: {
          _count: {
            select: { inspirations: true }
          }
        }
      })
    ])

    const dailyStats = recentInspirations.reduce((acc: any, curr) => {
      const date = curr.createdAt.toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    const trendData = Object.entries(dailyStats).map(([date, count]) => ({
      date,
      count
    }))

    return NextResponse.json({
      inspirations: {
        total: totalInspirations,
        pending: pendingInspirations,
        todo: todoInspirations,
        done: doneInspirations,
        conversionRate: totalInspirations > 0 
          ? ((todoInspirations + doneInspirations) / totalInspirations * 100).toFixed(1)
          : 0,
        byType: inspirationsByType,
        byEmotion: inspirationsByEmotion
      },
      todos: {
        total: totalTodos,
        pending: pendingTodos,
        inProgress: inProgressTodos,
        done: doneTodos,
        completionRate: totalTodos > 0 
          ? (doneTodos / totalTodos * 100).toFixed(1)
          : 0
      },
      trend: trendData,
      tags: tagStats.map(t => ({
        name: t.name,
        color: t.color,
        count: t._count.inspirations
      }))
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
