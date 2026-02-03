import { NextRequest, NextResponse } from 'next/server'
import { getPluginActionHandler } from '@/lib/plugin-action-handlers'

/**
 * Thin wrapper: delegates plugin-specific API actions to plugin or core handlers.
 * Body: { pluginId: string, action: string, payload?: unknown }
 * Use pluginId '_core' for core-only actions (e.g. extract).
 * Uses server-only handler map so this route does not pull in React or plugin UI.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      pluginId?: string
      action?: string
      payload?: unknown
    }
    const { pluginId, action, payload } = body

    if (!pluginId || !action) {
      return NextResponse.json(
        { error: 'pluginId and action are required' },
        { status: 400 }
      )
    }

    const handler = getPluginActionHandler(pluginId, action)
    if (!handler || typeof handler !== 'function') {
      return NextResponse.json(
        { error: `Action not found: ${pluginId}.${action}` },
        { status: 404 }
      )
    }

    const result = await handler(payload)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[plugin-action] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
