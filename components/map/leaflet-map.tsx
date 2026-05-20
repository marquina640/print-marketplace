'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Zurich center
const ZURICH: [number, number] = [47.3769, 8.5417]

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

interface LeafletMapProps {
  jobs: JobPin[]
  printers: PrinterPin[]
  filter: 'both' | 'jobs' | 'printers'
}

export function LeafletMap({ jobs, printers, filter }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView(ZURICH, 12)
      leafletRef.current = { map, L }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      renderMarkers({ map, L })
    })

    return () => {
      if (leafletRef.current?.map) {
        leafletRef.current.map.remove()
        leafletRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!leafletRef.current) return
    const { map, L } = leafletRef.current
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    renderMarkers({ map, L })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, jobs, printers])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderMarkers({ map, L }: { map: any; L: any }) {
    const jobIcon = L.divIcon({
      html: `<div style="background:#4f46e5;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">J</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
    const printerIcon = L.divIcon({
      html: `<div style="background:#ca8a04;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">P</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    if (filter !== 'printers') {
      jobs.forEach((job) => {
        const m = L.marker([job.lat, job.lng], { icon: jobIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <p style="font-weight:600;margin:0 0 4px">${job.title}</p>
              <p style="color:#6b7280;font-size:12px;margin:0 0 2px">${job.material}</p>
              <p style="color:#4f46e5;font-size:12px;font-weight:600;margin:0">CHF ${job.budget.toFixed(0)}</p>
              <a href="/jobs/${job.id}" style="display:inline-block;margin-top:8px;font-size:12px;color:#4f46e5">View request →</a>
            </div>
          `)
        markersRef.current.push(m)
      })
    }

    if (filter !== 'jobs') {
      printers.forEach((printer) => {
        const name = printer.display_name ?? 'Maker'
        const certLabels = ['Community', 'Verified', 'Engineering', 'Production']
        const certLabel = certLabels[printer.certLevel] ?? 'Community'
        const m = L.marker([printer.lat, printer.lng], { icon: printerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:140px">
              <p style="font-weight:600;margin:0 0 4px">${name}</p>
              ${printer.city ? `<p style="color:#6b7280;font-size:12px;margin:0 0 2px">📍 ${printer.city}</p>` : ''}
              <p style="color:#ca8a04;font-size:11px;margin:0">★ ${certLabel}</p>
              <a href="/makers/${printer.id}" style="display:inline-block;margin-top:8px;font-size:12px;color:#4f46e5">View profile →</a>
            </div>
          `)
        markersRef.current.push(m)
      })
    }
  }

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
}
