import type { PluginDataProvider, PluginContext } from '@/sdk'

export class AgendaDataProvider implements PluginDataProvider<any> {
  async loadDayData(context: PluginContext, date: string): Promise<any | null> { return null }
  async loadDateRange(context: PluginContext, startDate: string, endDate: string): Promise<Record<string, any>> { return {} }
  async saveDayData(context: PluginContext, date: string, data: any): Promise<boolean> { return true }
}
