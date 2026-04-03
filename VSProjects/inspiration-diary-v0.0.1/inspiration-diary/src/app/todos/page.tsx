import { prisma } from '@/lib/db'
import { TodoList } from '@/components/todo/todo-list'

export const dynamic = 'force-dynamic'

export default async function TodosPage() {
  const todos = await prisma.todo.findMany({
    include: {
      inspiration: true,
      subTasks: true
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  return (
    <div className="container py-6">
      <TodoList initialTodos={todos as any} />
    </div>
  )
}
