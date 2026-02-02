import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Tabs } from '@/sdk'

function TabsWrapper() {
  const [activeTab, setActiveTab] = useState('overview')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'settings', label: 'Settings' },
  ]
  return (
    <div className="w-full max-w-2xl">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
        Active: {activeTab}
      </div>
    </div>
  )
}

const meta = {
  title: 'SDK/Tabs',
  component: TabsWrapper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof TabsWrapper>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <TabsWrapper />,
}
