import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Modal } from '@/sdk'

const meta = {
  title: 'SDK/Modal',
  component: Modal,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    title: 'Example modal',
    onClose: () => {},
    children: <p className="text-white/80">Modal body content</p>,
  },
}

export const WithFooter: Story = {
  args: {
    open: true,
    title: 'Confirm action',
    onClose: () => {},
    children: <p className="text-white/80">Are you sure you want to continue?</p>,
    footer: (
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 rounded-lg bg-white/10 text-white/80">Cancel</button>
        <button className="px-4 py-2 rounded-lg bg-[#007AFF] text-white">Confirm</button>
      </div>
    ),
  },
}

export const Closed: Story = {
  args: {
    open: false,
    title: 'Example modal',
    onClose: () => {},
    children: <p className="text-white/80">(Nothing shown when closed)</p>,
  },
}
