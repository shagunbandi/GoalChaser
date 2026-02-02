import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Drawer } from '@/sdk'

const meta = {
  title: 'SDK/Drawer',
  component: Drawer,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Settings',
    subtitle: 'Configure your preferences',
    icon: '⚙️',
    children: (
      <div className="p-6 text-white/70 text-sm space-y-4">
        <p>Drawer content goes here.</p>
        <p>Use for settings, filters, or secondary panels.</p>
      </div>
    ),
  },
}

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    title: 'Settings',
    subtitle: 'Configure your preferences',
    icon: '⚙️',
    children: <div className="p-6">(Nothing shown when closed)</div>,
  },
}
