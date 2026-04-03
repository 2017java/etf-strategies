import { prisma } from '@/lib/db'
import { InspirationList } from '@/components/inspiration/inspiration-list'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [inspirations, tags] = await Promise.all([
    prisma.inspiration.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        todo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.tag.findMany()
  ])

  return (
    <div className="container py-6">
      <InspirationList 
        initialInspirations={inspirations as any} 
        tags={tags as any}
      />
    </div>
  )
}
