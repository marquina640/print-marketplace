'use client'

import { useState, useEffect } from 'react'
import { ListingCard } from '@/components/listings/listing-card'

type Listing = {
  id: string
  title: string
  price: number
  currency: string
  photos: string[]
  category: string | null
  shipping_available: boolean
  pickup_available: boolean
  local_delivery_available: boolean
  maker_id: string
  maker_name: string | null
  maker_city: string | null
  maker_lat: number | null
  maker_lng: number | null
}

type Tab = 'global' | 'near' | 'for_you'

interface Props {
  allListings: Listing[]
  followedMakerIds: string[]
  userId: string | null
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function FeedClient({ allListings, followedMakerIds, userId }: Props) {
  const [tab, setTab]           = useState<Tab>('global')
  const [userLat, setUserLat]   = useState<number | null>(null)
  const [userLng, setUserLng]   = useState<number | null>(null)
  const [locAsked, setLocAsked] = useState(false)

  useEffect(() => {
    // Try cached location first
    try {
      const cached = localStorage.getItem('pmh_user_location')
      if (cached) {
        const { lat, lng } = JSON.parse(cached)
        setUserLat(lat); setUserLng(lng)
      }
    } catch {}
  }, [])

  function requestLocation() {
    if (locAsked) return
    setLocAsked(true)
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      setUserLat(lat); setUserLng(lng)
      try { localStorage.setItem('pmh_user_location', JSON.stringify({ lat, lng })) } catch {}
    })
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'global',  label: 'Global' },
    { key: 'near',    label: 'Near you' },
    { key: 'for_you', label: 'For you' },
  ]

  let displayed = allListings
  if (tab === 'near') {
    if (!userLat || !userLng) {
      displayed = []
    } else {
      displayed = allListings
        .filter(l => l.maker_lat != null && l.maker_lng != null)
        .map(l => ({ ...l, _dist: distanceKm(userLat, userLng, l.maker_lat!, l.maker_lng!) }))
        .filter((l: any) => l._dist <= 100)
        .sort((a: any, b: any) => a._dist - b._dist) as Listing[]
    }
  } else if (tab === 'for_you') {
    if (followedMakerIds.length === 0) {
      displayed = []
    } else {
      displayed = allListings.filter(l => followedMakerIds.includes(l.maker_id))
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 rounded-2xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'near') requestLocation() }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-ink-900 shadow-sm' : 'text-warm-500 hover:text-ink-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Empty states */}
      {tab === 'near' && !userLat && (
        <div className="text-center py-16 text-warm-400">
          <p className="text-2xl mb-2">📍</p>
          <p className="font-medium text-ink-700">Allow location access</p>
          <p className="text-sm mt-1">We need your location to show nearby listings.</p>
          <button onClick={requestLocation}
            className="mt-4 px-4 py-2 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-700">
            Share my location
          </button>
        </div>
      )}

      {tab === 'for_you' && followedMakerIds.length === 0 && (
        <div className="text-center py-16 text-warm-400">
          <p className="text-2xl mb-2">🤝</p>
          <p className="font-medium text-ink-700">Follow makers to see their listings here</p>
          <p className="text-sm mt-1">Visit a maker profile and hit Follow.</p>
        </div>
      )}

      {displayed.length === 0 && (tab === 'global' || (tab === 'near' && userLat) || (tab === 'for_you' && followedMakerIds.length > 0)) && (
        <div className="text-center py-16 text-warm-400">
          <p className="text-sm">No listings found.</p>
        </div>
      )}

      {/* Grid */}
      {displayed.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayed.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}
