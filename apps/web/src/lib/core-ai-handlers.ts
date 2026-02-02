import OpenAI from 'openai'
import type {
  AIExtractResponse,
  AIExtractionResult,
  PluginAISchema,
} from '@goal-chaser/sdk/types/ai.types'

interface ExtractPayload {
  notes: string
  date?: string
  goalId?: string
  schemas: PluginAISchema[]
}

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

function buildExtractionPrompt(notes: string, schemas: PluginAISchema[]): string {
  const schemaDescriptions = schemas
    .map((schema) => {
      const fieldsDescription = schema.fields
        .map((field) => {
          let desc = `  - ${field.key} (${field.type}): ${field.aiHint}`
          if (
            field.validation?.min !== undefined ||
            field.validation?.max !== undefined
          ) {
            desc += ` [range: ${field.validation.min ?? 'any'} to ${field.validation.max ?? 'any'}]`
          }
          if (field.validation?.options) {
            desc += ` [options: ${field.validation.options.map((o) => o.value).join(', ')}]`
          }
          if (field.required) {
            desc += ' (required)'
          }
          return desc
        })
        .join('\n')

      let result = `Plugin: ${schema.pluginId}\nDescription: ${schema.description}\nFields:\n${fieldsDescription}`

      if (schema.examples && schema.examples.length > 0) {
        const examplesText = schema.examples
          .map(
            (ex) =>
              `  Input: "${ex.input}"\n  Output: ${JSON.stringify(ex.output)}`
          )
          .join('\n\n')
        result += `\n\nExamples:\n${examplesText}`
      }

      return result
    })
    .join('\n\n---\n\n')

  return `You are a helpful assistant that extracts structured data from user notes about their day.

Given the following user notes and plugin schemas, extract relevant data for each plugin.
Only extract data that is explicitly mentioned or strongly implied in the notes.
If no relevant data is found for a plugin, return an empty object for that plugin.

USER NOTES:
"""
${notes}
"""

PLUGIN SCHEMAS:
${schemaDescriptions}

INSTRUCTIONS:
1. Read the user notes carefully
2. For each plugin, extract data that matches the described fields
3. Only include fields where data is clearly present in the notes
4. For numeric fields, extract the number value only
5. For arrays, include all mentioned items
6. Return a JSON object with plugin IDs as keys and extracted data as values

Respond ONLY with a valid JSON object in this format:
{
  "pluginId1": { "field1": value1, "field2": value2 },
  "pluginId2": { "field1": value1 }
}

If no data can be extracted for any plugin, return: {}`
}

function parseAIResponse(
  responseText: string,
  schemas: PluginAISchema[]
): AIExtractionResult[] {
  const results: AIExtractionResult[] = []

  try {
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(cleanedResponse)

    for (const schema of schemas) {
      const pluginData = parsed[schema.pluginId]
      if (pluginData && Object.keys(pluginData).length > 0) {
        results.push({
          pluginId: schema.pluginId,
          data: pluginData,
        })
      }
    }
  } catch (error) {
    console.error('[AI Extract] Failed to parse AI response:', error)
    console.error('[AI Extract] Response was:', responseText)
  }

  return results
}

async function extract(payload: unknown): Promise<AIExtractResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const body = payload as ExtractPayload
  const { notes, schemas } = body

  if (!notes || typeof notes !== 'string') {
    throw new Error('Notes are required')
  }

  if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
    throw new Error('At least one schema is required')
  }

  const prompt = buildExtractionPrompt(notes, schemas)
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a data extraction assistant. Always respond with valid JSON only, no explanations or markdown.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  const responseText = completion.choices[0]?.message?.content || '{}'
  const results = parseAIResponse(responseText, schemas)

  return { success: true, results }
}

export const coreHandlers: Record<string, (payload: unknown) => Promise<unknown>> = {
  extract,
}
