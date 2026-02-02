import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import { themes } from 'storybook/theming'
import '../src/app/globals.css'

const DARK_BG = '#0a0a12'

function DarkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: DARK_BG,
        minHeight: '100vh',
        width: '100%',
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%' }}>
        {children}
      </div>
    </div>
  )
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <DarkWrapper>
        <Story />
      </DarkWrapper>
    ),
  ],
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: DARK_BG },
        { name: 'light', value: '#f5f5f7' },
      ],
    },
    docs: {
      theme: themes.dark,
    },
  },
}

export default preview
