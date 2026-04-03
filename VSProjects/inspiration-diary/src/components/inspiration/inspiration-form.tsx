'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Lightbulb, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  Loader2, 
  X,
  Plus,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const emotions = [
  { value: 'excited', label: '兴奋', color: 'bg-yellow-500' },
  { value: 'calm', label: '平静', color: 'bg-blue-500' },
  { value: 'confused', label: '困惑', color: 'bg-purple-500' },
  { value: 'anxious', label: '焦虑', color: 'bg-red-500' },
  { value: 'hopeful', label: '期待', color: 'bg-green-500' },
  { value: 'other', label: '其他', color: 'bg-gray-500' },
]

interface Tag {
  id: string
  name: string
  color: string
}

interface InspirationFormProps {
  tags: Tag[]
}

export function InspirationForm({ tags }: InspirationFormProps) {
  const router = useRouter()
  const [type, setType] = useState<'text' | 'image' | 'voice'>('text')
  const [content, setContent] = useState('')
  const [emotion, setEmotion] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageDesc, setImageDesc] = useState<string>('')
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [newTag, setNewTag] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      setImageUrl(data.url)
      setType('image')

      setIsAnalyzing(true)
      const analyzeRes = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: data.url })
      })
      const analyzeData = await analyzeRes.json()
      setImageDesc(analyzeData.description)
      setContent(analyzeData.description)
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setIsLoading(false)
      setIsAnalyzing(false)
    }
  }

  const startRecording = async () => {
    try {
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = async () => {
    setIsRecording(false)
  }

  const handleAnalyze = async () => {
    if (!content.trim()) return

    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      
      if (data.keywords) {
        const newTags = data.keywords.filter((k: string) => 
          !tags.some(t => t.name === k) && 
          !selectedTags.includes(k)
        )
        setSelectedTags([...selectedTags, ...newTags])
      }
      if (data.emotion) {
        setEmotion(data.emotion)
      }
    } catch (error) {
      console.error('Error analyzing:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/inspirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type,
          imageUrl,
          imageDesc,
          emotion,
          tagIds: selectedTags.filter(id => tags.some(t => t.id === id)),
        })
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating inspiration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const addNewTag = async () => {
    if (!newTag.trim()) return

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTag })
      })
      const data = await res.json()
      setSelectedTags([...selectedTags, data.id])
      setNewTag('')
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          记录灵感
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button
            variant={type === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setType('text')}
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            文字
          </Button>
          <Button
            variant={type === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            图片
          </Button>
          <Button
            variant={type === 'voice' ? 'default' : 'outline'}
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-1" />
                停止
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1" />
                语音
              </>
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {imageUrl && (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="w-full max-h-64 object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setImageUrl('')
                setImageDesc('')
                setType('text')
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label>内容</Label>
          <Textarea
            placeholder="记录你的灵感..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content.trim()}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              AI分析
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>情绪</Label>
          <div className="flex flex-wrap gap-2">
            {emotions.map((e) => (
              <Badge
                key={e.value}
                variant={emotion === e.value ? 'default' : 'outline'}
                className={cn('cursor-pointer', emotion === e.value && e.color)}
                onClick={() => setEmotion(e.value)}
              >
                {e.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>标签</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                style={{ 
                  backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                  borderColor: tag.color
                }}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="添加新标签"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="max-w-[200px]"
            />
            <Button size="sm" onClick={addNewTag}>
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !content.trim()}>
            {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
