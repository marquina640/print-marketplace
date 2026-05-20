'use client'

import { useEffect, useRef, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

const LIBRARIES: ('places')[] = ['places']

export interface AddressResult {
  address: string
  lat: number
  lng: number
  city?: string
}

interface Props {
  label?: string
  placeholder?: string
  hint?: string
  defaultValue?: string
  required?: boolean
  onSelect: (result: AddressResult) => void
}

export function AddressAutocomplete({ label, placeholder, hint, defaultValue, required, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const onSelectRef = useRef(onSelect)
  const [inputValue, setInputValue] = useState(defaultValue ?? '')

  // Keep the callback ref current without re-running the effect
  useEffect(() => { onSelectRef.current = onSelect })

  // Sync input when defaultValue changes (e.g. after async profile load)
  useEffect(() => {
    if (defaultValue && !autocompleteRef.current) {
      setInputValue(defaultValue)
    }
  }, [defaultValue])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
    libraries: LIBRARIES,
  })

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
      fields: ['formatted_address', 'geometry', 'address_components'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace()
      const lat = place.geometry?.location?.lat()
      const lng = place.geometry?.location?.lng()
      const address = place.formatted_address ?? ''

      const cityComponent = place.address_components?.find((c) =>
        c.types.includes('locality') || c.types.includes('postal_town')
      )
      const city = cityComponent?.long_name

      if (lat != null && lng != null) {
        setInputValue(address)
        onSelectRef.current({ address, lat, lng, city })
      }
    })
  }, [isLoaded])

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="form-label">
          {label}{required && ' *'}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={isLoaded ? placeholder : 'Loading…'}
        required={required}
        className="flex h-9 w-full rounded-lg border border-warm-300 bg-white px-3 py-1.5 text-sm text-warm-900 shadow-sm transition-colors placeholder:text-warm-400 focus:border-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-200 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {hint && <p className="text-xs text-warm-400">{hint}</p>}
    </div>
  )
}
