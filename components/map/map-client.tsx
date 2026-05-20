'use client'

import { useState, useCallback, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'

const LIBRARIES: ('places')[] = ['places']

type Job = { id: string; title: string; material: string; budget: number; lat: number; lng: number }
type Printer = { id: string; display_name: string | null; city: string | null; certLevel: number; lat: number; lng: number }

interface Props {
  jobs: Job[]
  printers: Printer[]
  defaultMode: 'jobs' | 'printers' | 'both'
}

const JOB_ICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`
)}`

const MAKER_ICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/><circle cx="14" cy="14" r="6" fill="#f59e0b"/></svg>`
)}`

const CERT_LABELS = ['', '★', '★★', '★★★', '✦']

function computeCenter(jobs: Job[], printers: Printer[]): { lat: number; lng: number } {
  const all = [
    ...jobs.map((j) => ({ lat: j.lat, lng: j.lng })),
    ...printers.map((p) => ({ lat: p.lat, lng: p.lng })),
  ]
  if (all.length === 0) return { lat: 47.3769, lng: 8.5417 }
  return {
    lat: all.reduce((s, p) => s + p.lat, 0) / all.length,
    lng: all.reduce((s, p) => s + p.lng, 0) / all.length,
  }
}

export function MapClient({ jobs, printers, defaultMode }: Props) {
  const [mode, setMode] = useState(defaultMode)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
    libraries: LIBRARIES,
  })

  const center = useMemo(() => computeCenter(jobs, printers), [jobs, printers])
  const onMapClick = useCallback(() => { setSelectedJob(null); setSelectedPrinter(null) }, [])

  if (loadError) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold text-red-600 mb-1">Failed to load Google Maps</p>
        <p className="text-sm text-warm-500">Check that your API key is valid and the Maps JavaScript API is enabled.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="card flex items-center justify-center h-[600px]">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" />
      </div>
    )
  }

  const showJobs     = mode === 'jobs'     || mode === 'both'
  const showPrinters = mode === 'printers' || mode === 'both'

  return (
    <div className="space-y-3">
      {/* Toggle — only for admin */}
      {defaultMode === 'both' && (
        <div className="flex gap-2">
          {(['both', 'jobs', 'printers'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                mode === m
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-warm-600 border-warm-300 hover:border-ink-400'
              }`}
            >
              {m === 'both' ? 'All' : m === 'jobs' ? 'Jobs' : 'Makers'}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-warm-500">
        {showJobs && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-400 border border-amber-600" />
            Open jobs ({jobs.length})
          </span>
        )}
        {showPrinters && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-ink-900 border border-ink-700" />
            Makers ({printers.length})
          </span>
        )}
        {jobs.length === 0 && printers.length === 0 && (
          <span>No pins yet — addresses will appear once jobs and makers add their location.</span>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-warm-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '580px' }}
          center={center}
          zoom={jobs.length + printers.length === 0 ? 11 : 12}
          onClick={onMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            styles: [
              { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit',      stylers: [{ visibility: 'off' }] },
            ],
          }}
        >
          {showJobs && jobs.map((job) => (
            <MarkerF
              key={`job-${job.id}`}
              position={{ lat: job.lat, lng: job.lng }}
              icon={{ url: JOB_ICON, scaledSize: new window.google.maps.Size(28, 36) }}
              onClick={() => { setSelectedJob(job); setSelectedPrinter(null) }}
            />
          ))}

          {showPrinters && printers.map((p) => (
            <MarkerF
              key={`printer-${p.id}`}
              position={{ lat: p.lat, lng: p.lng }}
              icon={{ url: MAKER_ICON, scaledSize: new window.google.maps.Size(28, 36) }}
              onClick={() => { setSelectedPrinter(p); setSelectedJob(null) }}
            />
          ))}

          {selectedJob && (
            <InfoWindowF
              position={{ lat: selectedJob.lat, lng: selectedJob.lng }}
              onCloseClick={() => setSelectedJob(null)}
            >
              <div className="p-1 min-w-[180px]">
                <p className="font-bold text-ink-900 text-sm mb-0.5">{selectedJob.title}</p>
                <p className="text-xs text-warm-500 mb-2">
                  {selectedJob.material}{selectedJob.budget ? ` · CHF ${selectedJob.budget}` : ''}
                </p>
                <a
                  href={`/jobs/${selectedJob.id}`}
                  className="inline-block rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-ink-900 hover:bg-amber-500"
                >
                  View Job →
                </a>
              </div>
            </InfoWindowF>
          )}

          {selectedPrinter && (
            <InfoWindowF
              position={{ lat: selectedPrinter.lat, lng: selectedPrinter.lng }}
              onCloseClick={() => setSelectedPrinter(null)}
            >
              <div className="p-1 min-w-[180px]">
                <p className="font-bold text-ink-900 text-sm mb-0.5">
                  {selectedPrinter.display_name ?? 'Maker'}
                </p>
                <p className="text-xs text-warm-500 mb-0.5">{selectedPrinter.city}</p>
                {selectedPrinter.certLevel > 0 && (
                  <p className="text-xs text-amber-600 font-semibold mb-2">
                    {CERT_LABELS[selectedPrinter.certLevel] ?? ''} Level {selectedPrinter.certLevel}
                  </p>
                )}
                <a
                  href={`/makers/${selectedPrinter.id}`}
                  className="inline-block rounded-lg bg-ink-900 px-3 py-1 text-xs font-bold text-white hover:bg-ink-800"
                >
                  View Profile →
                </a>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  )
}
