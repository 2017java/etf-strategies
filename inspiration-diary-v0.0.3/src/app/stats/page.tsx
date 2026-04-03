import { StatsDashboard } from '@/components/stats/stats-dashboard'

export const dynamic = 'force-dynamic'

export default function StatsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">统计分析</h1>
      <StatsDashboard />
    </div>
  )
}
