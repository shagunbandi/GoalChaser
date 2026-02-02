import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { NotFoundState } from '@/sdk'

const meta = {
  title: 'SDK/NotFoundState',
  component: NotFoundState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotFoundState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    fullScreen: false,
    message: 'Goal not found',
  },
}

export const FullScreen: Story = {
  args: {
    fullScreen: true,
    message: 'This goal could not be found.',
  },
}

export const CustomMessage: Story = {
  args: {
    fullScreen: false,
    message: 'This goal could not be found.',
  },
}
