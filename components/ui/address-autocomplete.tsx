'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    housenumber?: string
    street?: string
    postcode?: string
    city?: string
    county?: string
    state?: string
    country?: string
    type?: string
  }
}

function formatLabel(f: PhotonFeature): string {
  const p = f.properties
  const line1 =
    p.street && p.housenumber ? `${p.street} ${p.housenumber}`
    : p.street ?? p.name ?? ''
  const line2 = [p.city ?? p.county, p.country].filter(Boolean).join(', ')
  return [line1, line2].filter(Boolean).join(', ')
}

export function AddressAutocomplete({ label, placeholder, hint, defaultValue, required, onSelect }: Props) {
  const [query, setQuery] = useState(defaultValue ?? '')
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasPickedRef = useRef(false)
  const onSelectRef = useRef(onSelect)

  useEffect(() => { onSelectRef.current = onSelect })

  // Sync default value when profile loads asynchronously
  useEffect(() => {
    if (!hasPickedRef.current) {
      setQuery(defaultValue ?? '')
    }
  }, [defaultValue])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 3) { setSuggestions([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=6&lang=en`,
          { headers: { 'User-Agent': 'PrintMarketHub/1.0' } }
        )
        const data = await res.json()
        setSuggestions(data.features ?? [])
        setOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    hasPickedRef.current = false
    setQuery(e.target.value)
    search(e.target.value)
  }

  function handlePick(feature: PhotonFeature) {
    const [lng, lat] = feature.geometry.coordinates
    const address = formatLabel(feature)
    const city = feature.properties.city ?? feature.properties.county ?? feature.properties.name
    hasPickedRef.current = true
    setQuery(address)
    setOpen(false)
    setSuggestions([])
    onSelectRef.current({ address, lat, lng, city })
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1 relative">
      {label && (
        <label className="form-label">{label}{required && ' *'}</label>
      )}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex h-9 w-full rounded-lg border border-warm-300 bg-white px-3 py-1.5 text-sm text-warm-900 shadow-sm transition-colors placeholder:text-warm-400 focus:border-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-200 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {hint && <p className="text-xs text-warm-400">{hint}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full mt-1 z-50 w-full rounded-xl border border-warm-200 bg-white shadow-lg overflow-hidden">
          {suggestions.map((f, i) => {
            const lbl = formatLabel(f)
            return (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handlePick(f) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-warm-800 hover:bg-warm-50 transition-colors flex items-start gap-2"
                >
                  <svg className="h-4 w-4 text-warm-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{lbl || 'Unknown location'}</span>
                </button>
              </li>
            )
          })}
          {loading && (
            <li className="px-4 py-2 text-xs text-warm-400 text-center">Searching…</li>
          )}
        </ul>
      )}
    </div>
  )
}
