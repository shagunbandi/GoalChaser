import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useMonthCalendar } from '@/sdk'
import { MonthCalendar } from '@/sdk'

function MonthCalendarDemo(props: { year: number; month: number }) {
  const { year, month, monthInfo, todayISO, selectedDate, prevMonth, nextMonth, setSelectedDate } =
    useMonthCalendar({
      initialYear: props.year,
      initialMonth: props.month,
    })
  return (
    <MonthCalendar
      year={year}
      month={month}
      monthInfo={monthInfo}
      todayISO={todayISO}
      selectedDate={selectedDate}
      onPrevMonth={prevMonth}
      onNextMonth={nextMonth}
      onDayClick={(iso) => setSelectedDate(iso)}
    />
  )
}

const meta = {
  title: 'SDK/MonthCalendar',
  component: MonthCalendarDemo,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', minWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    year: { control: 'number' },
    month: { control: 'number', min: 1, max: 12 },
  },
} satisfies Meta<typeof MonthCalendarDemo>

export default meta
type Story = StoryObj<typeof meta>

export const CurrentMonth: Story = {
  args: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  },
}

export const January: Story = {
  args: { year: 2025, month: 1 },
}

export const WithIndicators: Story = {
  args: { year: 2025, month: 6 },
  render: () => {
    const { year, month, monthInfo, todayISO, selectedDate, prevMonth, nextMonth, setSelectedDate } =
      useMonthCalendar({ initialYear: 2025, initialMonth: 6 })
    const dayCustomizations: Record<string, { indicators?: { id: string; label: string; color: string }[] }> = {
      '2025-06-15': { indicators: [{ id: 'a', label: '2 items', color: '#A855F7' }] },
      '2025-06-20': { indicators: [{ id: 'b', label: 'Done', color: '#22c55e' }] },
    }
    return (
      <MonthCalendar
        year={year}
        month={month}
        monthInfo={monthInfo}
        todayISO={todayISO}
        selectedDate={selectedDate}
        dayCustomizations={dayCustomizations}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onDayClick={(iso) => setSelectedDate(iso)}
      />
    )
  },
}
