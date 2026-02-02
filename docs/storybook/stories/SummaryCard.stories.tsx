import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SummaryCard, ActionButton } from '@/sdk/ui'

const meta = {
  title: 'SDK/SummaryCard',
  component: SummaryCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof SummaryCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <SummaryCard
      {...args}
      footer={
        <ActionButton variant="primary" onClick={() => {}}>
          View Details
        </ActionButton>
      }
    >
      <p className="text-white/60 text-sm p-4">Your content here.</p>
    </SummaryCard>
  ),
  args: {
    title: 'Hours Tracked',
    subtitle: '0h 50m total',
    icon: '⏱️',
    badge: '2 subjects',
    gradient: { from: '#A855F7', to: '#8B5CF6' },
  },
}

export const Minimal: Story = {
  render: (args) => (
    <SummaryCard {...args}>
      <p className="text-white/60 text-sm p-4">No badge or footer.</p>
    </SummaryCard>
  ),
  args: {
    title: 'Productivity',
    subtitle: 'Daily overview',
    icon: '📊',
  },
}
