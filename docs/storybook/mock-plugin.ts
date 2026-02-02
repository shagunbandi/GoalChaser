import type { Plugin } from '@/sdk'
import type { PluginPageProps } from '@/sdk'

const noOp = async () => {}
const noOpReturnTrue = async () => true
const noOpReturnNull = async () => null
const noOpReturnRecord = async () => ({})

function DemoPage(_props: PluginPageProps) {
  return null
}

export const mockPlugin: Plugin = {
  id: 'demo-plugin',
  metadata: {
    name: 'Demo Plugin',
    description: 'For Storybook',
    version: '1.0.0',
    author: 'Goal Chaser',
    icon: '📋',
  },
  routes: [
    {
      path: 'demo',
      component: DemoPage,
    },
  ],
  dataProvider: {
    loadDayData: noOpReturnNull,
    saveDayData: noOp,
    loadDateRange: noOpReturnRecord,
    loadConfig: noOpReturnNull,
    saveConfig: noOpReturnTrue,
  },
}
