import { useState, useEffect, useRef } from 'react'

interface PlaceSuggestion {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface PlaceAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: {
    name: string
    placeId: string
    address: string
    coordinates: { lat: number; lng: number }
  }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'City or country',
  disabled = false,
  className = '',
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions with debouncing
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([])
      return
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer with 300ms debounce
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(value)}`
        )
        const data = await response.json()

        if (data.predictions) {
          setSuggestions(data.predictions)
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error fetching place suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    onChange(suggestion.description)
    setShowSuggestions(false)
    setSuggestions([])

    // Fetch full place details
    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(suggestion.place_id)}`
      )
      const data = await response.json()

      if (data.result) {
        const place: PlaceDetails = data.result
        onPlaceSelect({
          name: place.name,
          placeId: place.place_id,
          address: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
        })
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectPlace(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectPlace(suggestion)}
              className={`
                w-full text-left px-3 py-2.5 transition-colors
                ${
                  index === selectedIndex
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                }
                ${index !== suggestions.length - 1 ? 'border-b border-white/5' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {suggestion.structured_formatting?.main_text ||
                      suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-xs text-white/50 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
