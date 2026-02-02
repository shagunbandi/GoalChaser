import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MetricCard } from '@/sdk'

const meta = {
  title: 'SDK/MetricCard',
  component: MetricCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MetricCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Average Score',
    value: 7.5,
    unit: '/10',
    icon: '📊',
    color: '#007AFF',
  },
}

export const WithTrendUp: Story = {
  args: {
    label: 'This month',
    value: 8.2,
    unit: '/10',
    icon: '📈',
    trend: { direction: 'up', value: 12 },
    subtitle: 'vs last month',
  },
}

export const WithTrendDown: Story = {
  args: {
    label: 'Hours',
    value: '24',
    unit: 'hrs',
    icon: '⏱️',
    trend: { direction: 'down', value: 5 },
  },
}
