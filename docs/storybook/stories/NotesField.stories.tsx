import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { NotesField } from '@/sdk'

const meta = {
  title: 'SDK/NotesField',
  component: NotesField,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotesField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: '',
    onSave: async (notes) => console.log('Save:', notes),
    label: 'Notes',
    placeholder: 'Write notes...',
  },
}

export const WithValue: Story = {
  args: {
    value: 'Existing notes for this day.',
    onSave: async (notes) => console.log('Save:', notes),
    label: 'Daily notes',
    placeholder: 'Write notes...',
  },
}

export const Minimal: Story = {
  args: {
    value: 'Minimal notes field',
    onSave: async () => {},
    showButtons: false,
    showUnsavedIndicator: false,
  },
}
