import { NextRequest, NextResponse } from 'next/server'

/**
 * Google Places Details API proxy
 * Fetches full place details including coordinates
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
  const placeId = searchParams.get('placeId')

  if (!placeId) {
    return NextResponse.json(
      { error: 'Place ID is required' },
      { status: 400 }
    )
  }

  try {
    // Call Google Places Details API
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.append('place_id', placeId)
    url.searchParams.append('key', apiKey)
    url.searchParams.append('fields', 'place_id,name,formatted_address,geometry,types')
    
    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('Google Places Details API error:', data)
      return NextResponse.json(
        { error: data.error_message || 'Places API error' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error calling Google Places Details API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    )
  }
}
