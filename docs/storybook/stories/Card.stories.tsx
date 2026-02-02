import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Card } from '@/sdk'

const meta = {
  title: 'SDK/Card',
  component: Card,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <p className="p-6 text-white/80">Card content</p>
    </Card>
  ),
  args: { children: <p className="p-6 text-white/80">Card content</p> },
}

export const WithHover: Story = {
  render: (args) => (
    <Card {...args}>
      <p className="p-6 text-white/80">Hoverable card</p>
    </Card>
  ),
  args: { hover: true, children: <p className="p-6 text-white/80">Hoverable card</p> },
}

export const WithGlow: Story = {
  render: (args) => (
    <Card {...args}>
      <p className="p-6 text-white/80">Card with blue glow on hover</p>
    </Card>
  ),
  args: { hover: true, glow: 'blue', children: <p className="p-6 text-white/80">Card with blue glow on hover</p> },
}
