import { prisma } from '@/lib/db'
import { InspirationForm } from '@/components/inspiration/inspiration-form'

export const dynamic = 'force-dynamic'

export default async function NewInspirationPage() {
  const tags = await prisma.tag.findMany()

  return (
    <div className="container py-6">
      <InspirationForm tags={tags as any} />
    </div>
  )
}
