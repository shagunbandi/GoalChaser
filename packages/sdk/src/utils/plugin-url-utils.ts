/**
 * Utility functions for building plugin navigation URLs
 */

interface BuildPluginUrlOptions {
  goalId: string
  pluginId: string
  year?: number
  month?: number
  date?: string
  additionalParams?: Record<string, string>
}

/**
 * Build a plugin page URL
 * 
 * @example
 * buildPluginUrl({ goalId: 'abc', pluginId: 'travel', year: 2024, month: 1, date: '2024-01-15' })
 * // Returns: '/goal/abc/travel/2024/1?date=2024-01-15'
 */
export function buildPluginUrl({
  goalId,
  pluginId,
  year,
  month,
  date,
  additionalParams,
}: BuildPluginUrlOptions): string {
  let url = `/goal/${goalId}/${pluginId}`

  if (year) {
    url += `/${year}`
  }

  if (month) {
    url += `/${month}`
  }

  const params = new URLSearchParams()
  
  if (date) {
    params.set('date', date)
  }

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value)
    })
  }

  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }

  return url
}
