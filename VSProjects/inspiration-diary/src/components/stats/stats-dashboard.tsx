'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Lightbulb,
  CheckSquare,
  Clock,
  TrendingUp,
  PieChart,
  BarChart3
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

interface Stats {
  inspirations: {
    total: number
    pending: number
    todo: number
    done: number
    conversionRate: string
    byType: Array<{ type: string; _count: number }>
    byEmotion: Array<{ emotion: string; _count: number }>
  }
  todos: {
    total: number
    pending: number
    inProgress: number
    done: number
    completionRate: string
  }
  trend: Array<{ date: string; count: number }>
  tags: Array<{ name: string; color: string; count: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const emotionLabels: Record<string, string> = {
  excited: '兴奋',
  calm: '平静',
  confused: '困惑',
  anxious: '焦虑',
  hopeful: '期待',
  other: '其他',
}

const typeLabels: Record<string, string> = {
  text: '文字',
  image: '图片',
  voice: '语音',
}

export function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        加载中...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        无法加载统计数据
      </div>
    )
  }

  const pieData = stats.inspirations.byType.map(item => ({
    name: typeLabels[item.type] || item.type,
    value: item._count
  }))

  const emotionData = stats.inspirations.byEmotion.map(item => ({
    name: emotionLabels[item.emotion || ''] || item.emotion,
    value: item._count
  }))

  const todoData = [
    { name: '待办', value: stats.todos.pending, fill: '#f59e0b' },
    { name: '进行中', value: stats.todos.inProgress, fill: '#3b82f6' },
    { name: '已完成', value: stats.todos.done, fill: '#10b981' },
  ]

  const tagData = stats.tags.slice(0, 10).map(t => ({
    name: t.name,
    count: t.count,
    fill: t.color
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">灵感总数</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inspirations.total}</div>
            <p className="text-xs text-muted-foreground">
              转化率 {stats.inspirations.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待办总数</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todos.total}</div>
            <p className="text-xs text-muted-foreground">
              完成率 {stats.todos.completionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理灵感</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inspirations.pending}</div>
            <p className="text-xs text-muted-foreground">
              等待转化
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成待办</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todos.done}</div>
            <p className="text-xs text-muted-foreground">
              已完成任务
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              灵感趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="灵感数量"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              灵感类型分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              待办状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.todos.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={todoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="数量" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              标签使用统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tagData.length > 0 ? (
              <div className="space-y-3">
                {tagData.map((tag, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.fill }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                    <Badge variant="secondary">{tag.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {emotionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              情绪分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={emotionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {emotionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
