import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LoadingState } from '@/sdk'

const meta = {
  title: 'SDK/LoadingState',
  component: LoadingState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    fullScreen: false,
    message: 'Loading...',
  },
}

export const FullScreen: Story = {
  args: {
    fullScreen: true,
    message: 'Loading your data...',
  },
}

export const CustomMessage: Story = {
  args: {
    fullScreen: false,
    message: 'Loading your data...',
  },
}
