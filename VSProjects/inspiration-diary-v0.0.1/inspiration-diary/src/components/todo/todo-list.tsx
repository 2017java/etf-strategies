'use client'

import { useState, useEffect } from 'react'
import { TodoCard } from './todo-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

interface TodoListProps {
  initialTodos: Todo[]
}

export function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState(initialTodos)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const fetchTodos = async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const res = await fetch(`/api/todos?${params}`)
      const data = await res.json()
      setTodos(data)
    }

    fetchTodos()
  }, [statusFilter, priorityFilter])

  const handleUpdate = (id: string, data: Partial<Todo>) => {
    setTodos(prev =>
      prev.map(todo => todo.id === id ? { ...todo, ...data } : todo)
    )
  }

  const handleDelete = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }

  const pendingTodos = todos.filter(t => t.status === 'pending')
  const inProgressTodos = todos.filter(t => t.status === 'in_progress')
  const doneTodos = todos.filter(t => t.status === 'done')

  const renderTodoList = (todoList: Todo[]) => {
    if (todoList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          暂无待办事项
        </div>
      )
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {todoList.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待办</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="done">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部优先级</SelectItem>
            <SelectItem value="high">高</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="low">低</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            全部 ({todos.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            待办 ({pendingTodos.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            进行中 ({inProgressTodos.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            已完成 ({doneTodos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderTodoList(todos)}
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          {renderTodoList(pendingTodos)}
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          {renderTodoList(inProgressTodos)}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {renderTodoList(doneTodos)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
