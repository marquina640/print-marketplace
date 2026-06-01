'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelJob } from '@/app/actions/cancel-job'

interface Props {
  jobId: string
  quoteCount: number
}

export function CancelJobButton({ jobId, quoteCount }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleCancel() {
    setLoading(true)
    setError(null)
    try {
      await cancelJob(jobId)
      setOpen(false)
      router.push('/dashboard/client?cancelled=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-warm-400 hover:text-red-500 transition-colors underline underline-offset-2"
      >
        Cancel this request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-warm-900">Cancel this request?</h3>
                <p className="text-sm text-warm-500 mt-1">
                  {quoteCount > 0
                    ? `This will close the request and notify the ${quoteCount} maker${quoteCount !== 1 ? 's' : ''} who quoted.`
                    : 'This will permanently close the request.'}
                  {' '}This cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setOpen(false); setError(null) }}
                disabled={loading}
                className="flex-1 rounded-xl border border-warm-300 px-4 py-2.5 text-sm font-medium text-warm-700 hover:bg-warm-50 transition-colors disabled:opacity-50"
              >
                Keep request
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cancelling…
                  </>
                ) : 'Yes, cancel it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
