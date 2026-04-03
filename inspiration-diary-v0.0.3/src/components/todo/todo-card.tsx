'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Link as LinkIcon,
  Trash2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface Todo {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  dueDate: string | null
  createdAt: string
  subTasks: SubTask[]
  inspiration?: {
    id: string
    content: string
  } | null
}

interface TodoCardProps {
  todo: Todo
  onUpdate?: (id: string, data: Partial<Todo>) => void
  onDelete?: (id: string) => void
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: '高', color: 'bg-red-500' },
  medium: { label: '中', color: 'bg-yellow-500' },
  low: { label: '低', color: 'bg-green-500' },
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  pending: { label: '待办', icon: Circle },
  in_progress: { label: '进行中', icon: Loader2 },
  done: { label: '已完成', icon: CheckCircle2 },
}

export function TodoCard({ todo, onUpdate, onDelete }: TodoCardProps) {
  const [subTasks, setSubTasks] = useState(todo.subTasks)

  const priority = priorityConfig[todo.priority] || priorityConfig.medium
  const status = statusConfig[todo.status] || statusConfig.pending
  const StatusIcon = status.icon

  const completedCount = subTasks.filter(st => st.completed).length
  const progress = subTasks.length > 0 ? (completedCount / subTasks.length) * 100 : 0

  const handleSubTaskToggle = async (subTaskId: string, completed: boolean) => {
    try {
      await fetch(`/api/todos/${todo.id}/subtasks/${subTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
      
      setSubTasks(prev =>
        prev.map(st => st.id === subTaskId ? { ...st, completed } : st)
      )
    } catch (error) {
      console.error('Error updating subtask:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      onUpdate?.(todo.id, { status: newStatus })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个待办事项吗？')) return
    
    try {
      await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE'
      })
      onDelete?.(todo.id)
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  return (
    <Card id={todo.id} className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => handleStatusChange(todo.status === 'done' ? 'pending' : 'done')}
            >
              {todo.status === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <CardTitle className={`text-base ${todo.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                {todo.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <span className={`w-2 h-2 rounded-full ${priority.color} mr-1`} />
                  {priority.label}优先级
                </Badge>
                {todo.dueDate && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(todo.dueDate)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('pending')}>
                <Circle className="h-4 w-4 mr-2" />
                标记为待办
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                <Loader2 className="h-4 w-4 mr-2" />
                标记为进行中
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                标记为已完成
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {todo.description && (
          <p className="text-sm text-muted-foreground">{todo.description}</p>
        )}

        {subTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>子任务进度</span>
              <span>{completedCount}/{subTasks.length}</span>
            </div>
            <Progress value={progress} className="h-1" />
            <div className="space-y-1">
              {subTasks.map((subTask) => (
                <div key={subTask.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={subTask.completed}
                    onCheckedChange={(checked) => 
                      handleSubTaskToggle(subTask.id, checked as boolean)
                    }
                  />
                  <span className={`text-sm ${subTask.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {subTask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {todo.inspiration && (
          <Link 
            href={`/${todo.inspiration.id}`}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <LinkIcon className="h-3 w-3" />
            关联灵感
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
