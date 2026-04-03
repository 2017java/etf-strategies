import { prisma } from '@/lib/db'
import { InspirationDetail } from '@/components/inspiration/inspiration-detail'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InspirationPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const inspiration = await prisma.inspiration.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      todo: true
    }
  })

  if (!inspiration) {
    notFound()
  }

  return (
    <div className="container py-6">
      <InspirationDetail inspiration={inspiration as any} />
    </div>
  )
}
