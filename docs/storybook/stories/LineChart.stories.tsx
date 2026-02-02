import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LineChart } from '@/sdk'

const sampleLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const sampleData = [4, 6, 5, 8, 7, 9]

const meta = {
  title: 'SDK/LineChart',
  component: LineChart,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', minWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Trend',
    labels: sampleLabels,
    datasets: [{ label: 'Score', data: sampleData, color: '#007AFF' }],
    height: 200,
  },
}

export const MultipleDatasets: Story = {
  args: {
    title: 'Comparison',
    labels: sampleLabels,
    datasets: [
      { label: 'A', data: sampleData, color: '#007AFF' },
      { label: 'B', data: [5, 5, 6, 7, 6, 8], color: '#A855F7' },
    ],
    height: 240,
  },
}
