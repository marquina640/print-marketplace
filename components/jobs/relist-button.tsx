'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { relistJob } from '@/app/actions/relist-job'

export function RelistButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleRelist() {
    startTransition(async () => {
      try {
        await relistJob(jobId)
        setOpen(false)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Relist
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-warm-900">Relist this request?</h2>
            <p className="text-sm text-warm-500 leading-relaxed">
              Do you want to update anything before relisting — like the deadline or description?
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setOpen(false)
                  router.push(`/jobs/${jobId}`)
                }}
                disabled={pending}
              >
                Yes, update it
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleRelist}
                loading={pending}
              >
                No, relist
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
