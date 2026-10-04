'use client'

import { useState, useTransition } from 'react'
import { relistJob } from '@/app/actions/relist-job'

export function RelistJobButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleRelist() {
    setError(null)
    startTransition(async () => {
      try {
        await relistJob(jobId)
        setDone(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  if (done) return <span className="text-xs text-emerald-600 font-medium">Relisted ✓</span>

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={handleRelist}
        disabled={pending}
        className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
      >
        {pending ? '…' : 'Relist'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  )
}
