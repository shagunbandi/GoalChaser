import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PluginMonthView } from '@/sdk'
import { mockPlugin } from '../mock-plugin'

const todayISO = new Date().toISOString().split('T')[0]
const year = new Date().getFullYear()
const month = new Date().getMonth() + 1

const meta = {
  title: 'SDK/PluginMonthView',
  component: PluginMonthView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    year: { control: 'number' },
    month: { control: 'number', min: 1, max: 12 },
  },
} satisfies Meta<typeof PluginMonthView>

export default meta
type Story = StoryObj<typeof meta>

export const MonthlyView: Story = {
  args: {
    plugin: mockPlugin,
    year,
    month,
    goalId: 'goal-1',
    todayISO,
    dayData: {},
    onUpdateDay: async () => {},
    onBackToYear: () => {},
  },
}

export const WithDayData: Story = {
  args: {
    plugin: mockPlugin,
    year,
    month,
    goalId: 'goal-1',
    todayISO,
    dayData: {
      [todayISO]: { notes: 'Sample entry for today' },
      '2025-02-15': { notes: 'Past entry' },
    },
    onUpdateDay: async () => {},
    onBackToYear: () => {},
  },
}
