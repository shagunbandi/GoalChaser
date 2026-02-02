import { NextRequest, NextResponse } from 'next/server'

/**
 * Google Places Autocomplete API proxy
 * Keeps the API key secure on the backend
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const input = searchParams.get('input')

  if (!input || input.trim().length === 0) {
    return NextResponse.json({ predictions: [] })
  }

  try {
    // Call Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.append('input', input)
    url.searchParams.append('key', apiKey)
    // No types restriction - allows everything: cities, countries, hotels, restaurants, attractions, etc.
    
    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data)
      return NextResponse.json(
        { error: data.error_message || 'Places API error' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error calling Google Places API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 500 }
    )
  }
}
