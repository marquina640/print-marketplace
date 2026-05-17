'use client'

import { useEffect, useState } from 'react'

interface JobPin {
  id: string
  title: string
  material: string
  budget: number
  lat: number
  lng: number
}

interface PrinterPin {
  id: string
  display_name: string | null
  city: string | null
  certLevel: number
  lat: number
  lng: number
}

interface MapClientProps {
  jobs: JobPin[]
  printers: PrinterPin[]
  defaultMode: 'jobs' | 'printers' | 'both'
}

type Filter = 'both' | 'jobs' | 'printers'

export function MapClient({ jobs, printers, defaultMode }: MapClientProps) {
  const [filter, setFilter] = useState<Filter>(defaultMode)
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    jobs: JobPin[]; printers: PrinterPin[]; filter: Filter
  }> | null>(null)

  useEffect(() => {
    import('./leaflet-map').then((mod) => {
      setMapComponent(() => mod.LeafletMap)
    })
  }, [])

  const showTabs = defaultMode === 'both'

  return (
    <div className="space-y-4">
      {showTabs && (
        <div className="flex gap-2">
          {(['both', 'jobs', 'printers'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-ink-700 text-white'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              {f === 'both' ? 'All' : f === 'jobs' ? `Jobs (${jobs.length})` : `Makers (${printers.length})`}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-warm-200 shadow-sm" style={{ height: '560px' }}>
        {MapComponent ? (
          <MapComponent jobs={jobs} printers={printers} filter={filter} />
        ) : (
          <div className="h-full flex items-center justify-center bg-warm-50 text-warm-400 text-sm">
            Loading map…
          </div>
        )}
      </div>

      {jobs.length === 0 && printers.length === 0 && (
        <p className="text-sm text-warm-400 text-center">
          No location data yet. Jobs and makers will appear once addresses are added.
        </p>
      )}
    </div>
  )
}
