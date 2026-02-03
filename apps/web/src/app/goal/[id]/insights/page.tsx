import { InsightsDashboard } from '@/components/features/insights/InsightsDashboard'

interface InsightsPageProps {
  params: Promise<{ id: string }>
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-6">
      <InsightsDashboard goalId={id} />
    </div>
  )
}
