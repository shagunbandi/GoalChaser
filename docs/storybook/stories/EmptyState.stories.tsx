import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { EmptyState } from '@/sdk/ui'

const meta = {
  title: 'SDK/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: '📭',
    title: 'No data yet',
    description: 'Start tracking to see your data here',
  },
}

export const WithAction: Story = {
  args: {
    icon: '📊',
    title: 'No data yet',
    description: 'Start tracking to see your stats here.',
    action: { label: 'Get started', onClick: () => {} },
  },
}

export const Custom: Story = {
  args: {
    icon: '✈️',
    title: 'No trips planned',
    description: 'Add your first destination to get started.',
  },
}
