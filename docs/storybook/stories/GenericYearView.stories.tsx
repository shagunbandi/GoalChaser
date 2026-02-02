import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GenericYearView } from '@/components/features/year-view/GenericYearView'
import type { YearViewConfig, MonthConfig, DayConfig } from '@/types/year-view-config'

function buildMonthConfig(year: number, month: number): MonthConfig {
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: DayConfig[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push({
      iso,
      dayOfMonth: day,
      weekdayIndex: (date.getDay() + 6) % 7,
      indicators: [],
    })
  }
  return {
    month,
    year,
    days,
    footer: [{ id: 'sample', type: 'summary', title: 'Sample footer', subtitle: 'Plugin data' }],
  }
}

function buildYearViewConfig(year: number): YearViewConfig {
  const todayISO = new Date().toISOString().split('T')[0]
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => buildMonthConfig(year, m))
  return {
    year,
    todayISO,
    header: {
      icon: '📅',
      title: `${year} Year View`,
      actions: [
        { id: 'prev', label: 'Prev', icon: '←', variant: 'ghost', onClick: () => {} },
        { id: 'next', label: 'Next', icon: '→', variant: 'ghost', onClick: () => {} },
      ],
    },
    months,
    modal: {
      getSections: (date) => [
        { id: 'day', type: 'summary', content: `Details for ${date}` },
      ],
      getActions: () => [{ id: 'close', label: 'Close', variant: 'ghost', onClick: () => {} }],
    },
    onPrevYear: () => {},
    onNextYear: () => {},
  }
}

const meta = {
  title: 'SDK/GenericYearView',
  component: GenericYearView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof GenericYearView>

export default meta
type Story = StoryObj<typeof meta>

export const YearlyView: Story = {
  args: {
    config: buildYearViewConfig(new Date().getFullYear()),
  },
}

export const Year2025: Story = {
  args: {
    config: buildYearViewConfig(2025),
  },
}
