'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Lightbulb,
  Image as ImageIcon,
  Mic,
  ArrowLeft,
  Trash2,
  Loader2,
  Sparkles,
  CheckSquare,
  ExternalLink
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface InspirationDetailProps {
  inspiration: {
    id: string
    content: string
    type: string
    imageUrl: string | null
    imageDesc: string | null
    audioUrl: string | null
    emotion: string | null
    status: string
    keywords: string[]
    analysis: any
    createdAt: string
    tags: Array<{
      tag: {
        id: string
        name: string
        color: string
      }
    }>
    todo?: {
      id: string
      title: string
      status: string
    } | null
  }
}

const emotionLabels: Record<string, string> = {
  excited: '兴奋',
  calm: '平静',
  confused: '困惑',
  anxious: '焦虑',
  hopeful: '期待',
  other: '其他',
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  todo: '已转待办',
  done: '已完成',
}

export function InspirationDetail({ inspiration }: InspirationDetailProps) {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [expandedContent, setExpandedContent] = useState('')

  const typeIcon = {
    text: Lightbulb,
    image: ImageIcon,
    voice: Mic,
  }[inspiration.type] || Lightbulb

  const TypeIcon = typeIcon

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inspiration.content, action: 'expand' })
      })
      const data = await res.json()
      setExpandedContent(data.expanded)
    } catch (error) {
      console.error('Error expanding:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConvertToTodo = async () => {
    setIsConverting(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inspiration.content })
      })
      const analysis = await res.json()

      const todoRes = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inspiration.content.slice(0, 50),
          description: inspiration.content,
          inspirationId: inspiration.id,
          subTasks: analysis.suggestions || []
        })
      })

      if (todoRes.ok) {
        router.push('/todos')
      }
    } catch (error) {
      console.error('Error converting to todo:', error)
    } finally {
      setIsConverting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这条灵感吗？')) return

    try {
      await fetch(`/api/inspirations/${inspiration.id}`, {
        method: 'DELETE'
      })
      router.push('/')
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TypeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>灵感详情</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDate(inspiration.createdAt)}
                </p>
              </div>
            </div>
            <Badge>{statusLabels[inspiration.status] || inspiration.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {inspiration.imageUrl && (
            <img
              src={inspiration.imageUrl}
              alt=""
              className="w-full max-h-96 object-contain rounded-lg"
            />
          )}

          <div>
            <p className="whitespace-pre-wrap">{inspiration.content}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {inspiration.tags.map((t) => (
              <Badge
                key={t.tag.id}
                variant="outline"
                style={{ borderColor: t.tag.color }}
              >
                {t.tag.name}
              </Badge>
            ))}
            {inspiration.emotion && (
              <Badge variant="secondary">
                {emotionLabels[inspiration.emotion] || inspiration.emotion}
              </Badge>
            )}
          </div>

          {inspiration.keywords && inspiration.keywords.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">关键词</p>
              <div className="flex flex-wrap gap-1">
                {inspiration.keywords.map((keyword, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              AI扩展
            </Button>
            {inspiration.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConvertToTodo}
                disabled={isConverting}
              >
                {isConverting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckSquare className="h-4 w-4 mr-1" />
                )}
                转为待办
              </Button>
            )}
            {inspiration.todo && (
              <Link href={`/todos#${inspiration.todo.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  查看待办
                </Button>
              </Link>
            )}
          </div>

          {expandedContent && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">AI扩展内容</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{expandedContent}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
