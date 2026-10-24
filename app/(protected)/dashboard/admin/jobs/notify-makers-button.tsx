'use client'

import { useState, useTransition } from 'react'
import { notifyMakersAdmin } from '@/app/actions/notify-makers-admin'

export function NotifyMakersButton({
  jobId, jobLat, jobLng, jobTitle, jobMaterial, jobType,
}: {
  jobId: string
  jobLat: number | null
  jobLng: number | null
  jobTitle: string
  jobMaterial: string
  jobType: string
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!jobLat || !jobLng) return <span className="text-xs text-warm-300">No location</span>
  if (result) return <span className="text-xs text-emerald-600 font-medium">{result.sent} notified ✓</span>

  function handle() {
    setError(null)
    startTransition(async () => {
      try {
        const r = await notifyMakersAdmin({ jobId, jobLat, jobLng, jobTitle, jobMaterial, jobType })
        setResult(r)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={handle}
        disabled={pending}
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
      >
        {pending ? '…' : 'Notify makers'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  )
}
