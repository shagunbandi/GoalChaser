import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AIChatInterface } from '@/sdk'
import type { PluginChatConfig } from '@/sdk'

interface DemoResult {
  title: string
  description: string
}

const mockConfig: PluginChatConfig<DemoResult, DemoResult> = {
  apiEndpoint: '/api/ai/demo-chat',
  welcomeMessage:
    "Hi! I'm here to help you set up a goal. Tell me what you'd like to achieve and I'll help you structure it.",
  buildSystemPrompt: (ctx) =>
    `You are a helpful goal coach. Today's date: ${ctx.todayISO}. Help the user define a clear goal.`,
  parseResponse: (content) => {
    const match = content.match(/Title: (.+)\nDescription: ([\s\S]+)/)
    if (match) return { title: match[1].trim(), description: match[2].trim() }
    return null
  },
  renderSummary: (result) => (
    <div className="space-y-2 text-sm text-white/80">
      <p>
        <span className="text-white/50">Title:</span> {result.title}
      </p>
      <p>
        <span className="text-white/50">Description:</span> {result.description}
      </p>
    </div>
  ),
  transformResult: (result) => result,
  labels: { send: 'Send', create: 'Create', cancel: 'Cancel' },
  styling: { primaryColor: '#8B5CF6', secondaryColor: '#7C3AED' },
}

const meta = {
  title: 'SDK/AIChatInterface',
  component: AIChatInterface,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 640, height: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AIChatInterface>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    config: mockConfig as PluginChatConfig<unknown, unknown>,
    onSubmit: async (input: unknown) => console.log('Submit:', input),
    onCancel: () => console.log('Cancel'),
    context: { todayISO: new Date().toISOString().split('T')[0] },
  },
}
