'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  Image as ImageIcon, 
  Mic, 
  MoreVertical,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react'
import { formatDate, truncate } from '@/lib/utils'
import Link from 'next/link'

interface Inspiration {
  id: string
  content: string
  type: string
  imageUrl: string | null
  imageDesc: string | null
  emotion: string | null
  status: string
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

interface InspirationCardProps {
  inspiration: Inspiration
  onDelete?: (id: string) => void
}

const emotionLabels: Record<string, string> = {
  excited: '兴奋',
  calm: '平静',
  confused: '困惑',
  anxious: '焦虑',
  hopeful: '期待',
  other: '其他',
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  pending: { label: '待处理', icon: Clock, color: 'text-yellow-500' },
  todo: { label: '已转待办', icon: Loader2, color: 'text-blue-500' },
  done: { label: '已完成', icon: CheckCircle2, color: 'text-green-500' },
}

export function InspirationCard({ inspiration, onDelete }: InspirationCardProps) {
  const typeIcon = {
    text: Lightbulb,
    image: ImageIcon,
    voice: Mic,
  }[inspiration.type] || Lightbulb

  const TypeIcon = typeIcon
  const status = statusConfig[inspiration.status] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <TypeIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/${inspiration.id}`}>
                <p className="text-sm line-clamp-3 hover:text-primary cursor-pointer">
                  {truncate(inspiration.content, 200)}
                </p>
              </Link>
              {inspiration.imageUrl && (
                <img 
                  src={inspiration.imageUrl} 
                  alt="" 
                  className="mt-2 w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {inspiration.tags.map((t) => (
                  <Badge 
                    key={t.tag.id} 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: t.tag.color }}
                  >
                    {t.tag.name}
                  </Badge>
                ))}
                {inspiration.emotion && (
                  <Badge variant="secondary" className="text-xs">
                    {emotionLabels[inspiration.emotion] || inspiration.emotion}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <StatusIcon className={`h-3 w-3 ${status.color}`} />
                <span>{status.label}</span>
                <span>·</span>
                <span>{formatDate(inspiration.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
