import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { AIExtractResponse, AIExtractionResult, PluginAISchema } from '@/sdk/types/ai.types'

/**
 * Extended request that includes schemas from the client
 * This avoids server-side imports of client-side code
 */
interface AIExtractRequestWithSchemas {
  notes: string
  date: string
  goalId: string
  schemas: PluginAISchema[]
}

// Lazy-initialize OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

/**
 * Build the prompt for AI extraction
 */
function buildExtractionPrompt(notes: string, schemas: PluginAISchema[]): string {
  const schemaDescriptions = schemas.map(schema => {
    const fieldsDescription = schema.fields.map(field => {
      let desc = `  - ${field.key} (${field.type}): ${field.aiHint}`
      if (field.validation?.min !== undefined || field.validation?.max !== undefined) {
        desc += ` [range: ${field.validation.min ?? 'any'} to ${field.validation.max ?? 'any'}]`
      }
      if (field.validation?.options) {
        desc += ` [options: ${field.validation.options.map(o => o.value).join(', ')}]`
      }
      if (field.required) {
        desc += ' (required)'
      }
      return desc
    }).join('\n')

    let result = `Plugin: ${schema.pluginId}\nDescription: ${schema.description}\nFields:\n${fieldsDescription}`
    
    if (schema.examples && schema.examples.length > 0) {
      const examplesText = schema.examples.map(ex => 
        `  Input: "${ex.input}"\n  Output: ${JSON.stringify(ex.output)}`
      ).join('\n\n')
      result += `\n\nExamples:\n${examplesText}`
    }

    return result
  }).join('\n\n---\n\n')

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

/**
 * Parse the AI response into extraction results
 */
function parseAIResponse(
  responseText: string,
  schemas: PluginAISchema[]
): AIExtractionResult[] {
  const results: AIExtractionResult[] = []
  
  try {
    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
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

/**
 * POST /api/ai/extract
 * Extract structured data from user notes using AI
 * 
 * The client provides schemas to avoid server-side imports of client-side code.
 * The client is responsible for:
 * 1. Collecting schemas from the plugin registry
 * 2. Parsing the returned raw data using plugin's parseAIData method
 */
export async function POST(request: NextRequest): Promise<NextResponse<AIExtractResponse>> {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, results: [], error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body: AIExtractRequestWithSchemas = await request.json()
    const { notes, schemas } = body

    // Validate required fields
    if (!notes || typeof notes !== 'string') {
      return NextResponse.json(
        { success: false, results: [], error: 'Notes are required' },
        { status: 400 }
      )
    }

    if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
      return NextResponse.json(
        { success: false, results: [], error: 'At least one schema is required' },
        { status: 400 }
      )
    }

    // Build prompt
    const prompt = buildExtractionPrompt(notes, schemas)

    // Call OpenAI API
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction assistant. Always respond with valid JSON only, no explanations or markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'

    // Parse AI response into extraction results (raw data)
    // The client will use plugin's parseAIData to convert to proper plugin format
    const results = parseAIResponse(responseText, schemas)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('[AI Extract] Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { success: false, results: [], error: errorMessage },
      { status: 500 }
    )
  }
}
