'use client'

import { useState, useTransition } from 'react'
import { deleteJob } from '@/app/actions/delete-job'

export function DeleteJobButton({ jobId, title }: { jobId: string; title: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteJob(jobId)
        setConfirm(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  if (confirm) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-red-600 font-medium">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
        >
          {pending ? '…' : 'Yes'}
        </button>
        <button
          onClick={() => { setConfirm(false); setError(null) }}
          disabled={pending}
          className="text-xs text-warm-500 hover:text-warm-800 px-1"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
    >
      Delete
    </button>
  )
}
