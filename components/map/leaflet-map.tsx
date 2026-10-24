'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

const EUROPE: [number, number] = [47.5, 8.5]
const CACHE_KEY = 'pmh_user_location'

function getCachedLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function setCachedLocation(lat: number, lng: number) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lng })) } catch {}
}

interface JobPin {
  id: string
  title: string
  material: string
  budget: number | null
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

  // Keep latest props in refs so async callbacks never use stale values
  const filterRef = useRef(filter)
  const jobsRef = useRef(jobs)
  const printersRef = useRef(printers)
  filterRef.current = filter
  jobsRef.current = jobs
  printersRef.current = printers

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderMarkers({ map, L }: { map: any; L: any }) {
    const currentFilter = filterRef.current
    const currentJobs = jobsRef.current
    const currentPrinters = printersRef.current

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const iconStyle = 'border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;pointer-events:auto;'
    const jobIcon = L.divIcon({
      html: `<div style="background:#4f46e5;color:white;${iconStyle}">J</div>`,
      className: 'pmh-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
    const printerIcon = L.divIcon({
      html: `<div style="background:#ca8a04;color:white;${iconStyle}">P</div>`,
      className: 'pmh-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    const coordCount: Record<string, number> = {}
    function jitter(lat: number, lng: number): [number, number] {
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
      coordCount[key] = (coordCount[key] ?? 0) + 1
      const n = coordCount[key] - 1
      if (n === 0) return [lat, lng]
      const angle = (n * 137.5 * Math.PI) / 180
      const offset = 0.0006 * Math.ceil(n / 6)
      return [lat + offset * Math.cos(angle), lng + offset * Math.sin(angle)]
    }

    if (currentFilter !== 'printers') {
      currentJobs.forEach((job) => {
        const [jLat, jLng] = jitter(job.lat, job.lng)
        const budgetText = job.budget != null ? `CHF ${job.budget.toFixed(0)}` : 'Budget flexible'
        const popup = L.popup({ maxWidth: 220 }).setContent(`
          <div style="font-family:sans-serif;min-width:160px">
            <p style="font-weight:600;margin:0 0 4px">${job.title}</p>
            <p style="color:#6b7280;font-size:12px;margin:0 0 2px">${job.material}</p>
            <p style="color:#4f46e5;font-size:12px;font-weight:600;margin:0">${budgetText}</p>
            <a href="/jobs/${job.id}" style="display:inline-block;margin-top:8px;font-size:12px;color:#4f46e5">View request →</a>
          </div>
        `)
        const m = L.marker([jLat, jLng], { icon: jobIcon, interactive: true })
          .addTo(map)
          .bindPopup(popup)
        markersRef.current.push(m)
      })
    }

    if (currentFilter !== 'jobs') {
      currentPrinters.forEach((printer) => {
        const name = printer.display_name ?? 'Maker'
        const certLabels = ['Community', 'Verified', 'Engineering', 'Production']
        const certLabel = certLabels[printer.certLevel] ?? 'Community'
        const [jLat, jLng] = jitter(printer.lat, printer.lng)
        const popup = L.popup({ maxWidth: 200 }).setContent(`
          <div style="font-family:sans-serif;min-width:140px">
            <p style="font-weight:600;margin:0 0 4px">${name}</p>
            ${printer.city ? `<p style="color:#6b7280;font-size:12px;margin:0 0 2px">${printer.city}</p>` : ''}
            <p style="color:#ca8a04;font-size:11px;margin:0">★ ${certLabel}</p>
            <a href="/makers/${printer.id}" style="display:inline-block;margin-top:8px;font-size:12px;color:#4f46e5">View profile →</a>
          </div>
        `)
        const m = L.marker([jLat, jLng], { icon: printerIcon, interactive: true })
          .addTo(map)
          .bindPopup(popup)
        markersRef.current.push(m)
      })
    }
  }

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const cached = getCachedLocation()
      const initialCenter: [number, number] = cached ? [cached.lat, cached.lng] : EUROPE
      const initialZoom = cached ? 11 : 5

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const container = mapRef.current! as any
      if (container._leaflet_id) return
      const map = L.map(container).setView(initialCenter, initialZoom)
      leafletRef.current = { map, L }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Use refs so this callback always reads the latest props
      renderMarkers({ map, L })

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords
            setCachedLocation(lat, lng)
            if (!cached) map.setView([lat, lng], 11)
          },
          () => {},
          { timeout: 6000 }
        )
      }
    })

    return () => {
      if (leafletRef.current?.map) {
        leafletRef.current.map.remove()
        leafletRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render markers whenever filter or data changes
  useEffect(() => {
    if (!leafletRef.current) return
    const { map, L } = leafletRef.current
    renderMarkers({ map, L })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, jobs, printers])

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
}
