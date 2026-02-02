import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ContentLoader } from '@/sdk'

const meta = {
  title: 'SDK/ContentLoader',
  component: ContentLoader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContentLoader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const CustomColor: Story = {
  args: { color: '#A855F7' },
}
