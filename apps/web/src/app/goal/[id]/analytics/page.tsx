import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard'

interface AnalyticsPageProps {
  params: Promise<{ id: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-6">
      <AnalyticsDashboard goalId={id} />
    </div>
  )
}
