'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { markJobShipped } from '@/app/actions/escrow'

const CARRIERS = [
  'Swiss Post',
  'DHL',
  'FedEx',
  'UPS',
  'DPD',
  'GLS',
  'TNT',
  'Other',
]

export function MarkShippedButton({ jobId }: { jobId: string }) {
  const [open, setOpen]           = useState(false)
  const [inPerson, setInPerson]   = useState(false)
  const [carrier, setCarrier]     = useState('')
  const [tracking, setTracking]   = useState('')
  const [shippedDate, setDate]    = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError]         = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!inPerson && !carrier.trim()) {
      setError('Please select a shipping company.')
      return
    }

    startTransition(async () => {
      try {
        await markJobShipped(jobId, {
          inPerson,
          carrier: inPerson ? undefined : carrier,
          trackingNumber: inPerson ? undefined : tracking || undefined,
          shippedDate,
        })
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="gold">
        Mark as Shipped
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <h2 className="text-lg font-bold text-warm-900 mb-1">Confirm Shipment</h2>
            <p className="text-sm text-warm-500 mb-5">Let the client know their order is on its way.</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Delivery method toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInPerson(false)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    !inPerson
                      ? 'border-ink-600 bg-ink-50 text-ink-900'
                      : 'border-warm-200 text-warm-500 hover:border-warm-300'
                  }`}
                >
                  📦 Shipped by carrier
                </button>
                <button
                  type="button"
                  onClick={() => setInPerson(true)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    inPerson
                      ? 'border-ink-600 bg-ink-50 text-ink-900'
                      : 'border-warm-200 text-warm-500 hover:border-warm-300'
                  }`}
                >
                  🤝 Handed over in person
                </button>
              </div>

              {!inPerson && (
                <>
                  {/* Shipping company */}
                  <div>
                    <label className="block text-sm font-medium text-warm-800 mb-1.5">
                      Shipping company <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={carrier}
                      onChange={e => setCarrier(e.target.value)}
                      className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-ink-400"
                      required={!inPerson}
                    >
                      <option value="">Select carrier…</option>
                      {CARRIERS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tracking number */}
                  <div>
                    <label className="block text-sm font-medium text-warm-800 mb-1.5">
                      Tracking number <span className="text-warm-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={tracking}
                      onChange={e => setTracking(e.target.value)}
                      placeholder="e.g. 99 00 123456 789"
                      className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-ink-400"
                    />
                  </div>
                </>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-warm-800 mb-1.5">
                  {inPerson ? 'Date of handover' : 'Date shipped'}
                </label>
                <input
                  type="date"
                  value={shippedDate}
                  onChange={e => setDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-ink-400"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  className="flex-1"
                  loading={pending}
                >
                  {inPerson ? 'Confirm Handover' : 'Confirm Shipment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
