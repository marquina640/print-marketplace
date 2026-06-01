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
      {/* Toggle - visible to everyone */}
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
            {m === 'both' ? 'All' : m === 'jobs' ? `Requests (${jobs.length})` : `Makers (${printers.length})`}
          </button>
        ))}
      </div>

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
          <span>No pins yet - addresses will appear once requests and makers add their location.</span>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-warm-200 shadow-sm h-[580px]">
        <LeafletMap jobs={jobs} printers={printers} filter={mode} />
      </div>

      {/* Cards below map */}
      {showPrinters && printers.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-3">Makers on the platform</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {printers.slice(0, 8).map((p) => (
              <a key={p.id} href={`/makers/${p.id}`}
                className="rounded-xl border border-warm-200 bg-white p-4 hover:border-ink-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-ink-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(p.display_name ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-warm-900 truncate">{p.display_name ?? 'Anonymous'}</p>
                    {p.city && <p className="text-[11px] text-warm-400 truncate">{p.city}</p>}
                  </div>
                </div>
                {p.certLevel > 0 && (
                  <span className="inline-block rounded-full bg-gold-50 border border-gold-200 px-2 py-0.5 text-[10px] font-bold text-gold-700">
                    {'★'.repeat(p.certLevel)} Certified
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {showJobs && jobs.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-3">Open requests near you</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobs.slice(0, 6).map((j) => (
              <a key={j.id} href={`/jobs/${j.id}`}
                className="rounded-xl border border-warm-200 bg-white p-4 hover:border-ink-300 hover:shadow-sm transition-all">
                <p className="text-sm font-semibold text-warm-900 truncate mb-1">{j.title}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-warm-100 border border-warm-200 px-2 py-0.5 text-[11px] text-warm-600">{j.material}</span>
                  {j.budget > 0 && <span className="text-xs font-bold text-ink-900">${j.budget.toFixed(0)}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
