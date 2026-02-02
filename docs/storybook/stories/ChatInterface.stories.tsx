import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState, useRef, useEffect } from 'react'
import { ChatInterface } from '@/sdk'
import type { ChatMessage } from '@/sdk'

function ChatInterfaceDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm here to help. What would you like to do?" },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: `You said: "${text}". (This is a demo – no API.)` },
    ])
  }

  return (
    <ChatInterface
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSend={handleSend}
      placeholder="Type your message..."
      assistantLabel="Assistant"
      labels={{ send: 'Send' }}
      styling={{ primaryColor: '#8B5CF6', secondaryColor: '#7C3AED' }}
      messagesEndRef={endRef}
    />
  )
}

const meta = {
  title: 'SDK/ChatInterface',
  component: ChatInterface,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 640, height: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatInterface>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    messages: [],
    input: '',
    onInputChange: () => {},
    onSend: () => {},
  },
  render: () => <ChatInterfaceDemo />,
}

export const WithStaticMessages: Story = {
  args: {
    messages: [
      { role: 'assistant', content: 'Welcome! How can I help?' },
      { role: 'user', content: 'I need help with my goal.' },
      { role: 'assistant', content: 'Sure, tell me more about it.' },
    ],
    input: '',
    onInputChange: () => {},
    onSend: () => {},
    placeholder: 'Type your message...',
    labels: { send: 'Send' },
    styling: { primaryColor: '#8B5CF6', secondaryColor: '#7C3AED' },
  },
}

export const WithError: Story = {
  args: {
    messages: [
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'Hello' },
    ],
    input: '',
    onInputChange: () => {},
    onSend: () => {},
    error: 'Something went wrong. Please try again.',
    placeholder: 'Type your message...',
    labels: { send: 'Send' },
    styling: { primaryColor: '#8B5CF6', secondaryColor: '#7C3AED' },
  },
}

export const Loading: Story = {
  args: {
    messages: [
      { role: 'assistant', content: 'Hi! How can I help?' },
      { role: 'user', content: 'Tell me more.' },
    ],
    input: '',
    onInputChange: () => {},
    onSend: () => {},
    isLoading: true,
    placeholder: 'Type your message...',
    labels: { send: 'Send' },
    styling: { primaryColor: '#8B5CF6', secondaryColor: '#7C3AED' },
  },
}
