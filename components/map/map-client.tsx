'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(
  () => import('./leaflet-map').then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[580px] rounded-2xl border border-warm-200 bg-warm-50"><div className="animate-spin h-8 w-8 rounded-full border-4 border-ink-600 border-t-transparent" /></div> }
)

type Job = { id: string; title: string; material: string; budget: number; lat: number; lng: number }
type Printer = { id: string; display_name: string | null; city: string | null; certLevel: number; lat: number; lng: number }

interface Props {
  jobs: Job[]
  printers: Printer[]
  defaultMode: 'jobs' | 'printers' | 'both'
}

export function MapClient({ jobs, printers, defaultMode }: Props) {
  const [mode, setMode] = useState<'jobs' | 'printers' | 'both'>(defaultMode)

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
              {m === 'both' ? 'All' : m === 'jobs' ? 'Requests' : 'Makers'}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-warm-500">
        {showJobs && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-400 border border-amber-600" />
            Open requests ({jobs.length})
          </span>
        )}
        {showPrinters && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-ink-900 border border-ink-700" />
            Makers ({printers.length})
          </span>
        )}
        {jobs.length === 0 && printers.length === 0 && (
          <span>No pins yet — addresses will appear once requests and makers add their location.</span>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-warm-200 shadow-sm h-[580px]">
        <LeafletMap jobs={jobs} printers={printers} filter={mode} />
      </div>
    </div>
  )
}
