'use client'

import { useState, useEffect } from 'react'
import { InspirationCard } from './inspiration-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
}

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
    tag: Tag
  }>
  todo?: {
    id: string
    title: string
    status: string
  } | null
}

interface InspirationListProps {
  initialInspirations: Inspiration[]
  tags: Tag[]
}

export function InspirationList({ initialInspirations, tags }: InspirationListProps) {
  const [inspirations, setInspirations] = useState(initialInspirations)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchInspirations = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (typeFilter !== 'all') params.append('type', typeFilter)
        if (selectedTag) params.append('tagId', selectedTag)
        if (search) params.append('search', search)

        const res = await fetch(`/api/inspirations?${params}`)
        const data = await res.json()
        setInspirations(data)
      } catch (error) {
        console.error('Error fetching inspirations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(fetchInspirations, 300)
    return () => clearTimeout(debounce)
  }, [search, statusFilter, typeFilter, selectedTag])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSelectedTag(null)
  }

  const hasActiveFilters = search || statusFilter !== 'all' || typeFilter !== 'all' || selectedTag

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索灵感..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待处理</SelectItem>
              <SelectItem value="todo">已转待办</SelectItem>
              <SelectItem value="done">已完成</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="text">文字</SelectItem>
              <SelectItem value="image">图片</SelectItem>
              <SelectItem value="voice">语音</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTag === tag.id ? 'default' : 'outline'}
              className="cursor-pointer"
              style={{ 
                backgroundColor: selectedTag === tag.id ? tag.color : 'transparent',
                borderColor: tag.color
              }}
              onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            清除筛选
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          加载中...
        </div>
      ) : inspirations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {hasActiveFilters ? '没有找到符合条件的灵感' : '还没有记录任何灵感，点击右上角开始记录'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inspirations.map((inspiration) => (
            <InspirationCard key={inspiration.id} inspiration={inspiration} />
          ))}
        </div>
      )}
    </div>
  )
}
